import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const { 
    isListening, 
    isSupported, 
    interimTranscript,
    startListening, 
    stopListening, 
    error: voiceError 
  } = useVoiceInput({
    onTranscript: (transcript) => {
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    },
  });

  // Show voice error toast
  useEffect(() => {
    if (voiceError) {
      toast({
        title: 'Voice Input Error',
        description: voiceError,
        variant: 'destructive',
      });
    }
  }, [voiceError, toast]);

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

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
        disabled && "opacity-50",
        isListening && "ring-2 ring-red-500/50"
      )}>
        <div className="flex items-end gap-2 p-2 sm:p-3 bg-card">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select at least one model to start" : isListening ? "Listening..." : "Ask anything to compare AI responses..."}
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "flex-1 bg-transparent resize-none outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "min-h-[24px] max-h-[200px] text-sm sm:text-base"
            )}
          />
          
          {/* Voice Input Button */}
          {isSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "ghost"}
              onClick={handleVoiceToggle}
              disabled={isLoading || disabled}
              className={cn(
                "shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg transition-all duration-200",
                isListening && "animate-pulse"
              )}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || disabled}
            data-action="send-message"
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
      
      {/* Interim transcript display */}
      <AnimatePresence>
        {isListening && interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 -top-12 px-3 py-2 bg-secondary/90 rounded-lg text-sm text-muted-foreground backdrop-blur-sm"
          >
            <span className="italic">"{interimTranscript}"</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
          {isSupported && <span className="hidden sm:inline"> • Click mic for voice input</span>}
        </p>
        
        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 text-red-500"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-medium">Listening...</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopListening}
                className="h-5 w-5 text-red-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
