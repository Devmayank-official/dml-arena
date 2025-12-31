import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
  defaultModels: string[];
  responseDisplay: 'grid' | 'diff';
  autoSaveHistory: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultModels: ['openai/gpt-5', 'google/gemini-2.5-pro'],
  responseDisplay: 'grid',
  autoSaveHistory: true,
};

const STORAGE_KEY = 'compareai-settings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
  };
}
