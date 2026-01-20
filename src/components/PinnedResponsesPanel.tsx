import { Pin, PinOff, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getModelById } from '@/lib/models';
import { cn } from '@/lib/utils';
import { PinnedResponse } from '@/hooks/usePinnedResponses';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PinnedResponsesPanelProps {
  pinnedResponses: PinnedResponse[];
  onUnpin: (id: string) => void;
  onClearAll: () => void;
  onViewHistory?: (historyId: string, historyType: 'comparison' | 'debate') => void;
}

export function PinnedResponsesPanel({
  pinnedResponses,
  onUnpin,
  onClearAll,
  onViewHistory,
}: PinnedResponsesPanelProps) {
  if (pinnedResponses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Pin className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No pinned responses</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Pin responses from your comparisons to keep them easily accessible here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Pinned Responses</h2>
          <Badge variant="secondary" className="text-xs">
            {pinnedResponses.length}
          </Badge>
        </div>
        {pinnedResponses.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all pinned responses?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {pinnedResponses.length} pinned responses. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-3 pr-4">
          <AnimatePresence mode="popLayout">
            {pinnedResponses.map((pinned) => {
              const modelInfo = getModelById(pinned.modelId);
              return (
                <motion.div
                  key={pinned.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 bg-card border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            modelInfo?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500'
                          )}
                        />
                        <span className="font-medium text-sm truncate">
                          {modelInfo?.name || pinned.modelId}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {pinned.historyType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onViewHistory && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onViewHistory(pinned.historyId, pinned.historyType)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onUnpin(pinned.id)}
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3 p-2 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground line-clamp-2">{pinned.query}</p>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownContent content={pinned.response} className="text-sm line-clamp-6" />
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Pinned {new Date(pinned.pinnedAt).toLocaleDateString()}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
