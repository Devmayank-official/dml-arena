import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ResponseGrid } from '@/components/ResponseGrid';
import { StreamingIndicator } from '@/components/StreamingIndicator';
import { ShareButton } from '@/components/ShareButton';
import { ExportDropdown } from '@/components/ExportDropdown';
import { QuickReRun } from '@/components/QuickReRun';
import { CategoryBadge } from '@/components/CategoryBadge';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';
import type { StreamingResponse } from '@/hooks/useStreamingComparison';
import type { QueryCategory } from '@/lib/queryCategories';

interface ResponsesSectionProps {
  streamingResponses: StreamingResponse[];
  streamingModels: string[];
  selectedModels: string[];
  isLoading: boolean;
  currentQuery: string;
  currentCategory: QueryCategory | null;
  currentComparisonId: string | null;
  historyUser: unknown;
  onCancel: () => void;
  onReRun: (query: string, models: string[]) => void;
  onShare: () => Promise<string | null>;
  onVote: (modelId: string, type: 'up' | 'down') => void;
  getVote: (modelId: string) => string | null;
  onRegenerate: (modelId: string) => void;
  onRate: (modelId: string, rating: number) => void;
  getRating: (modelId: string) => number | null;
  resetStreaming: () => void;
}

export function ResponsesSection({
  streamingResponses,
  streamingModels,
  selectedModels,
  isLoading,
  currentQuery,
  currentCategory,
  currentComparisonId,
  historyUser,
  onCancel,
  onReRun,
  onShare,
  onVote,
  getVote,
  onRegenerate,
  onRate,
  getRating,
  resetStreaming,
}: ResponsesSectionProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const hasContent = streamingResponses.length > 0;

  return (
    <>
      {/* Streaming indicator */}
      <AnimatePresence>
        {isLoading && streamingModels.length > 0 && (
          <section className="mx-auto max-w-3xl">
            <StreamingIndicator
              streamingModels={streamingModels}
              totalModels={selectedModels.length}
            />
          </section>
        )}
      </AnimatePresence>

      {/* Responses */}
      {hasContent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isLoading ? 'Streaming Responses...' : 'Current Responses'}
            </h2>
            <div className="flex items-center gap-2">
              {currentQuery && !isLoading && (
                <QuickReRun
                  lastQuery={currentQuery}
                  lastModels={selectedModels}
                  onReRun={(query, models) => {
                    resetStreaming();
                    onReRun(query, models);
                  }}
                  disabled={isLoading}
                />
              )}

              {currentComparisonId && !isLoading && (
                <>
                  <FavoriteButton
                    isFavorite={isFavorite('comparison', currentComparisonId)}
                    onToggle={() => toggleFavorite('comparison', currentComparisonId)}
                    size="sm"
                  />
                  <ExportDropdown
                    query={currentQuery}
                    responses={streamingResponses}
                  />
                </>
              )}
              {currentComparisonId && <ShareButton onShare={onShare} />}
              {isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {currentQuery && (
            <div className="rounded-lg border-l-4 border-primary bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your Query:</p>
                {currentCategory && <CategoryBadge category={currentCategory} />}
              </div>
              <p className="mt-1 text-muted-foreground">{currentQuery}</p>
            </div>
          )}

          <ResponseGrid
            responses={streamingResponses}
            loadingModels={streamingModels.filter(
              (m) => !streamingResponses.some((r) => r.model === m)
            )}
            historyId={currentComparisonId}
            showVoting={!!currentComparisonId}
            onVote={(modelId, type) =>
              currentComparisonId && onVote(modelId, type)
            }
            getVote={(modelId) =>
              currentComparisonId ? getVote(modelId) : null
            }
            onRegenerate={!isLoading ? onRegenerate : undefined}
            showRating={!!currentComparisonId && !!historyUser}
            onRate={(modelId, rating) =>
              currentComparisonId && onRate(modelId, rating)
            }
            getRating={(modelId) =>
              currentComparisonId ? getRating(modelId) : null
            }
          />
        </section>
      )}
    </>
  );
}
