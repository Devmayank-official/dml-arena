import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={cn(
        "gradient-border rounded-xl overflow-hidden",
        disabled && "opacity-50"
      )}>
        <div className="flex items-end gap-2 p-2 sm:p-3 bg-card">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select at least one model to start" : "Ask anything to compare AI responses..."}
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "flex-1 bg-transparent resize-none outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "min-h-[24px] max-h-[200px] text-sm sm:text-base"
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            className={cn(
              "shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 active:scale-95"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1.5 sm:mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
