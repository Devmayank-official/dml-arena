import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AVAILABLE_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
];

interface StreamEvent {
  type: 'start' | 'delta' | 'complete' | 'error';
  model: string;
  content?: string;
  duration?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: string;
}

interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function streamModel(
  model: string,
  message: string,
  apiKey: string,
  sendEvent: (event: StreamEvent) => void,
  contextMessages: ContextMessage[] = []
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`Starting stream for model: ${model} with ${contextMessages.length} context messages`);
    sendEvent({ type: 'start', model });
    
    // Build messages array with context
    const messages = [
      { role: "system", content: "You are a helpful AI assistant. Provide clear, concise, and accurate responses. When responding to follow-up questions, consider the conversation context." },
      ...contextMessages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from ${model}:`, response.status, errorText);
      
      const duration = Date.now() - startTime;
      if (response.status === 429) {
        sendEvent({ type: 'error', model, error: 'Rate limit exceeded. Please try again later.', duration });
      } else if (response.status === 402) {
        sendEvent({ type: 'error', model, error: 'Payment required. Please add credits.', duration });
      } else {
        sendEvent({ type: 'error', model, error: `API error: ${response.status}`, duration });
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          
          if (deltaContent) {
            fullContent += deltaContent;
            sendEvent({ type: 'delta', model, content: deltaContent });
          }

          // Capture usage if present
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens || 0;
            completionTokens = parsed.usage.completion_tokens || 0;
          }
        } catch {
          // Ignore parse errors for partial JSON
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]' || !jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const deltaContent = parsed.choices?.[0]?.delta?.content;
          if (deltaContent) {
            fullContent += deltaContent;
            sendEvent({ type: 'delta', model, content: deltaContent });
          }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens || 0;
            completionTokens = parsed.usage.completion_tokens || 0;
          }
        } catch {
          // Ignore
        }
      }
    }

    const duration = Date.now() - startTime;
    
    // Estimate tokens if not provided
    const estimatedPromptTokens = promptTokens || Math.ceil(message.length / 4);
    const estimatedCompletionTokens = completionTokens || Math.ceil(fullContent.length / 4);
    
    console.log(`${model} stream complete in ${duration}ms`);
    sendEvent({
      type: 'complete',
      model,
      content: fullContent,
      duration,
      tokens: {
        prompt: estimatedPromptTokens,
        completion: estimatedCompletionTokens,
        total: estimatedPromptTokens + estimatedCompletionTokens,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error streaming ${model}:`, error);
    sendEvent({
      type: 'error',
      model,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, models, contextMessages } = await req.json();
    
    // Validate context messages
    const validContextMessages: ContextMessage[] = Array.isArray(contextMessages) 
      ? contextMessages.filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
      : [];
    
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedModels = Array.isArray(models) && models.length > 0 
      ? models.filter((m: string) => AVAILABLE_MODELS.includes(m))
      : AVAILABLE_MODELS;

    if (selectedModels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid models selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting streaming for ${selectedModels.length} models with ${validContextMessages.length} context messages`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        // Stream all models in parallel
        await Promise.all(
          selectedModels.map((model: string) => 
            streamModel(model, message, LOVABLE_API_KEY, sendEvent, validContextMessages)
          )
        );

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in compare-ai-stream function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
