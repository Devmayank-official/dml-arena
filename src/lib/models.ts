export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'google';
  description: string;
  color: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description: 'Most powerful OpenAI model with exceptional reasoning',
    color: 'hsl(142 76% 45%)',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    description: 'Fast and efficient with strong reasoning',
    color: 'hsl(142 76% 55%)',
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    description: 'Fastest OpenAI model for simple tasks',
    color: 'hsl(142 76% 65%)',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Top-tier Gemini with complex reasoning',
    color: 'hsl(217 91% 60%)',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    description: 'Next-generation Gemini model',
    color: 'hsl(217 91% 50%)',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Balanced speed and intelligence',
    color: 'hsl(217 91% 70%)',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini Flash Lite',
    provider: 'google',
    description: 'Fastest Gemini for quick tasks',
    color: 'hsl(217 91% 80%)',
  },
];

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: 'openai' | 'google'): AIModel[] => {
  return AI_MODELS.filter(model => model.provider === provider);
};
