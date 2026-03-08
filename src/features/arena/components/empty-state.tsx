import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  deepMode: boolean;
  hasContent: boolean;
  isDebating: boolean;
  hasFinalAnswer: boolean;
  hasRoundResponses: boolean;
  historyUser: unknown;
  deepModeSettings: { style: string; rounds: number };
}

export function ArenaEmptyState({
  deepMode,
  hasContent,
  isDebating,
  hasFinalAnswer,
  hasRoundResponses,
  historyUser,
  deepModeSettings,
}: EmptyStateProps) {
  if (deepMode) {
    if (!isDebating && !hasFinalAnswer && !hasRoundResponses) {
      return (
        <section className="py-16 text-center">
          <div className="mb-4 inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-accent/20">
            <span className="text-3xl">🧠</span>
          </div>
          <h3 className="mb-2 text-lg font-medium gradient-text">Deep Mode Active</h3>
          <p className="mx-auto max-w-md text-muted-foreground">
            Ask a complex question. AI models will engage in a {deepModeSettings.style} debate
            over {deepModeSettings.rounds} rounds, then synthesize the best response.
          </p>
        </section>
      );
    }
    return null;
  }

  if (!hasContent && !isDebating && !hasFinalAnswer) {
    return (
      <section className="py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <span className="text-3xl">🤖</span>
        </div>
        <h3 className="mb-2 text-lg font-medium">Ready to Compare</h3>
        <p className="mx-auto mb-4 max-w-md text-muted-foreground">
          Select the AI models you want to compare and ask any question. Enable{' '}
          <span className="font-medium text-accent">Deep Mode</span> for AI models to debate
          and synthesize the best answer.
        </p>
        {!historyUser && (
          <Link to="/auth">
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in to save your comparisons
            </Button>
          </Link>
        )}
      </section>
    );
  }

  return null;
}
