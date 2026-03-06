export type ModelProvider = 'openai' | 'google' | 'anthropic' | 'meta' | 'mistral' | 'deepseek' | 'qwen' | 'xai' | 'zhipu' | 'moonshot' | 'cohere' | 'nvidia' | 'ai21' | 'amazon';

export type ModelCapability = 'reasoning' | 'coding' | 'vision' | 'fast' | 'thinking';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  color: string;
  openRouterId: string;
  requiresOpenRouter?: boolean;
  capabilities: ModelCapability[];
  isNew?: boolean;
  contextLength?: string;
}

export const CAPABILITY_INFO: Record<ModelCapability, { label: string; icon: string; color: string }> = {
  reasoning: { label: 'Reasoning', icon: '🧠', color: 'bg-purple-500/20 text-purple-400' },
  coding: { label: 'Coding', icon: '💻', color: 'bg-blue-500/20 text-blue-400' },
  vision: { label: 'Vision', icon: '👁️', color: 'bg-green-500/20 text-green-400' },
  fast: { label: 'Fast', icon: '⚡', color: 'bg-yellow-500/20 text-yellow-400' },
  thinking: { label: 'Thinking', icon: '💭', color: 'bg-pink-500/20 text-pink-400' },
};

// Base models available with system keys (OpenAI and Google)
export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description: 'Most powerful OpenAI model with exceptional reasoning',
    color: 'hsl(142 76% 45%)',
    openRouterId: 'openai/gpt-5',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    description: 'Enhanced GPT-5 with improved capabilities',
    color: 'hsl(142 76% 50%)',
    openRouterId: 'openai/gpt-5.1',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    description: 'Latest GPT with advanced reasoning and thinking',
    color: 'hsl(142 76% 55%)',
    openRouterId: 'openai/gpt-5.2',
    capabilities: ['reasoning', 'coding', 'vision', 'thinking'],
    contextLength: '400K',
    isNew: true,
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    description: 'Fast and efficient with strong reasoning',
    color: 'hsl(142 76% 60%)',
    openRouterId: 'openai/gpt-5-mini',
    capabilities: ['reasoning', 'fast'],
    contextLength: '128K',
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    description: 'Fastest OpenAI model for simple tasks',
    color: 'hsl(142 76% 65%)',
    openRouterId: 'openai/gpt-5-nano',
    capabilities: ['fast'],
    contextLength: '32K',
  },
  // Google Models
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Top-tier Gemini with complex reasoning',
    color: 'hsl(217 91% 60%)',
    openRouterId: 'google/gemini-2.5-pro',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '1M',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    description: 'Next-generation Gemini model',
    color: 'hsl(217 91% 50%)',
    openRouterId: 'google/gemini-3-pro-preview',
    capabilities: ['reasoning', 'coding', 'vision', 'thinking'],
    contextLength: '1M',
    isNew: true,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Balanced speed and intelligence',
    color: 'hsl(217 91% 70%)',
    openRouterId: 'google/gemini-2.5-flash',
    capabilities: ['reasoning', 'fast'],
    contextLength: '1M',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'google',
    description: 'Fastest Gemini for quick tasks',
    color: 'hsl(217 91% 80%)',
    openRouterId: 'google/gemini-2.5-flash-lite',
    capabilities: ['fast'],
    contextLength: '1M',
  },
];

