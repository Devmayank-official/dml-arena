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
      key: 'l',
      modifiers: ['ctrl'],
      description: 'Go to Leaderboard',
      category: 'navigation',
      action: () => navigate('/chat/leaderboard'),
    },
    {
      key: 's',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Settings',
      category: 'navigation',
      action: () => navigate('/chat/settings'),
    },
    {
      key: 'c',
      modifiers: ['ctrl'],
      description: 'Go to Community',
      category: 'navigation',
      action: () => navigate('/chat/community'),
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
