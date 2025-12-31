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

interface ModelResult {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

async function queryModel(model: string, message: string, apiKey: string): Promise<ModelResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Querying model: ${model}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Provide clear, concise, and accurate responses." },
          { role: "user", content: message },
        ],
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from ${model}:`, response.status, errorText);
      
      if (response.status === 429) {
        return { model, response: '', error: 'Rate limit exceeded. Please try again later.', duration };
      }
      if (response.status === 402) {
        return { model, response: '', error: 'Payment required. Please add credits.', duration };
      }
      return { model, response: '', error: `API error: ${response.status}`, duration };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated';
    
    // Extract token usage if available
    const tokens = data.usage ? {
      prompt: data.usage.prompt_tokens || 0,
      completion: data.usage.completion_tokens || 0,
      total: data.usage.total_tokens || 0,
    } : undefined;
    
    console.log(`${model} responded in ${duration}ms, tokens: ${tokens?.total || 'N/A'}`);
    return { model, response: content, duration, tokens };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error querying ${model}:`, error);
    return { model, response: '', error: error instanceof Error ? error.message : 'Unknown error', duration };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, models } = await req.json();
    
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

    console.log(`Processing query for ${selectedModels.length} models: ${selectedModels.join(', ')}`);
    
    // Query all selected models in parallel
    const results = await Promise.all(
      selectedModels.map((model: string) => queryModel(model, message, LOVABLE_API_KEY))
    );

    console.log(`All ${results.length} models responded`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compare-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
