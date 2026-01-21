export type ModelProvider = 'openai' | 'google' | 'anthropic' | 'meta' | 'mistral' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  color: string;
  openRouterId?: string; // OpenRouter model ID mapping
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description: 'Most powerful OpenAI model with exceptional reasoning',
    color: 'hsl(142 76% 45%)',
    openRouterId: 'openai/gpt-4o',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    description: 'Fast and efficient with strong reasoning',
    color: 'hsl(142 76% 55%)',
    openRouterId: 'openai/gpt-4o-mini',
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    description: 'Fastest OpenAI model for simple tasks',
    color: 'hsl(142 76% 65%)',
    openRouterId: 'openai/gpt-3.5-turbo',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Top-tier Gemini with complex reasoning',
    color: 'hsl(217 91% 60%)',
    openRouterId: 'google/gemini-2.0-flash-001',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    description: 'Next-generation Gemini model',
    color: 'hsl(217 91% 50%)',
    openRouterId: 'google/gemini-2.5-pro-preview-06-05',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Balanced speed and intelligence',
    color: 'hsl(217 91% 70%)',
    openRouterId: 'google/gemini-2.5-flash-preview-05-20',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'google',
    description: 'Fastest Gemini for quick tasks',
    color: 'hsl(217 91% 80%)',
    openRouterId: 'google/gemini-2.0-flash-lite-001',
  },
];

// OpenRouter additional models that can be accessed with OpenRouter key
export const OPENROUTER_MODELS: AIModel[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most capable Anthropic model',
    color: 'hsl(24 94% 50%)',
    openRouterId: 'anthropic/claude-3.5-sonnet',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast and affordable Claude model',
    color: 'hsl(24 94% 60%)',
    openRouterId: 'anthropic/claude-3-haiku',
  },
  {
    id: 'meta/llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'meta',
    description: 'Powerful open-source model from Meta',
    color: 'hsl(214 100% 50%)',
    openRouterId: 'meta-llama/llama-3.1-70b-instruct',
  },
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    description: 'Most capable Mistral model',
    color: 'hsl(270 91% 60%)',
    openRouterId: 'mistralai/mistral-large-latest',
  },
];

export const getModelById = (id: string): AIModel | undefined => {
  return [...AI_MODELS, ...OPENROUTER_MODELS].find(model => model.id === id);
};

export const getModelsByProvider = (provider: ModelProvider): AIModel[] => {
  return [...AI_MODELS, ...OPENROUTER_MODELS].filter(model => model.provider === provider);
};

export const getAllModels = (hasOpenRouterKey: boolean = false): AIModel[] => {
  if (hasOpenRouterKey) {
    return [...AI_MODELS, ...OPENROUTER_MODELS];
  }
  return AI_MODELS;
};