// OpenRouter additional models - requires OpenRouter API key
export const OPENROUTER_MODELS: AIModel[] = [
  // ===== Anthropic Claude Models =====
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Latest Claude with exceptional reasoning and coding',
    color: 'hsl(24 94% 50%)',
    openRouterId: 'anthropic/claude-sonnet-4.5',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Most powerful Claude for complex tasks',
    color: 'hsl(24 94% 45%)',
    openRouterId: 'anthropic/claude-opus-4.5',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision', 'thinking'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    description: 'Advanced Claude with deep reasoning',
    color: 'hsl(24 94% 55%)',
    openRouterId: 'anthropic/claude-opus-4',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '200K',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fast and affordable Claude model',
    color: 'hsl(24 94% 65%)',
    openRouterId: 'anthropic/claude-haiku-4.5',
    requiresOpenRouter: true,
    capabilities: ['coding', 'fast'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Previous-gen Claude with excellent balance',
    color: 'hsl(24 94% 58%)',
    openRouterId: 'anthropic/claude-3.5-sonnet',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '200K',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Legacy flagship Claude model',
    color: 'hsl(24 94% 42%)',
    openRouterId: 'anthropic/claude-3-opus',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '200K',
  },

  // ===== DeepSeek Models =====
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    description: 'Advanced reasoning model with chain-of-thought',
    color: 'hsl(200 95% 50%)',
    openRouterId: 'deepseek/deepseek-r1:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking', 'coding'],
    contextLength: '64K',
    isNew: true,
  },
  {
    id: 'deepseek/deepseek-r1-0528',
    name: 'DeepSeek R1 0528',
    provider: 'deepseek',
    description: 'Latest R1 with improved reasoning',
    color: 'hsl(200 95% 48%)',
    openRouterId: 'deepseek/deepseek-r1-0528:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking', 'coding'],
    contextLength: '64K',
    isNew: true,
  },
  {
    id: 'deepseek/deepseek-v3.1',
    name: 'DeepSeek V3.1',
    provider: 'deepseek',
    description: 'Latest DeepSeek with enhanced capabilities',
    color: 'hsl(200 95% 55%)',
    openRouterId: 'deepseek/deepseek-chat-v3.1',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '64K',
    isNew: true,
  },
  {
    id: 'deepseek/deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: 'Powerful general-purpose model',
    color: 'hsl(200 95% 58%)',
    openRouterId: 'deepseek/deepseek-chat',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '64K',
  },
  {
    id: 'deepseek/deepseek-r1-distill-70b',
    name: 'DeepSeek R1 70B',
    provider: 'deepseek',
    description: 'Distilled R1 with Llama architecture',
    color: 'hsl(200 95% 60%)',
    openRouterId: 'deepseek/deepseek-r1-distill-llama-70b',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '32K',
  },
  {
    id: 'deepseek/deepseek-prover-v2',
    name: 'DeepSeek Prover V2',
    provider: 'deepseek',
    description: 'Specialized for mathematical proofs',
    color: 'hsl(200 95% 52%)',
    openRouterId: 'deepseek/deepseek-prover-v2:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '64K',
    isNew: true,
  },

  // ===== Qwen Models =====
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen 3 Coder',
    provider: 'qwen',
    description: 'Specialized coding model from Alibaba',
    color: 'hsl(270 70% 55%)',
    openRouterId: 'qwen/qwen3-coder',
    requiresOpenRouter: true,
    capabilities: ['coding'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'qwen/qwen3-max',
    name: 'Qwen 3 Max',
    provider: 'qwen',
    description: 'Most powerful Qwen model',
    color: 'hsl(270 70% 50%)',
    openRouterId: 'qwen/qwen3-max',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'qwen/qwen3-235b',
    name: 'Qwen 3 235B',
    provider: 'qwen',
    description: 'Massive 235B parameter model',
    color: 'hsl(270 70% 45%)',
    openRouterId: 'qwen/qwen3-235b-a22b:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'qwen/qwen3-thinking',
    name: 'Qwen 3 Thinking',
    provider: 'qwen',
    description: 'Enhanced reasoning with thinking mode',
    color: 'hsl(270 70% 60%)',
    openRouterId: 'qwen/qwen3-235b-a22b-thinking:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'qwen/qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'qwen',
    description: 'Strong 72B parameter model',
    color: 'hsl(270 70% 58%)',
    openRouterId: 'qwen/qwen-2.5-72b-instruct',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'qwen/qwq-32b',
    name: 'QwQ 32B',
    provider: 'qwen',
    description: 'Reasoning-focused smaller model',
    color: 'hsl(270 70% 62%)',
    openRouterId: 'qwen/qwq-32b:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '32K',
    isNew: true,
  },

  // ===== Grok Models (xAI) =====
  {
    id: 'xai/grok-4',
    name: 'Grok 4',
    provider: 'xai',
    description: 'Latest Grok with superior reasoning',
    color: 'hsl(0 0% 30%)',
    openRouterId: 'x-ai/grok-4',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'xai/grok-4-thinking',
    name: 'Grok 4 Thinking',
    provider: 'xai',
    description: 'Grok with extended thinking capabilities',
    color: 'hsl(0 0% 35%)',
    openRouterId: 'x-ai/grok-4-thinking',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'xai/grok-4-fast',
    name: 'Grok 4 Fast',
    provider: 'xai',
    description: 'Optimized Grok for speed',
    color: 'hsl(0 0% 40%)',
    openRouterId: 'x-ai/grok-4-fast',
    requiresOpenRouter: true,
    capabilities: ['fast'],
    contextLength: '128K',
  },
  {
    id: 'xai/grok-3',
    name: 'Grok 3',
    provider: 'xai',
    description: 'Powerful reasoning from xAI',
    color: 'hsl(0 0% 50%)',
    openRouterId: 'x-ai/grok-3-beta',
    requiresOpenRouter: true,
    capabilities: ['reasoning'],
    contextLength: '128K',
  },
  {
    id: 'xai/grok-2-vision',
    name: 'Grok 2 Vision',
    provider: 'xai',
    description: 'Grok with vision capabilities',
    color: 'hsl(0 0% 55%)',
    openRouterId: 'x-ai/grok-2-vision-1212',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'vision'],
    contextLength: '32K',
  },

  // ===== GLM Models (Zhipu) =====
  {
    id: 'zhipu/glm-4.7',
    name: 'GLM 4.7',
    provider: 'zhipu',
    description: 'Latest GLM with state-of-the-art capabilities',
    color: 'hsl(160 70% 40%)',
    openRouterId: 'zhipuai/glm-4.7',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'zhipu/glm-4.6-flash',
    name: 'GLM 4.6 Flash',
    provider: 'zhipu',
    description: 'Fast and efficient GLM variant',
    color: 'hsl(160 70% 50%)',
    openRouterId: 'zhipuai/glm-4.6-flash',
    requiresOpenRouter: true,
    capabilities: ['fast', 'reasoning'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'zhipu/glm-4.5',
    name: 'GLM 4.5',
    provider: 'zhipu',
    description: 'Powerful Chinese-English bilingual model',
    color: 'hsl(160 70% 60%)',
    openRouterId: 'zhipuai/glm-4.5',
    requiresOpenRouter: true,
    capabilities: ['reasoning'],
    contextLength: '128K',
  },
  {
    id: 'zhipu/glm-4-long',
    name: 'GLM 4 Long',
    provider: 'zhipu',
    description: 'Extended context window variant',
    color: 'hsl(160 70% 55%)',
    openRouterId: 'zhipuai/glm-4-plus',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '1M',
  },

  // ===== Mistral Models =====
  {
    id: 'mistral/mistral-large-2',
    name: 'Mistral Large 2',
    provider: 'mistral',
    description: 'Most powerful Mistral model',
    color: 'hsl(35 95% 50%)',
    openRouterId: 'mistralai/mistral-large-2411',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'mistral/mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'mistral',
    description: 'Balanced Mistral for general tasks',
    color: 'hsl(35 95% 55%)',
    openRouterId: 'mistralai/mistral-medium-3',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'mistral/codestral-2508',
    name: 'Codestral',
    provider: 'mistral',
    description: 'Specialized coding model from Mistral',
    color: 'hsl(35 95% 60%)',
    openRouterId: 'mistralai/codestral-2501',
    requiresOpenRouter: true,
    capabilities: ['coding'],
    contextLength: '256K',
    isNew: true,
  },
  {
    id: 'mistral/devstral-medium',
    name: 'Devstral Medium',
    provider: 'mistral',
    description: 'Development-focused Mistral model',
    color: 'hsl(35 95% 65%)',
    openRouterId: 'mistralai/devstral-small:free',
    requiresOpenRouter: true,
    capabilities: ['coding', 'fast'],
    contextLength: '128K',
  },
  {
    id: 'mistral/pixtral-large',
    name: 'Pixtral Large',
    provider: 'mistral',
    description: 'Vision-capable Mistral model',
    color: 'hsl(35 95% 52%)',
    openRouterId: 'mistralai/pixtral-large-2411',
    requiresOpenRouter: true,
    capabilities: ['vision', 'reasoning'],
    contextLength: '128K',
  },
  {
    id: 'mistral/ministral-8b',
    name: 'Ministral 8B',
    provider: 'mistral',
    description: 'Efficient small model for simple tasks',
    color: 'hsl(35 95% 70%)',
    openRouterId: 'mistralai/ministral-8b',
    requiresOpenRouter: true,
    capabilities: ['fast'],
    contextLength: '128K',
  },

  // ===== Meta Llama Models =====
  {
    id: 'meta/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    description: 'Latest Llama 4 with cutting-edge capabilities',
    color: 'hsl(214 100% 45%)',
    openRouterId: 'meta-llama/llama-4-maverick:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '1M',
    isNew: true,
  },
  {
    id: 'meta/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'meta',
    description: 'Efficient Llama 4 for diverse tasks',
    color: 'hsl(214 100% 50%)',
    openRouterId: 'meta-llama/llama-4-scout:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '512K',
    isNew: true,
  },
  {
    id: 'meta/llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    description: 'Powerful open-source 70B model',
    color: 'hsl(214 100% 55%)',
    openRouterId: 'meta-llama/llama-3.3-70b-instruct:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'meta/llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'meta',
    description: 'Largest open-source model ever',
    color: 'hsl(214 100% 42%)',
    openRouterId: 'meta-llama/llama-3.1-405b-instruct',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'meta/llama-3.2-90b-vision',
    name: 'Llama 3.2 90B Vision',
    provider: 'meta',
    description: 'Vision-enabled Llama model',
    color: 'hsl(214 100% 52%)',
    openRouterId: 'meta-llama/llama-3.2-90b-vision-instruct',
    requiresOpenRouter: true,
    capabilities: ['vision', 'reasoning'],
    contextLength: '128K',
  },

  // ===== Kimi/Moonshot Models =====
  {
    id: 'moonshot/kimi-k2',
    name: 'Kimi K2',
    provider: 'moonshot',
    description: 'Advanced reasoning model from Moonshot',
    color: 'hsl(280 70% 55%)',
    openRouterId: 'moonshotai/kimi-k2:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'moonshot/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'moonshot',
    description: 'Enhanced chain-of-thought reasoning',
    color: 'hsl(280 70% 50%)',
    openRouterId: 'moonshotai/kimi-k2-instruct',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'moonshot/kimi-vl',
    name: 'Kimi VL',
    provider: 'moonshot',
    description: 'Vision-language model from Moonshot',
    color: 'hsl(280 70% 60%)',
    openRouterId: 'moonshotai/kimi-vl-a3b-thinking:free',
    requiresOpenRouter: true,
    capabilities: ['vision', 'reasoning'],
    contextLength: '128K',
    isNew: true,
  },

  // ===== OpenAI OSS Models =====
  {
    id: 'openai/gpt-oss-200b',
    name: 'GPT-OSS 200B',
    provider: 'openai',
    description: 'Open-source GPT variant 200B parameters',
    color: 'hsl(142 76% 38%)',
    openRouterId: 'openai/gpt-oss-200b',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
    isNew: true,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'openai',
    description: 'Open-source GPT variant 120B',
    color: 'hsl(142 76% 40%)',
    openRouterId: 'openai/gpt-oss-120b',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'openai',
    description: 'Efficient open-source GPT 20B',
    color: 'hsl(142 76% 48%)',
    openRouterId: 'openai/gpt-oss-20b',
    requiresOpenRouter: true,
    capabilities: ['fast'],
    contextLength: '32K',
  },
  {
    id: 'openai/o1',
    name: 'OpenAI o1',
    provider: 'openai',
    description: 'Advanced reasoning model',
    color: 'hsl(142 76% 42%)',
    openRouterId: 'openai/o1',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'openai/o1-pro',
    name: 'OpenAI o1 Pro',
    provider: 'openai',
    description: 'Enhanced o1 with extended thinking',
    color: 'hsl(142 76% 36%)',
    openRouterId: 'openai/o1-pro',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'openai/o3-mini',
    name: 'OpenAI o3 Mini',
    provider: 'openai',
    description: 'Compact reasoning model',
    color: 'hsl(142 76% 52%)',
    openRouterId: 'openai/o3-mini',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'fast'],
    contextLength: '200K',
    isNew: true,
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    description: 'Legacy GPT-4 with improvements',
    color: 'hsl(142 76% 58%)',
    openRouterId: 'openai/gpt-4.1',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
    contextLength: '1M',
  },

  // ===== Cohere Models =====
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    description: 'Powerful enterprise model from Cohere',
    color: 'hsl(340 70% 50%)',
    openRouterId: 'cohere/command-r-plus',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },
  {
    id: 'cohere/command-a',
    name: 'Command A',
    provider: 'cohere',
    description: 'Latest Command model from Cohere',
    color: 'hsl(340 70% 45%)',
    openRouterId: 'cohere/command-a',
    requiresOpenRouter: true,
    capabilities: ['reasoning'],
    contextLength: '256K',
    isNew: true,
  },

  // ===== NVIDIA Models =====
  {
    id: 'nvidia/llama-3.1-nemotron-70b',
    name: 'Nemotron 70B',
    provider: 'nvidia',
    description: 'NVIDIA-tuned Llama 3.1',
    color: 'hsl(83 100% 40%)',
    openRouterId: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    contextLength: '128K',
  },

  // ===== AI21 Models =====
  {
    id: 'ai21/jamba-1.6-large',
    name: 'Jamba 1.6 Large',
    provider: 'ai21',
    description: 'Hybrid SSM-Transformer architecture',
    color: 'hsl(190 70% 50%)',
    openRouterId: 'ai21/jamba-1.6-large',
    requiresOpenRouter: true,
    capabilities: ['reasoning'],
    contextLength: '256K',
    isNew: true,
  },

  // ===== Amazon Models =====
  {
    id: 'amazon/nova-pro',
    name: 'Amazon Nova Pro',
    provider: 'amazon',
    description: 'Advanced reasoning from AWS',
    color: 'hsl(28 90% 50%)',
    openRouterId: 'amazon/nova-pro-v1',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'vision'],
    contextLength: '300K',
    isNew: true,
  },
  {
    id: 'amazon/nova-lite',
    name: 'Amazon Nova Lite',
    provider: 'amazon',
    description: 'Fast and efficient AWS model',
    color: 'hsl(28 90% 60%)',
    openRouterId: 'amazon/nova-lite-v1',
    requiresOpenRouter: true,
    capabilities: ['fast', 'vision'],
    contextLength: '300K',
  },
];

