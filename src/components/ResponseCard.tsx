import { Copy, Check, Clock, AlertCircle, Zap, RefreshCw, Pin, PinOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VotingButtons } from '@/components/VotingButtons';
import { QualityRating } from '@/components/QualityRating';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getModelById } from '@/lib/models';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ResponseCardProps {
  modelId: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  isLoading?: boolean;
  isStreaming?: boolean;
  currentVote?: 'up' | 'down' | null;
  onVote?: (type: 'up' | 'down') => void;
  showVoting?: boolean;
  onRegenerate?: () => void;
  currentRating?: number | null;
  onRate?: (rating: number) => void;
  showRating?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  showPinning?: boolean;
}

export function ResponseCard({ 
  modelId, 
  response, 
  error, 
  duration,
  tokens,
  isLoading,
  isStreaming,
  currentVote,
  onVote,
  showVoting = false,
  onRegenerate,
  currentRating,
  onRate,
  showRating = false,
  isPinned = false,
  onPin,
  onUnpin,
  showPinning = false
}: ResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const model = getModelById(modelId);

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const providerColor = model?.provider === 'openai' ? 'bg-green-500' : 'bg-blue-500';

  // Calculate tokens per second for speed metric
  const tokensPerSecond = tokens?.completion && duration > 0 
    ? Math.round((tokens.completion / duration) * 1000) 
    : null;

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card overflow-hidden",
      "transition-all duration-300 animate-fade-in",
      isLoading && "animate-pulse",
      isStreaming && "ring-2 ring-primary/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full", 
            providerColor,
            isStreaming && "animate-pulse"
          )} />
          <span className="font-medium text-sm">{model?.name || modelId}</span>
          {isStreaming && (
            <span className="text-xs text-primary animate-pulse">streaming...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && !isStreaming && !error && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Clock className="h-3 w-3" />
                      <span>{(duration / 1000).toFixed(2)}s</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Response time: {duration}ms</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {tokens && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help px-1.5 py-0.5 rounded bg-secondary/50">
                        <Zap className="h-3 w-3" />
                        <span>{tokens.total.toLocaleString()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1 text-xs">
                        <p>Prompt tokens: {tokens.prompt.toLocaleString()}</p>
                        <p>Completion tokens: {tokens.completion.toLocaleString()}</p>
                        <p>Total tokens: {tokens.total.toLocaleString()}</p>
                        {tokensPerSecond && (
                          <p className="pt-1 border-t border-border">
                            Speed: {tokensPerSecond} tokens/sec
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {showRating && onRate && (
                <QualityRating
                  rating={currentRating ?? null}
                  onRate={onRate}
                  disabled={isLoading || isStreaming}
                />
              )}
              
              {showVoting && onVote && (
                <VotingButtons
                  currentVote={currentVote || null}
                  onVote={onVote}
                />
              )}
              
              {showPinning && (onPin || onUnpin) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isPinned ? 'secondary' : 'ghost'}
                        size="icon"
                        className={cn('h-7 w-7', isPinned && 'text-primary')}
                        onClick={isPinned ? onUnpin : onPin}
                      >
                        {isPinned ? (
                          <PinOff className="h-3.5 w-3.5" />
                        ) : (
                          <Pin className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPinned ? 'Unpin response' : 'Pin response'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {onRegenerate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onRegenerate}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? 'Copied!' : 'Copy response'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 min-h-[120px] max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-shimmer" />
            <div className="h-4 bg-muted rounded w-5/6 animate-shimmer" />
            <div className="h-4 bg-muted rounded w-4/6 animate-shimmer" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : isStreaming ? (
          <div className="text-sm">
            <MarkdownContent content={response} className="text-sm" />
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
          </div>
        ) : (
          <MarkdownContent content={response} className="text-sm" />
        )}
      </div>
    </div>
  );
}
