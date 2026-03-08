import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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

interface SettingsState {
  settings: UserSettings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        settings: DEFAULT_SETTINGS,
        isLoaded: true,

        updateSettings: (updates) =>
          set(
            (state) => ({
              settings: { ...state.settings, ...updates },
            }),
            false,
            'updateSettings'
          ),

        resetSettings: () =>
          set({ settings: DEFAULT_SETTINGS }, false, 'resetSettings'),
      }),
      {
        name: 'dmlarena-settings',
        partialize: (state) => ({ settings: state.settings }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.isLoaded = true;
          }
        },
      }
    ),
    { name: 'SettingsStore' }
  )
);
