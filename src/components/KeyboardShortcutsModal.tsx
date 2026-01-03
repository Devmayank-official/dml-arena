import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  const categories = {
    navigation: { label: 'Navigation', icon: '🧭' },
    actions: { label: 'Actions', icon: '⚡' },
    comparison: { label: 'Comparison', icon: '🔄' },
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts: string[] = [];
    if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl');
    if (shortcut.modifiers?.includes('alt')) parts.push('Alt');
    if (shortcut.modifiers?.includes('shift')) parts.push('Shift');
    if (shortcut.modifiers?.includes('meta')) parts.push('⌘');
    parts.push(shortcut.key.toUpperCase());
    return parts;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-lg"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
                {Object.entries(categories).map(([key, { label, icon }]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                    </h3>
                    <div className="space-y-2">
                      {groupedShortcuts[key]?.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-sm">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {formatKey(shortcut).map((key, i) => (
                              <span key={i}>
                                <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                                  {key}
                                </Badge>
                                {i < formatKey(shortcut).length - 1 && (
                                  <span className="text-muted-foreground mx-0.5">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Press <Badge variant="outline" className="font-mono text-xs mx-1">Shift</Badge>
                  <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge>
                  anytime to open this menu
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
