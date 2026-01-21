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

// OpenRouter model mappings
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'openai/gpt-5': 'openai/gpt-4o',
  'openai/gpt-5-mini': 'openai/gpt-4o-mini',
  'openai/gpt-5-nano': 'openai/gpt-3.5-turbo',
  'google/gemini-2.5-pro': 'google/gemini-2.0-flash-001',
  'google/gemini-3-pro-preview': 'google/gemini-2.5-pro-preview-06-05',
  'google/gemini-2.5-flash': 'google/gemini-2.5-flash-preview-05-20',
  'google/gemini-2.5-flash-lite': 'google/gemini-2.0-flash-lite-001',
  'anthropic/claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-haiku': 'anthropic/claude-3-haiku',
  'meta/llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
  'mistral/mistral-large': 'mistralai/mistral-large-latest',
};

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

interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
  mistral?: string;
  groq?: string;
  openrouter?: string;
}

// Determine which API to use based on available keys
function getApiConfig(model: string, userKeys?: ApiKeyConfig): { 
  apiUrl: string; 
  apiKey: string; 
  modelId: string;
  provider: string;
} {
  // Priority 1: User's OpenRouter key (can access all models)
  if (userKeys?.openrouter) {
    const openRouterModelId = OPENROUTER_MODEL_MAP[model] || model;
    return {
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: userKeys.openrouter,
      modelId: openRouterModelId,
      provider: 'openrouter',
    };
  }

  // Priority 2: User's provider-specific key
  const provider = model.split('/')[0] as keyof ApiKeyConfig;
  if (userKeys?.[provider]) {
    let apiUrl = '';
    switch (provider) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        break;
      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages';
        break;
      case 'google':
        apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        break;
      case 'mistral':
        apiUrl = 'https://api.mistral.ai/v1/chat/completions';
        break;
      case 'groq':
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        break;
      default:
        apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    }
    return {
      apiUrl,
      apiKey: userKeys[provider]!,
      modelId: model,
      provider,
    };
  }

  // Priority 3: System key (Lovable AI Gateway)
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  return {
    apiUrl: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    apiKey: LOVABLE_API_KEY || '',
    modelId: model,
    provider: 'lovable',
  };
}

async function streamModel(
  model: string,
  message: string,
  sendEvent: (event: StreamEvent) => void,
  contextMessages: ContextMessage[] = [],
  userKeys?: ApiKeyConfig
): Promise<void> {
  const startTime = Date.now();
  
  try {
    const { apiUrl, apiKey, modelId, provider } = getApiConfig(model, userKeys);
    
    if (!apiKey) {
      sendEvent({ 
        type: 'error', 
        model, 
        error: 'No API key configured. Please add your API key in Settings.', 
        duration: Date.now() - startTime 
      });
      return;
    }

    console.log(`Starting stream for model: ${model} via ${provider} (using ${modelId}) with ${contextMessages.length} context messages`);
    sendEvent({ type: 'start', model });
    
    // Build messages array with context
    const messages = [
      { role: "system", content: "You are a helpful AI assistant. Provide clear, concise, and accurate responses. When responding to follow-up questions, consider the conversation context." },
      ...contextMessages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];
    
    // Build headers based on provider
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (provider === 'openrouter') {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://compareai.app";
      headers["X-Title"] = "CompareAI";
    } else if (provider === 'anthropic') {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelId,
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
        sendEvent({ type: 'error', model, error: 'Payment required. Please add credits or check your API key.', duration });
      } else if (response.status === 401) {
        sendEvent({ type: 'error', model, error: 'Invalid API key. Please check your API key in Settings.', duration });
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
    
    console.log(`${model} stream complete in ${duration}ms via ${provider}`);
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
    const { message, models, contextMessages, userApiKeys } = await req.json();
    
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

    // Parse user API keys
    const userKeys: ApiKeyConfig | undefined = userApiKeys && typeof userApiKeys === 'object' 
      ? userApiKeys 
      : undefined;

    // Allow all models when user has OpenRouter key, otherwise filter to available models
    let selectedModels = Array.isArray(models) && models.length > 0 ? models : AVAILABLE_MODELS;
    
    if (!userKeys?.openrouter) {
      selectedModels = selectedModels.filter((m: string) => AVAILABLE_MODELS.includes(m));
    }

    if (selectedModels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid models selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY && !userKeys?.openrouter && !Object.values(userKeys || {}).some(Boolean)) {
      console.error("No API keys configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please add your API keys in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keySource = userKeys?.openrouter ? 'OpenRouter (user)' : 
                     Object.values(userKeys || {}).some(Boolean) ? 'User API keys' : 
                     'Lovable AI Gateway';
    console.log(`Starting streaming for ${selectedModels.length} models via ${keySource} with ${validContextMessages.length} context messages`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        // Stream all models in parallel
        await Promise.all(
          selectedModels.map((model: string) => 
            streamModel(model, message, sendEvent, validContextMessages, userKeys)
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
