import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ResponseCard } from '@/components/ResponseCard';
import { DebateProgress } from '@/components/DebateProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
}

interface ComparisonData {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
}

interface DebateData {
  id: string;
  query: string;
  models: string[];
  settings: any;
  round_responses: any[];
  final_answer: string | null;
  total_rounds: number;
  elapsed_time: number;
  created_at: string;
}

interface SharedResult {
  history_type: 'comparison' | 'debate';
  history_id: string;
  created_at: string;
}

export default function SharedResult() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedResult, setSharedResult] = useState<SharedResult | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [debateData, setDebateData] = useState<DebateData | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSharedResult() {
      if (!code) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // First fetch the shared result metadata
        const { data: shared, error: sharedError } = await supabase
          .from('shared_results')
          .select('*')
          .eq('share_code', code)
          .maybeSingle();

        if (sharedError) throw sharedError;
        
        if (!shared) {
          setError('This shared result was not found or may have been deleted.');
          setLoading(false);
          return;
        }

        setSharedResult({
          history_type: shared.history_type as 'comparison' | 'debate',
          history_id: shared.history_id,
          created_at: shared.created_at,
        });

        // Fetch the actual data based on type
        if (shared.history_type === 'comparison') {
          const { data: comparison, error: compError } = await supabase
            .from('comparison_history')
            .select('*')
            .eq('id', shared.history_id)
            .maybeSingle();

          if (compError) throw compError;
          
          if (!comparison) {
            setError('The comparison data was not found.');
            setLoading(false);
            return;
          }

          setComparisonData({
            id: comparison.id,
            query: comparison.query,
            responses: comparison.responses as unknown as ModelResponse[],
            created_at: comparison.created_at,
          });
        } else if (shared.history_type === 'debate') {
          const { data: debate, error: debError } = await supabase
            .from('debate_history')
            .select('*')
            .eq('id', shared.history_id)
            .maybeSingle();

          if (debError) throw debError;
          
          if (!debate) {
            setError('The debate data was not found.');
            setLoading(false);
            return;
          }

          setDebateData({
            id: debate.id,
            query: debate.query,
            models: debate.models,
            settings: debate.settings,
            round_responses: debate.round_responses as unknown as any[],
            final_answer: debate.final_answer,
            total_rounds: debate.total_rounds,
            elapsed_time: debate.elapsed_time,
            created_at: debate.created_at,
          });
        }
      } catch (err) {
        logger.error('error', 'Error fetching shared result', { error: err instanceof Error ? err.message : 'Unknown' });
        setError('Failed to load the shared result.');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedResult();
  }, [code]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: 'Link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading shared result...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <Share2 className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Result Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <section className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </section>

        {/* Comparison Result */}
        {comparisonData && (
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Shared Comparison</h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(comparisonData.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-4 border-l-4 border-primary">
                <p className="text-sm font-medium text-muted-foreground">Query:</p>
                <p className="mt-1">{comparisonData.query}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {comparisonData.responses.map((response) => (
                <ResponseCard
                  key={response.model}
                  modelId={response.model}
                  response={response.response}
                  error={response.error}
                  duration={response.duration}
                />
              ))}
            </div>
          </section>
        )}

        {/* Debate Result */}
        {debateData && (
          <section className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">🧠</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">Shared Deep Debate</h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(debateData.created_at)} • {debateData.total_rounds} rounds • {debateData.models.length} models
                  </p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-4 border-l-4 border-accent">
                <p className="text-sm font-medium text-muted-foreground">Query:</p>
                <p className="mt-1">{debateData.query}</p>
              </div>
            </div>

            <DebateProgress
              status={null}
              roundResponses={debateData.round_responses}
              finalAnswer={debateData.final_answer ? {
                answer: debateData.final_answer,
                synthesizer: debateData.settings?.synthesizer || 'google/gemini-2.5-pro',
                rounds: debateData.total_rounds,
                participants: debateData.models,
              } : null}
              elapsedTime={debateData.elapsed_time}
              totalRounds={debateData.total_rounds}
            />
          </section>
        )}

        {/* Call to Action */}
        <section className="text-center py-8">
          <div className="max-w-md mx-auto">
            <p className="text-muted-foreground mb-4">
              Want to try DML Arena yourself?
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                Try AI Comparison
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
