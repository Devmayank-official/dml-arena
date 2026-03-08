import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DeepModeSettings } from '@/components/DeepModeToggle';
import type { ModelResponse } from '@/types';
import type { QueryCategory } from '@/lib/queryCategories';

interface ArenaState {
  // Model selection
  selectedModels: string[];
  hasInitializedModels: boolean;

  // Deep mode
  deepMode: boolean;
  deepModeSettings: DeepModeSettings;

  // Current comparison state
  currentDebateId: string | null;
  currentComparisonId: string | null;
  currentQuery: string;
  currentCategory: QueryCategory | null;

  // Actions — model selection
  setSelectedModels: (models: string[]) => void;
  toggleModel: (modelId: string, maxModels: number) => boolean;
  selectAllModels: (models: string[], maxModels: number) => void;
  deselectAllModels: () => void;
  initializeModels: (defaultModels: string[]) => void;

  // Actions — deep mode
  setDeepMode: (enabled: boolean) => void;
  setDeepModeSettings: (settings: DeepModeSettings) => void;

  // Actions — comparison state
  setCurrentDebateId: (id: string | null) => void;
  setCurrentComparisonId: (id: string | null) => void;
  setCurrentQuery: (query: string) => void;
  setCurrentCategory: (category: QueryCategory | null) => void;

  // Actions — reset
  resetComparison: () => void;
}

export const useArenaStore = create<ArenaState>()(
  devtools(
    (set, get) => ({
      selectedModels: [],
      hasInitializedModels: false,
      deepMode: false,
      deepModeSettings: {
        rounds: 2,
        style: 'collaborative',
        responseLength: 'concise',
        focusArea: 'balanced',
        persona: 'none',
        customPersona: undefined,
        synthesizer: 'google/gemini-2.5-pro',
      },
      currentDebateId: null,
      currentComparisonId: null,
      currentQuery: '',
      currentCategory: null,

      setSelectedModels: (models) =>
        set({ selectedModels: models }, false, 'setSelectedModels'),

      toggleModel: (modelId, maxModels) => {
        const { selectedModels } = get();
        if (selectedModels.includes(modelId)) {
          set(
            { selectedModels: selectedModels.filter((id) => id !== modelId) },
            false,
            'toggleModel/remove'
          );
          return true;
        }
        if (selectedModels.length >= maxModels) {
          return false; // Caller should show toast
        }
        set(
          { selectedModels: [...selectedModels, modelId] },
          false,
          'toggleModel/add'
        );
        return true;
      },

      selectAllModels: (allModelIds, maxModels) =>
        set(
          { selectedModels: allModelIds.slice(0, maxModels) },
          false,
          'selectAllModels'
        ),

      deselectAllModels: () =>
        set({ selectedModels: [] }, false, 'deselectAllModels'),

      initializeModels: (defaultModels) => {
        if (!get().hasInitializedModels) {
          set(
            { selectedModels: defaultModels, hasInitializedModels: true },
            false,
            'initializeModels'
          );
        }
      },

      setDeepMode: (enabled) =>
        set({ deepMode: enabled }, false, 'setDeepMode'),

      setDeepModeSettings: (settings) =>
        set({ deepModeSettings: settings }, false, 'setDeepModeSettings'),

      setCurrentDebateId: (id) =>
        set({ currentDebateId: id }, false, 'setCurrentDebateId'),

      setCurrentComparisonId: (id) =>
        set({ currentComparisonId: id }, false, 'setCurrentComparisonId'),

      setCurrentQuery: (query) =>
        set({ currentQuery: query }, false, 'setCurrentQuery'),

      setCurrentCategory: (category) =>
        set({ currentCategory: category }, false, 'setCurrentCategory'),

      resetComparison: () =>
        set(
          {
            currentDebateId: null,
            currentComparisonId: null,
            currentQuery: '',
            currentCategory: null,
          },
          false,
          'resetComparison'
        ),
    }),
    { name: 'ArenaStore' }
  )
);
