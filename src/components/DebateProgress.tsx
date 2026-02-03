import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, MessageSquare, Sparkles, Brain, Download, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getModelById } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VotingButtons } from '@/components/VotingButtons';
import { DebateRoundRating } from '@/components/DebateRoundRating';
import { MarkdownContent } from '@/components/MarkdownContent';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

interface DebateProgressProps {
  status: {
    phase: string;
    round?: number;
    message: string;
  } | null;
  roundResponses: RoundResponse[];
  finalAnswer: FinalAnswer | null;
  elapsedTime: number;
  totalRounds: number;
  onSave?: () => void;
  showVoting?: boolean;
  onVote?: (modelId: string, type: 'up' | 'down') => void;
  getVote?: (modelId: string) => 'up' | 'down' | null;
  showRating?: boolean;
  onRate?: (modelId: string, round: number, rating: number) => void;
  getRating?: (modelId: string, round: number) => number | null;
}

export function DebateProgress({ 
  status, 
  roundResponses, 
  finalAnswer, 
  elapsedTime,
  totalRounds,
  onSave,
  showVoting = false,
  onVote,
  getVote,
  showRating = false,
  onRate,
  getRating
}: DebateProgressProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRoundResponses = (round: number) => 
    roundResponses.filter(r => r.round === round);

  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  const currentRound = status?.round || 0;
  const isSynthesis = status?.phase === 'synthesis';
  const isComplete = !!finalAnswer;
  
  let progressPercent = 0;
  if (isComplete) {
    progressPercent = 100;
  } else if (isSynthesis) {
    progressPercent = 90;
  } else if (currentRound > 0) {
    progressPercent = Math.min(85, (currentRound / totalRounds) * 85);
  }

  const getRoundLabel = (round: number) => {
    if (round === 1) return "Initial Perspectives";
    if (round === totalRounds) return "Finding Consensus";
    return `Round ${round} - Refinement`;
  };

  const handleCopy = async () => {
    if (!finalAnswer) return;
    
    try {
      await navigator.clipboard.writeText(finalAnswer.answer);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Timer & Overall Progress */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {finalAnswer ? (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center animate-pulse">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {finalAnswer ? 'Debate Complete!' : status?.message || 'Initializing...'}
              </p>
              <p className="text-xs text-muted-foreground">
                {finalAnswer 
                  ? `${totalRounds} rounds completed`
                  : isSynthesis 
                    ? 'Synthesizing best answer...'
                    : currentRound > 0 
                      ? `Round ${currentRound} of ${totalRounds}`
                      : 'Preparing debate...'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold gradient-text">
              {formatTime(elapsedTime)}
            </p>
            <p className="text-xs text-muted-foreground">elapsed</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>{Math.round(progressPercent)}% complete</span>
            <span>Synthesis</span>
          </div>
        </div>
      </div>

      {/* Rounds Progress */}
      <div className="space-y-3">
        {rounds.map((round) => {
          const responses = getRoundResponses(round);
          const isActive = status?.round === round;
          const isRoundComplete = responses.length > 0 && (status?.round || 0) > round;
          const isPending = (status?.round || 0) < round && !finalAnswer;
          const isFinished = finalAnswer && responses.length > 0;

          return (
            <div
              key={round}
              className={cn(
                "rounded-xl border transition-all duration-300",
                isActive && "border-primary bg-primary/5",
                (isRoundComplete || isFinished) && "border-green-500/30 bg-green-500/5",
                isPending && "border-border bg-card opacity-50"
              )}
            >
              {/* Round Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    (isRoundComplete || isFinished) && "bg-green-500 text-white",
                    isPending && "bg-muted text-muted-foreground"
                  )}>
                    {(isRoundComplete || isFinished) ? <Check className="h-4 w-4" /> : round}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{getRoundLabel(round)}</p>
                    <p className="text-xs text-muted-foreground">
                      {responses.length} model{responses.length !== 1 ? 's' : ''} responded
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-medium">In progress</span>
                  </div>
                )}
              </div>

              {/* Round Responses */}
              <AnimatePresence>
                {responses.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/50"
                  >
                    <div className="divide-y divide-border/50">
                      {responses.map((response, idx) => {
                        const model = getModelById(response.model);
                        return (
                          <motion.div
                            key={`${response.model}-${idx}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4"
                          >
                              <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  model?.provider === 'openai' ? "bg-green-500" : "bg-blue-500"
                                )} />
                                <span className="text-xs font-medium">{model?.name || response.model}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {showRating && onRate && getRating && (
                                  <DebateRoundRating
                                    modelId={response.model}
                                    rating={getRating(response.model, response.round)}
                                    onRate={(rating) => onRate(response.model, response.round, rating)}
                                  />
                                )}
                                {showVoting && onVote && getVote && (
                                  <VotingButtons
                                    currentVote={getVote(response.model)}
                                    onVote={(type) => onVote(response.model, type)}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-3">
                              <MarkdownContent content={response.response} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Synthesis Status */}
      {isSynthesis && !finalAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-accent/30 bg-accent/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <div>
              <p className="font-medium text-sm">Synthesizing Final Answer</p>
              <p className="text-xs text-muted-foreground">
                Analyzing all perspectives to create the best response...
              </p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-accent ml-auto" />
          </div>
        </motion.div>
      )}

      {/* Final Answer */}
      <AnimatePresence>
        {finalAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gradient-border rounded-xl overflow-hidden"
          >
            <div className="p-6 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold gradient-text">Best Answer</h3>
                    <p className="text-xs text-muted-foreground">
                      Synthesized from {finalAnswer.rounds} rounds by {finalAnswer.participants.length} models
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  {onSave && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSave}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </Button>
                  )}
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <MarkdownContent content={finalAnswer.answer} className="text-sm leading-relaxed" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
