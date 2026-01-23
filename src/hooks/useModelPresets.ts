import { useState, useEffect, useCallback } from 'react';

export interface ModelPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  models: string[];
  isBuiltIn: boolean;
}

const BUILT_IN_PRESETS: ModelPreset[] = [
  {
    id: 'coding',
    name: 'Coding',
    icon: '💻',
    description: 'Best models for code generation and debugging',
    models: ['openai/gpt-5.2', 'anthropic/claude-sonnet-4.5', 'deepseek/deepseek-r1', 'mistral/codestral-2508', 'qwen/qwen3-coder'],
    isBuiltIn: true,
  },
  {
    id: 'creative',
    name: 'Creative Writing',
    icon: '✨',
    description: 'Models optimized for creative and narrative content',
    models: ['openai/gpt-5.2', 'anthropic/claude-opus-4.5', 'google/gemini-3-pro-preview'],
    isBuiltIn: true,
  },
  {
    id: 'reasoning',
    name: 'Deep Reasoning',
    icon: '🧠',
    description: 'Advanced reasoning and analytical tasks',
    models: ['openai/gpt-5.2', 'anthropic/claude-opus-4.5', 'deepseek/deepseek-r1', 'qwen/qwen3-thinking', 'xai/grok-4-thinking'],
    isBuiltIn: true,
  },
  {
    id: 'quick',
    name: 'Quick & Fast',
    icon: '⚡',
    description: 'Fast models for simple queries',
    models: ['openai/gpt-5-nano', 'google/gemini-2.5-flash-lite', 'anthropic/claude-haiku-4.5'],
    isBuiltIn: true,
  },
  {
    id: 'best-latest',
    name: 'Best Latest',
    icon: '🌟',
    description: 'Top flagship models from each major provider',
    models: ['openai/gpt-5.2', 'anthropic/claude-opus-4.5', 'google/gemini-3-pro-preview', 'xai/grok-4', 'deepseek/deepseek-r1-0528'],
    isBuiltIn: true,
  },
];

const STORAGE_KEY = 'compareai-model-presets';

export function useModelPresets() {
  const [customPresets, setCustomPresets] = useState<ModelPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomPresets(JSON.parse(stored));
      } catch {
        setCustomPresets([]);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveCustomPresets = useCallback((presets: ModelPreset[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    setCustomPresets(presets);
  }, []);

  const addPreset = useCallback((preset: Omit<ModelPreset, 'id' | 'isBuiltIn'>) => {
    const newPreset: ModelPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      isBuiltIn: false,
    };
    saveCustomPresets([...customPresets, newPreset]);
    return newPreset;
  }, [customPresets, saveCustomPresets]);

  const updatePreset = useCallback((id: string, updates: Partial<Omit<ModelPreset, 'id' | 'isBuiltIn'>>) => {
    const updated = customPresets.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    saveCustomPresets(updated);
  }, [customPresets, saveCustomPresets]);

  const deletePreset = useCallback((id: string) => {
    const filtered = customPresets.filter(p => p.id !== id);
    saveCustomPresets(filtered);
  }, [customPresets, saveCustomPresets]);

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return {
    presets: allPresets,
    customPresets,
    builtInPresets: BUILT_IN_PRESETS,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
  };
}
