import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'comparison';
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'h',
      modifiers: ['ctrl'],
      description: 'Go to Home',
      category: 'navigation',
      action: () => navigate('/chat'),
    },
    {
      key: 'g',
      modifiers: ['ctrl'],
      description: 'Go to History',
      category: 'navigation',
      action: () => navigate('/chat/history'),
    },
    {
      key: 'c',
      modifiers: ['ctrl'],
      description: 'Go to Community',
      category: 'navigation',
      action: () => navigate('/chat/community'),
    },
    {
      key: 's',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Settings',
      category: 'navigation',
      action: () => navigate('/chat/settings'),
    },
    {
      key: 'i',
      modifiers: ['ctrl'],
      description: 'Go to Insights',
      category: 'navigation',
      action: () => navigate('/chat/insights'),
    },
    // Actions
    {
      key: '/',
      description: 'Focus search/input',
      category: 'actions',
      action: () => {
        const input = document.querySelector('textarea, input[type="text"]') as HTMLElement;
        input?.focus();
      },
    },
    {
      key: 'Escape',
      description: 'Close modal/dialog',
      category: 'actions',
      action: () => {
        setIsHelpOpen(false);
        // Trigger escape on document for other modals
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      },
    },
    {
      key: '?',
      modifiers: ['shift'],
      description: 'Show keyboard shortcuts',
      category: 'actions',
      action: () => setIsHelpOpen(true),
    },
    {
      key: 'r',
      modifiers: ['ctrl'],
      description: 'Re-run last comparison',
      category: 'actions',
      action: () => {
        const reRunBtn = document.querySelector('[data-action="quick-rerun"]') as HTMLElement;
        reRunBtn?.click();
      },
    },
    {
      key: 'b',
      modifiers: ['ctrl'],
      description: 'Toggle favorite/bookmark',
      category: 'actions',
      action: () => {
        const favoriteBtn = document.querySelector('[data-action="toggle-favorite"]') as HTMLElement;
        favoriteBtn?.click();
      },
    },
    {
      key: 'e',
      modifiers: ['ctrl'],
      description: 'Export current comparison',
      category: 'actions',
      action: () => {
        const exportBtn = document.querySelector('[data-action="export"]') as HTMLElement;
        exportBtn?.click();
      },
    },
    {
      key: 'n',
      modifiers: ['ctrl'],
      description: 'Open notifications',
      category: 'actions',
      action: () => {
        const notifBtn = document.querySelector('[data-action="notifications"]') as HTMLElement;
        notifBtn?.click();
      },
    },
    // Comparison shortcuts
    {
      key: '1',
      modifiers: ['alt'],
      description: 'Toggle first model',
      category: 'comparison',
      action: () => clickModelByIndex(0),
    },
    {
      key: '2',
      modifiers: ['alt'],
      description: 'Toggle second model',
      category: 'comparison',
      action: () => clickModelByIndex(1),
    },
    {
      key: '3',
      modifiers: ['alt'],
      description: 'Toggle third model',
      category: 'comparison',
      action: () => clickModelByIndex(2),
    },
    {
      key: '4',
      modifiers: ['alt'],
      description: 'Toggle fourth model',
      category: 'comparison',
      action: () => clickModelByIndex(3),
    },
    {
      key: '5',
      modifiers: ['alt'],
      description: 'Toggle fifth model',
      category: 'comparison',
      action: () => clickModelByIndex(4),
    },
    {
      key: 'a',
      modifiers: ['ctrl', 'shift'],
      description: 'Select all models',
      category: 'comparison',
      action: () => {
        const selectAllBtn = document.querySelector('[data-action="select-all"]') as HTMLElement;
        selectAllBtn?.click();
      },
    },
    {
      key: 'd',
      modifiers: ['ctrl', 'shift'],
      description: 'Toggle Deep Mode',
      category: 'comparison',
      action: () => {
        const deepModeSwitch = document.querySelector('[data-tour="deep-mode"] button[role="switch"]') as HTMLElement;
        deepModeSwitch?.click();
      },
    },
    // Preset shortcuts
    {
      key: 'p',
      modifiers: ['ctrl'],
      description: 'Open preset selector',
      category: 'comparison',
      action: () => {
        const presetBtn = document.querySelector('[data-action="preset-selector"]') as HTMLElement;
        presetBtn?.click();
      },
    },
    {
      key: '1',
      modifiers: ['ctrl', 'shift'],
      description: 'Apply Coding preset',
      category: 'comparison',
      action: () => {
        const presetBtn = document.querySelector('[data-preset="coding"]') as HTMLElement;
        presetBtn?.click();
      },
    },
    {
      key: '2',
      modifiers: ['ctrl', 'shift'],
      description: 'Apply Creative preset',
      category: 'comparison',
      action: () => {
        const presetBtn = document.querySelector('[data-preset="creative"]') as HTMLElement;
        presetBtn?.click();
      },
    },
    {
      key: '3',
      modifiers: ['ctrl', 'shift'],
      description: 'Apply Analysis preset',
      category: 'comparison',
      action: () => {
        const presetBtn = document.querySelector('[data-preset="analysis"]') as HTMLElement;
        presetBtn?.click();
      },
    },
    {
      key: '4',
      modifiers: ['ctrl', 'shift'],
      description: 'Apply Quick preset',
      category: 'comparison',
      action: () => {
        const presetBtn = document.querySelector('[data-preset="quick"]') as HTMLElement;
        presetBtn?.click();
      },
    },
    // Focus/Send shortcut
    {
      key: 'Enter',
      modifiers: ['ctrl'],
      description: 'Focus input and send',
      category: 'actions',
      action: () => {
        const textarea = document.querySelector('[data-tour="chat-input"] textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          // If there's content, trigger submit
          if (textarea.value.trim()) {
            const sendBtn = document.querySelector('[data-action="send-message"]') as HTMLElement;
            sendBtn?.click();
          }
        }
      },
    },
  ];

  const clickModelByIndex = (index: number) => {
    const modelButtons = document.querySelectorAll('[data-tour="model-selector"] [data-model-id]');
    const button = modelButtons[index] as HTMLElement;
    button?.click();
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    
    for (const shortcut of shortcuts) {
      const modifiersMatch = 
        (!shortcut.modifiers || shortcut.modifiers.length === 0) ||
        shortcut.modifiers.every(mod => {
          switch (mod) {
            case 'ctrl': return event.ctrlKey || event.metaKey;
            case 'alt': return event.altKey;
            case 'shift': return event.shiftKey;
            case 'meta': return event.metaKey;
            default: return false;
          }
        });

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
        (shortcut.key === '?' && event.key === '?' && event.shiftKey);

      if (modifiersMatch && keyMatches) {
        // Allow search shortcut even when not typing
        if (shortcut.key === '/' && isTyping) continue;
        // Skip if typing and not a navigation/modal shortcut
        if (isTyping && !shortcut.modifiers?.includes('ctrl') && shortcut.key !== 'Escape') continue;

        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    isHelpOpen,
    setIsHelpOpen,
  };
}
