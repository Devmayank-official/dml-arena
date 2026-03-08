import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { DebateProgress } from '@/components/DebateProgress';

interface RoundResponse {
  round: number;
  model: string;
  response: string;
}

interface FinalAnswer {
  answer: string;
  synthesizer: string;
  rounds: number;
  participants: string[];
}

interface DebateSectionProps {
  deepDebate: {
    isDebating: boolean;
    status: { phase: string; round?: number; message: string } | null;
    roundResponses: RoundResponse[];
    finalAnswer: FinalAnswer | null;
    elapsedTime: number;
    totalRounds: number;
    error?: string;
    reset: () => void;
  };
  currentDebateId: string | null;
  onSaveDebate: () => void;
  onShareDebate: () => Promise<string | null>;
  onVote: (modelId: string, type: 'up' | 'down') => void;
  getVote: (modelId: string) => 'up' | 'down' | null;
  onRate: (modelId: string, round: number, rating: number) => void;
  getRating: (modelId: string, round: number) => number | null;
}

export function DebateSection({
  deepDebate,
  currentDebateId,
  onSaveDebate,
  onShareDebate,
  onVote,
  getVote,
  onRate,
  getRating,
}: DebateSectionProps) {
  const showSection =
    deepDebate.isDebating ||
    deepDebate.finalAnswer ||
    deepDebate.roundResponses.length > 0;

  if (!showSection) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold gradient-text">Deep Debate</h2>
        <div className="flex items-center gap-2">
          {deepDebate.finalAnswer && currentDebateId && (
            <ShareButton onShare={onShareDebate} />
          )}
          {deepDebate.finalAnswer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={deepDebate.reset}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Debate
            </Button>
          )}
        </div>
      </div>
      <DebateProgress
        status={deepDebate.status}
        roundResponses={deepDebate.roundResponses}
        finalAnswer={deepDebate.finalAnswer}
        elapsedTime={deepDebate.elapsedTime}
        totalRounds={deepDebate.totalRounds}
        onSave={deepDebate.finalAnswer ? onSaveDebate : undefined}
        showVoting={!!currentDebateId}
        onVote={onVote}
        getVote={getVote}
        showRating={!!currentDebateId}
        onRate={onRate}
        getRating={getRating}
      />
      {deepDebate.error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {deepDebate.error}
        </div>
      )}
    </section>
  );
}
