export type ModelProvider = 'openai' | 'google' | 'anthropic' | 'meta' | 'mistral' | 'deepseek' | 'qwen' | 'xai' | 'zhipu' | 'moonshot';

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
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    description: 'Fastest OpenAI model for simple tasks',
    color: 'hsl(142 76% 65%)',
    openRouterId: 'openai/gpt-5-nano',
    capabilities: ['fast'],
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
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    description: 'Next-generation Gemini model',
    color: 'hsl(217 91% 50%)',
    openRouterId: 'google/gemini-3-pro-preview',
    capabilities: ['reasoning', 'coding', 'vision', 'thinking'],
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
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'google',
    description: 'Fastest Gemini for quick tasks',
    color: 'hsl(217 91% 80%)',
    openRouterId: 'google/gemini-2.5-flash-lite',
    capabilities: ['fast'],
  },
];

// OpenRouter additional models - requires OpenRouter API key
export const OPENROUTER_MODELS: AIModel[] = [
  // Anthropic Claude Models
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Latest Claude with exceptional reasoning and coding',
    color: 'hsl(24 94% 50%)',
    openRouterId: 'anthropic/claude-sonnet-4.5',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
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
    isNew: true,
  },
  // DeepSeek Models
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    description: 'Advanced reasoning model with chain-of-thought',
    color: 'hsl(200 95% 50%)',
    openRouterId: 'deepseek/deepseek-r1:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking', 'coding'],
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
    isNew: true,
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
  },
  // Qwen Models
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen 3 Coder',
    provider: 'qwen',
    description: 'Specialized coding model from Alibaba',
    color: 'hsl(270 70% 55%)',
    openRouterId: 'qwen/qwen3-coder',
    requiresOpenRouter: true,
    capabilities: ['coding'],
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
  },
  {
    id: 'qwen/qwen3-235b',
    name: 'Qwen 3 235B',
    provider: 'qwen',
    description: 'Massive 235B parameter model',
    color: 'hsl(270 70% 45%)',
    openRouterId: 'qwen/qwen3-235b-a22b-07-25',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    isNew: true,
  },
  {
    id: 'qwen/qwen3-thinking',
    name: 'Qwen 3 Thinking',
    provider: 'qwen',
    description: 'Enhanced reasoning with thinking mode',
    color: 'hsl(270 70% 60%)',
    openRouterId: 'qwen/qwen3-235b-a22b-thinking-2507',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    isNew: true,
  },
  // Grok Models (xAI)
  {
    id: 'xai/grok-4',
    name: 'Grok 4',
    provider: 'xai',
    description: 'Latest Grok with superior reasoning',
    color: 'hsl(0 0% 30%)',
    openRouterId: 'x-ai/grok-4',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
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
  },
  {
    id: 'xai/grok-3',
    name: 'Grok 3',
    provider: 'xai',
    description: 'Powerful reasoning from xAI',
    color: 'hsl(0 0% 50%)',
    openRouterId: 'x-ai/grok-3',
    requiresOpenRouter: true,
    capabilities: ['reasoning'],
  },
  // GLM Models (Zhipu)
  {
    id: 'zhipu/glm-4.7',
    name: 'GLM 4.7',
    provider: 'zhipu',
    description: 'Latest GLM with state-of-the-art capabilities',
    color: 'hsl(160 70% 40%)',
    openRouterId: 'zhipuai/glm-4.7',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
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
  },
  // Mistral Models
  {
    id: 'mistral/mistral-large-2',
    name: 'Mistral Large 2',
    provider: 'mistral',
    description: 'Most powerful Mistral model',
    color: 'hsl(35 95% 50%)',
    openRouterId: 'mistralai/mistral-large-2',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    isNew: true,
  },
  {
    id: 'mistral/mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'mistral',
    description: 'Balanced Mistral for general tasks',
    color: 'hsl(35 95% 55%)',
    openRouterId: 'mistralai/mistral-medium-3.1',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
  },
  {
    id: 'mistral/codestral-2508',
    name: 'Codestral',
    provider: 'mistral',
    description: 'Specialized coding model from Mistral',
    color: 'hsl(35 95% 60%)',
    openRouterId: 'mistralai/codestral-2508',
    requiresOpenRouter: true,
    capabilities: ['coding'],
    isNew: true,
  },
  {
    id: 'mistral/devstral-medium',
    name: 'Devstral Medium',
    provider: 'mistral',
    description: 'Development-focused Mistral model',
    color: 'hsl(35 95% 65%)',
    openRouterId: 'mistralai/devstral-medium-2507',
    requiresOpenRouter: true,
    capabilities: ['coding'],
  },
  // Meta Llama Models
  {
    id: 'meta/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    description: 'Latest Llama 4 with cutting-edge capabilities',
    color: 'hsl(214 100% 45%)',
    openRouterId: 'meta-llama/llama-4-maverick:free',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding', 'vision'],
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
  },
  // Kimi/Moonshot Models
  {
    id: 'moonshot/kimi-k2',
    name: 'Kimi K2',
    provider: 'moonshot',
    description: 'Advanced reasoning model from Moonshot',
    color: 'hsl(280 70% 55%)',
    openRouterId: 'moonshotai/kimi-k2',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
    isNew: true,
  },
  {
    id: 'moonshot/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'moonshot',
    description: 'Enhanced chain-of-thought reasoning',
    color: 'hsl(280 70% 50%)',
    openRouterId: 'moonshotai/kimi-k2-thinking',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'thinking'],
    isNew: true,
  },
  // OpenAI OSS Models
  {
    id: 'openai/gpt-oss-200b',
    name: 'GPT-OSS 200B',
    provider: 'openai',
    description: 'Open-source GPT variant 200B parameters',
    color: 'hsl(142 76% 38%)',
    openRouterId: 'openai/gpt-oss-200b',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'coding'],
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
  },
  // MiniMax Models
  {
    id: 'minimax/minimax-m2',
    name: 'MiniMax M2',
    provider: 'zhipu',
    description: 'Latest MiniMax with enhanced capabilities',
    color: 'hsl(320 70% 55%)',
    openRouterId: 'minimax/minimax-m2',
    requiresOpenRouter: true,
    capabilities: ['reasoning', 'vision'],
    isNew: true,
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
};

// Storage key for API keys - must match ApiKeysSettings
const API_KEYS_STORAGE_KEY = 'compareai-api-keys';

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
  return !!keys.openrouter;
};

export const getModelById = (id: string): AIModel | undefined => {
  return [...AI_MODELS, ...OPENROUTER_MODELS].find(model => model.id === id);
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
