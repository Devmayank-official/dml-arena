import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Free plan allowed models
const FREE_PLAN_ALLOWED_MODELS = [
  'google/gemini-2.5-flash-lite',
  'openai/gpt-5-nano',
];

// Input validation limits
const MAX_MESSAGE_LENGTH = 10000;
const MAX_MODELS_COUNT = 10;
const MAX_CONTEXT_MESSAGES = 20;

// Models available with system keys (the fallback AI Gateway supports these)
const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
const SYSTEM_AVAILABLE_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5.1',
  'openai/gpt-5.2',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
];

// OpenRouter model mappings - maps internal IDs to OpenRouter model IDs
const OPENROUTER_MODEL_MAP: Record<string, string> = {
  // OpenAI models
  'openai/gpt-5': 'openai/gpt-5',
  'openai/gpt-5.1': 'openai/gpt-5.1',
  'openai/gpt-5.2': 'openai/gpt-5.2',
  'openai/gpt-5-mini': 'openai/gpt-5-mini',
  'openai/gpt-5-nano': 'openai/gpt-5-nano',
  'openai/gpt-oss-200b': 'openai/gpt-oss-200b',
  'openai/gpt-oss-120b': 'openai/gpt-oss-120b',
  'openai/gpt-oss-20b': 'openai/gpt-oss-20b',
  'openai/o1': 'openai/o1',
  'openai/o1-pro': 'openai/o1-pro',
  'openai/o3-mini': 'openai/o3-mini',
  'openai/gpt-4.1': 'openai/gpt-4.1',
  // Google models
  'google/gemini-2.5-pro': 'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview': 'google/gemini-3-pro-preview',
  'google/gemini-2.5-flash': 'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite',
  // Anthropic models
  'anthropic/claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
  'anthropic/claude-opus-4.5': 'anthropic/claude-opus-4.5',
  'anthropic/claude-opus-4': 'anthropic/claude-opus-4',
  'anthropic/claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
  'anthropic/claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus': 'anthropic/claude-3-opus',
  // DeepSeek models
  'deepseek/deepseek-r1': 'deepseek/deepseek-r1:free',
  'deepseek/deepseek-r1-0528': 'deepseek/deepseek-r1-0528:free',
  'deepseek/deepseek-v3.1': 'deepseek/deepseek-chat-v3-0324',
  'deepseek/deepseek-v3': 'deepseek/deepseek-chat',
  'deepseek/deepseek-r1-distill-70b': 'deepseek/deepseek-r1-distill-llama-70b',
  'deepseek/deepseek-prover-v2': 'deepseek/deepseek-prover-v2:free',
  // Qwen models
  'qwen/qwen3-coder': 'qwen/qwen3-coder',
  'qwen/qwen3-max': 'qwen/qwen3-max',
  'qwen/qwen3-235b': 'qwen/qwen3-235b-a22b:free',
  'qwen/qwen3-thinking': 'qwen/qwen3-235b-a22b-thinking:free',
  'qwen/qwen-2.5-72b': 'qwen/qwen-2.5-72b-instruct',
  'qwen/qwq-32b': 'qwen/qwq-32b:free',
  // xAI Grok models
  'xai/grok-4': 'x-ai/grok-4',
  'xai/grok-4-thinking': 'x-ai/grok-4-thinking',
  'xai/grok-4-fast': 'x-ai/grok-4-fast',
  'xai/grok-3': 'x-ai/grok-3-beta',
  'xai/grok-2-vision': 'x-ai/grok-2-vision-1212',
  // Zhipu GLM models
  'zhipu/glm-4.7': 'zhipuai/glm-4.7',
  'zhipu/glm-4.6-flash': 'zhipuai/glm-4.6-flash',
  'zhipu/glm-4.5': 'zhipuai/glm-4.5',
  'zhipu/glm-4-long': 'zhipuai/glm-4-plus',
  // Mistral models
  'mistral/mistral-large-2': 'mistralai/mistral-large-2411',
  'mistral/mistral-medium-3.1': 'mistralai/mistral-medium-3',
  'mistral/codestral-2508': 'mistralai/codestral-2501',
  'mistral/devstral-medium': 'mistralai/devstral-small:free',
  'mistral/pixtral-large': 'mistralai/pixtral-large-2411',
  'mistral/ministral-8b': 'mistralai/ministral-8b',
  // Meta Llama models
  'meta/llama-4-maverick': 'meta-llama/llama-4-maverick:free',
  'meta/llama-4-scout': 'meta-llama/llama-4-scout:free',
  'meta/llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct:free',
  'meta/llama-3.1-405b': 'meta-llama/llama-3.1-405b-instruct',
  'meta/llama-3.2-90b-vision': 'meta-llama/llama-3.2-90b-vision-instruct',
  // Moonshot Kimi models
  'moonshot/kimi-k2': 'moonshotai/kimi-k2:free',
  'moonshot/kimi-k2-thinking': 'moonshotai/kimi-k2-instruct',
  'moonshot/kimi-vl': 'moonshotai/kimi-vl-a3b-thinking:free',
  // Cohere models
  'cohere/command-r-plus': 'cohere/command-r-plus',
  'cohere/command-a': 'cohere/command-a',
  // NVIDIA models
  'nvidia/llama-3.1-nemotron-70b': 'nvidia/llama-3.1-nemotron-70b-instruct:free',
  // AI21 models
  'ai21/jamba-1.6-large': 'ai21/jamba-1.6-large',
  // Amazon models
  'amazon/nova-pro': 'amazon/nova-pro-v1',
  'amazon/nova-lite': 'amazon/nova-lite-v1',
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
  apiKeySource?: 'user' | 'system';
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
// Priority: User OpenRouter > User Provider Key > System OpenRouter > System AI Gateway
function getApiConfig(model: string, userKeys?: ApiKeyConfig): {
  apiUrl: string;
  apiKey: string;
  modelId: string;
  provider: string;
  isUserKey: boolean;
} {
  // Priority 1: User's OpenRouter key (can access all models)
  if (userKeys?.openrouter) {
    const openRouterModelId = OPENROUTER_MODEL_MAP[model] || model;
    return {
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: userKeys.openrouter,
      modelId: openRouterModelId,
      provider: 'openrouter',
      isUserKey: true,
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
        // Fall through to system keys
        break;
    }
    if (apiUrl) {
      return {
        apiUrl,
        apiKey: userKeys[provider]!,
        modelId: model,
        provider,
        isUserKey: true,
      };
    }
  }

  // Priority 3: System OpenRouter key (if configured) - can access all models
  const SYSTEM_OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (SYSTEM_OPENROUTER_KEY) {
    const openRouterModelId = OPENROUTER_MODEL_MAP[model] || model;
    return {
      apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: SYSTEM_OPENROUTER_KEY,
      modelId: openRouterModelId,
      provider: 'openrouter-system',
      isUserKey: false,
    };
  }

  // Priority 4: System AI Gateway (fallback) - limited to SYSTEM_AVAILABLE_MODELS
  const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
  return {
    apiUrl: AI_GATEWAY_URL,
    apiKey: AI_GATEWAY_API_KEY || '',
    modelId: model,
    provider: 'ai-gateway',
    isUserKey: false,
  };
}

// Check if system can handle the model (has OpenRouter or model is in the gateway's list)
function canSystemHandleModel(model: string): boolean {
  const SYSTEM_OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (SYSTEM_OPENROUTER_KEY) {
    return true; // System OpenRouter can handle all models
  }
  return SYSTEM_AVAILABLE_MODELS.includes(model);
}

async function streamModel(
  model: string,
  message: string,
  sendEvent: (event: StreamEvent) => void,
  contextMessages: ContextMessage[] = [],
  userKeys?: ApiKeyConfig
): Promise<void> {
  const startTime = Date.now();
  let isUserKey = false;
  
  try {
    const config = getApiConfig(model, userKeys);
    const { apiUrl, apiKey, modelId, provider } = config;
    isUserKey = config.isUserKey;
    
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
    
    if (provider === 'openrouter' || provider === 'openrouter-system') {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://dmlarena.app";
      headers["X-Title"] = "DML Arena";
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
    
    console.log(`${model} stream complete in ${duration}ms via ${provider} (${isUserKey ? 'user key' : 'system key'})`);
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
      apiKeySource: isUserKey ? 'user' : 'system',
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
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // ========== GET SUBSCRIPTION FOR SERVER-SIDE PLAN ENFORCEMENT ==========
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPlan = subscription.plan as 'free' | 'pro';

    // ========== INPUT VALIDATION ==========
    const { message, models, contextMessages, userApiKeys } = await req.json();
    
    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate models array
    if (!Array.isArray(models) || models.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one model required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (models.length > MAX_MODELS_COUNT) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_MODELS_COUNT} models per request` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate context messages
    const validContextMessages: ContextMessage[] = Array.isArray(contextMessages) 
      ? contextMessages.filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
      : [];

    if (validContextMessages.length > MAX_CONTEXT_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_CONTEXT_MESSAGES} context messages allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse user API keys
    const userKeys: ApiKeyConfig | undefined = userApiKeys && typeof userApiKeys === 'object' 
      ? userApiKeys 
      : undefined;

    // ========== SERVER-SIDE MODEL ACCESS ENFORCEMENT ==========
    let selectedModels = models;
    
    // Enforce model restrictions for free users (server-side validation)
    if (userPlan === 'free' && !userKeys?.openrouter) {
      const unauthorizedModels = selectedModels.filter(
        (m: string) => !FREE_PLAN_ALLOWED_MODELS.includes(m)
      );
      
      if (unauthorizedModels.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Some models require Pro subscription',
            unauthorized_models: unauthorizedModels,
            allowed_models: FREE_PLAN_ALLOWED_MODELS
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Filter models based on available keys
    const hasUserOpenRouter = !!userKeys?.openrouter;
    const hasSystemOpenRouter = !!Deno.env.get("OPENROUTER_API_KEY");
    
    if (!hasUserOpenRouter && !hasSystemOpenRouter) {
      // Only fallback AI gateway available - filter to supported models
      selectedModels = selectedModels.filter((m: string) => SYSTEM_AVAILABLE_MODELS.includes(m));
    }

    if (selectedModels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid models selected. Add an OpenRouter API key to access more models.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const SYSTEM_OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");

    if (!AI_GATEWAY_API_KEY && !SYSTEM_OPENROUTER_KEY && !userKeys?.openrouter && !Object.values(userKeys || {}).some(Boolean)) {
      console.error("No API keys configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please add your API keys in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${userId} (${userPlan}) requesting ${selectedModels.length} models`);

    const keySource = userKeys?.openrouter ? 'OpenRouter (user)' :
                     Object.values(userKeys || {}).some(Boolean) ? 'User API keys' :
                     SYSTEM_OPENROUTER_KEY ? 'OpenRouter (system)' :
                     'System AI Gateway';
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
    console.error('Error in dml-arena-stream function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
