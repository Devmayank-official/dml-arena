import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  keyboardHelpOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setKeyboardHelpOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        commandPaletteOpen: false,
        keyboardHelpOpen: false,

        setSidebarOpen: (open) => set({ sidebarOpen: open }, false, 'setSidebarOpen'),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),
        setCommandPaletteOpen: (open) =>
          set({ commandPaletteOpen: open }, false, 'setCommandPaletteOpen'),
        setKeyboardHelpOpen: (open) =>
          set({ keyboardHelpOpen: open }, false, 'setKeyboardHelpOpen'),
      }),
      {
        name: 'dmlarena-ui',
        partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
      }
    ),
    { name: 'UIStore' }
  )
);
