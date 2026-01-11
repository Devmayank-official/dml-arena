import { MessageSquare, User, Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConversationTurn } from '@/types';

interface ConversationThreadProps {
  turns: ConversationTurn[];
  onClearConversation: () => void;
  className?: string;
}

export function ConversationThread({ turns, onClearConversation, className }: ConversationThreadProps) {
  if (turns.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-card/50 overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Conversation ({turns.length} turns)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearConversation}
          className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>
      
      <ScrollArea className="max-h-64">
        <div className="p-3 space-y-3">
          <AnimatePresence>
            {turns.map((turn, index) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                {/* User message */}
                <div className="flex items-start gap-2">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">You</p>
                    <p className="text-sm bg-secondary/50 rounded-lg px-3 py-2 break-words">
                      {turn.query}
                    </p>
                  </div>
                </div>
                
                {/* AI responses summary */}
                {turn.responses.length > 0 && (
                  <div className="flex items-start gap-2 pl-8">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {turn.responses.length} AI response{turn.responses.length > 1 ? 's' : ''}
                      </p>
                      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                        <span className="line-clamp-2">
                          {turn.responses[0]?.response?.slice(0, 150) || 'Response received'}
                          {(turn.responses[0]?.response?.length || 0) > 150 && '...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