// Provider display names and colors
export const PROVIDER_INFO: Record<ModelProvider, { name: string; color: string }> = {
  openai: { name: 'OpenAI', color: 'bg-green-500' },
  google: { name: 'Google', color: 'bg-blue-500' },
  anthropic: { name: 'Anthropic', color: 'bg-orange-500' },
  meta: { name: 'Meta', color: 'bg-indigo-500' },
  mistral: { name: 'Mistral', color: 'bg-amber-500' },
  deepseek: { name: 'DeepSeek', color: 'bg-cyan-500' },
  qwen: { name: 'Qwen', color: 'bg-purple-500' },
  xai: { name: 'xAI', color: 'bg-gray-500' },
  zhipu: { name: 'Zhipu', color: 'bg-teal-500' },
  moonshot: { name: 'Moonshot', color: 'bg-violet-500' },
  cohere: { name: 'Cohere', color: 'bg-rose-500' },
  nvidia: { name: 'NVIDIA', color: 'bg-lime-500' },
  ai21: { name: 'AI21', color: 'bg-sky-500' },
  amazon: { name: 'Amazon', color: 'bg-orange-600' },
};

// Storage key for API keys - must match ApiKeysSettings
const API_KEYS_STORAGE_KEY = 'dmlarena-api-keys';

