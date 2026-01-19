import { useState } from 'react';
import { ResponseCard } from './ResponseCard';
import { ResponseDiffView } from './ResponseDiffView';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  isStreaming?: boolean;
}

interface ResponseGridProps {
  responses: ModelResponse[];
  loadingModels: string[];
  historyId?: string | null;
  showVoting?: boolean;
  onVote?: (modelId: string, type: 'up' | 'down') => void;
  getVote?: (modelId: string) => 'up' | 'down' | null;
  onRegenerate?: (modelId: string) => void;
  showRating?: boolean;
  onRate?: (modelId: string, rating: number) => void;
  getRating?: (modelId: string) => number | null;
}

export function ResponseGrid({ 
  responses, 
  loadingModels,
  historyId,
  showVoting = false,
  onVote,
  getVote,
  onRegenerate,
  showRating = false,
  onRate,
  getRating
}: ResponseGridProps) {
  const [showDiffView, setShowDiffView] = useState(false);
  const respondedModels = new Set(responses.map(r => r.model));
  const stillLoadingModels = loadingModels.filter(m => !respondedModels.has(m));

  if (responses.length === 0 && stillLoadingModels.length === 0) {
    return null;
  }

  const totalCount = responses.length + stillLoadingModels.length;
  const completedCount = responses.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const validResponsesCount = responses.filter(r => !r.error && r.response && !r.isStreaming).length;
  const canShowDiff = validResponsesCount >= 2 && stillLoadingModels.length === 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {stillLoadingModels.length > 0 && (
        <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Processing models...</span>
            <span className="font-medium">{completedCount} of {totalCount} complete</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 sm:h-2" />
        </div>
      )}

      {/* Diff View Toggle */}
      {canShowDiff && (
        <div className="flex justify-end">
          <Button
            variant={showDiffView ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiffView(!showDiffView)}
            className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {showDiffView ? 'Grid View' : 'Compare View'}
          </Button>
        </div>
      )}

      {/* Diff View */}
      {showDiffView && canShowDiff ? (
        <ResponseDiffView 
          responses={responses} 
          onClose={() => setShowDiffView(false)} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {stillLoadingModels.map((model) => (
            <ResponseCard
              key={model}
              modelId={model}
              response=""
              duration={0}
              isLoading={true}
            />
          ))}
          
          {responses.map((response) => (
            <ResponseCard
              key={response.model}
              modelId={response.model}
              response={response.response}
              error={response.error}
              duration={response.duration}
              tokens={response.tokens}
              isLoading={false}
              isStreaming={response.isStreaming}
              showVoting={showVoting && !!historyId && !response.error && !response.isStreaming}
              currentVote={getVote ? getVote(response.model) : null}
              onVote={onVote ? (type) => onVote(response.model, type) : undefined}
              onRegenerate={onRegenerate && !response.isStreaming && !response.error ? () => onRegenerate(response.model) : undefined}
              showRating={showRating && !!historyId && !response.error && !response.isStreaming}
              currentRating={getRating ? getRating(response.model) : null}
              onRate={onRate ? (rating) => onRate(response.model, rating) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}