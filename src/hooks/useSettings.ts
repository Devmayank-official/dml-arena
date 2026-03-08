import { useSettingsStore, type UserSettings } from '@/stores/settings.store';

/**
 * Backward-compatible useSettings hook powered by Zustand.
 * Drop-in replacement — same API surface.
 */
export function useSettings() {
  const { settings, isLoaded, updateSettings, resetSettings } = useSettingsStore();

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
  };
}

export type { UserSettings };
