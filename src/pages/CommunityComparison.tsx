import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Clock, User, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { ResponseCard } from '@/components/ResponseCard';
import { ExportDropdown } from '@/components/ExportDropdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
}

interface ComparisonData {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
  user_id: string | null;
}

interface ModelVote {
  model_id: string;
  vote_type: 'up' | 'down';
}

export default function CommunityComparison() {
  const { id } = useParams<{ id: string }>();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [modelVotes, setModelVotes] = useState<Map<string, 'up' | 'down'>>(new Map());
  const [voteCounts, setVoteCounts] = useState<Map<string, { up: number; down: number }>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchComparison = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setComparison({
        id: data.id,
        query: data.query,
        responses: data.responses as unknown as ModelResponse[],
        created_at: data.created_at,
        user_id: data.user_id,
      });

      // Fetch votes for this comparison's models
      const { data: votesData } = await supabase
        .from('response_votes')
        .select('*')
        .eq('history_id', id)
        .eq('history_type', 'comparison');

      if (votesData) {
        const userVotes = new Map<string, 'up' | 'down'>();
        const counts = new Map<string, { up: number; down: number }>();

        votesData.forEach((vote: { model_id: string; vote_type: string }) => {
          // Count all votes
          const current = counts.get(vote.model_id) || { up: 0, down: 0 };
          if (vote.vote_type === 'up') current.up++;
          else if (vote.vote_type === 'down') current.down++;
          counts.set(vote.model_id, current);
        });

        // Get user's votes specifically
        if (user) {
          const { data: userVotesData } = await supabase
            .from('response_votes')
            .select('*')
            .eq('history_id', id)
            .eq('history_type', 'comparison');
          
          // Note: response_votes doesn't have user_id, so we track locally
        }

        setVoteCounts(counts);
      }
    } catch (error) {
      logger.error('error', 'Error fetching comparison', { error: error instanceof Error ? error.message : 'Unknown' });
      toast({
        title: 'Error',
        description: 'Failed to load comparison',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, user, toast]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const handleVote = async (modelId: string, type: 'up' | 'down') => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote',
        variant: 'destructive',
      });
      return;
    }

    if (!id) return;

    const currentVote = modelVotes.get(modelId);
    const newVotes = new Map(modelVotes);
    const newCounts = new Map(voteCounts);
    const current = newCounts.get(modelId) || { up: 0, down: 0 };

    try {
      if (currentVote === type) {
        // Remove vote
        newVotes.delete(modelId);
        if (type === 'up') current.up = Math.max(0, current.up - 1);
        else current.down = Math.max(0, current.down - 1);
      } else {
        // Add or change vote
        if (currentVote) {
          // Changing vote
          if (currentVote === 'up') current.up = Math.max(0, current.up - 1);
          else current.down = Math.max(0, current.down - 1);
        }
        newVotes.set(modelId, type);
        if (type === 'up') current.up++;
        else current.down++;

        // Save to database
        await supabase.from('response_votes').insert({
          history_id: id,
          history_type: 'comparison',
          model_id: modelId,
          vote_type: type,
        });
      }

      newCounts.set(modelId, current);
      setModelVotes(newVotes);
      setVoteCounts(newCounts);

      toast({
        title: currentVote === type ? 'Vote removed' : 'Vote recorded',
        description: `Your vote for ${modelId.split('/')[1]} has been ${currentVote === type ? 'removed' : 'saved'}`,
      });
    } catch (error) {
      logger.error('error', 'Error voting', { error: error instanceof Error ? error.message : 'Unknown' });
      toast({
        title: 'Error',
        description: 'Failed to save vote',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">Comparison not found</h2>
            <p className="text-muted-foreground mb-4">This comparison may have been deleted or is not public.</p>
            <Link to="/chat/community">
              <Button>Back to Community</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-6 md:py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Link to="/chat/community">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">Community Comparison</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {comparison.user_id && (
                  <Link 
                    to={`/chat/profile/${comparison.user_id}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <User className="h-3 w-3" />
                    View profile
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(comparison.created_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {comparison.responses.length} models
                </span>
              </div>
            </div>
          </div>
          <ExportDropdown 
            query={comparison.query}
            responses={comparison.responses}
            createdAt={comparison.created_at}
          />
        </motion.div>

        {/* Query */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 mb-6 bg-secondary/30 border-l-4 border-primary">
            <p className="text-sm font-medium text-muted-foreground">Query</p>
            <p className="text-foreground mt-1">{comparison.query}</p>
          </Card>
        </motion.div>

        {/* Responses Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {comparison.responses.map((response, idx) => {
            const counts = voteCounts.get(response.model) || { up: 0, down: 0 };
            const userVote = modelVotes.get(response.model);
            
            return (
              <motion.div
                key={response.model}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <div className="relative">
                  <ResponseCard
                    modelId={response.model}
                    response={response.response}
                    error={response.error}
                    duration={response.duration}
                    tokens={response.tokens}
                    isLoading={false}
                    showVoting={!!user}
                    currentVote={userVote || null}
                    onVote={(type) => handleVote(response.model, type)}
                  />
                  
                  {/* Vote counts display */}
                  <div className="absolute top-2 right-2 flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                      <ThumbsUp className="h-3 w-3" />
                      {counts.up}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      <ThumbsDown className="h-3 w-3" />
                      {counts.down}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Sign in prompt for voting */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <Card className="inline-block p-4">
              <p className="text-muted-foreground mb-2">Sign in to vote on individual model responses</p>
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