export const getStoredApiKeys = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const hasOpenRouterKey = (): boolean => {
  const keys = getStoredApiKeys();
  // Return true if user has their own key OR system key is available
  // System key placeholder means we always have access to OpenRouter models
  return !!keys.openrouter || hasSystemOpenRouterKey();
};

// Check if system OpenRouter key is configured (placeholder - will be true when key is set)
export const hasSystemOpenRouterKey = (): boolean => {
  // This returns true to indicate system OpenRouter key is available
  // The actual key is stored as a secret in Supabase and used in edge functions
  return true;
};

// Combined list of all models (base + OpenRouter)
export const ALL_MODELS: AIModel[] = [...AI_MODELS, ...OPENROUTER_MODELS];

export const getModelById = (id: string): AIModel | undefined => {
  return ALL_MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: ModelProvider): AIModel[] => {
  return [...AI_MODELS, ...OPENROUTER_MODELS].filter(model => model.provider === provider);
};

export const getModelsByCapability = (capability: ModelCapability, models: AIModel[]): AIModel[] => {
  return models.filter(model => model.capabilities.includes(capability));
};

export const getAllModels = (hasOpenRouterKey: boolean = false): AIModel[] => {
  if (hasOpenRouterKey) {
    return [...AI_MODELS, ...OPENROUTER_MODELS];
  }
  return AI_MODELS;
};

export const getProviderColor = (provider: ModelProvider): string => {
  return PROVIDER_INFO[provider]?.color || 'bg-gray-500';
};

export const getProviderName = (provider: ModelProvider): string => {
  return PROVIDER_INFO[provider]?.name || provider;
};

// Get total model count
export const getTotalModelCount = (): number => {
  return AI_MODELS.length + OPENROUTER_MODELS.length;
};
