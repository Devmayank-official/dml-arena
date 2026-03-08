import { useEffect } from 'react';
import { useArenaStore, useSettingsStore } from '@/stores';
import { useDeepDebate } from '@/hooks/useDeepDebate';
import { useHistory } from '@/hooks/useHistory';
import { useStreamingComparison } from '@/hooks/useStreamingComparison';
import { useModelPerformance } from '@/hooks/useModelPerformance';
import { useNotifications } from '@/hooks/useNotifications';
import { useConversation } from '@/hooks/useConversation';
import { useRatings } from '@/hooks/useRatings';
import { useDebateRatings } from '@/hooks/useDebateRatings';
import { useSubscription, FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { classifyQuery } from '@/lib/queryCategories';
import { ALL_MODELS } from '@/lib/models';
import type { ModelResponse } from '@/types';

const DEBATE_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
];

/** Central hook that wires together all arena logic */
export function useArena() {
  const { toast } = useToast();
  const { settings } = useSettingsStore();
  const arena = useArenaStore();
  const { trackPerformance } = useModelPerformance();
  const { notifyComparisonComplete, notifyDebateComplete } = useNotifications();

  const deepDebate = useDeepDebate();
  const history = useHistory(settings.autoSaveHistory);
  const streaming = useStreamingComparison();
  const conversation = useConversation();
  const ratings = useRatings(settings.autoSaveHistory);
  const debateRatings = useDebateRatings(arena.currentDebateId);
  const { isPro, hasReachedLimit, incrementUsage, refetch: refetchSubscription } = useSubscription();

  const maxModels = isPro
    ? PRO_PLAN_LIMITS.maxModelsPerComparison
    : FREE_PLAN_LIMITS.maxModelsPerComparison;

  // Initialize models from settings
  useEffect(() => {
    arena.initializeModels(settings.defaultModels);
  }, [settings.defaultModels]);

  // Save debate when complete
  useEffect(() => {
    if (deepDebate.finalAnswer && !arena.currentDebateId) {
      const query =
        deepDebate.roundResponses[0]?.response?.slice(0, 200) || 'Debate';
      history
        .saveDebate(
          query,
          DEBATE_MODELS,
          arena.deepModeSettings,
          deepDebate.roundResponses,
          deepDebate.finalAnswer.answer,
          deepDebate.totalRounds,
          deepDebate.elapsedTime
        )
        .then((id) => {
          if (id) {
            arena.setCurrentDebateId(id);
            notifyDebateComplete(deepDebate.totalRounds);
          }
        });
    }
  }, [deepDebate.finalAnswer]);

  // Save comparison when streaming completes
  useEffect(() => {
    const responses = streaming.getResponsesArray();
    const allComplete =
      responses.length > 0 &&
      responses.every((r) => !r.isStreaming) &&
      !streaming.isLoading;

    if (allComplete && arena.currentQuery && !arena.currentComparisonId) {
      const formattedResponses = responses.map((r) => ({
        model: r.model,
        response: r.response,
        error: r.error,
        duration: r.duration,
        tokens: r.tokens,
      }));

      for (const r of responses) {
        trackPerformance(
          r.model,
          r.duration,
          r.tokens?.total || null,
          arena.currentCategory,
          !r.error
        );
      }

      if (conversation.currentTurnId) {
        conversation.updateTurn(conversation.currentTurnId, formattedResponses);
      }

      history.saveComparison(arena.currentQuery, formattedResponses).then((id) => {
        if (id) {
          arena.setCurrentComparisonId(id);
          notifyComparisonComplete(responses.length, arena.currentQuery);
        }
      });
    }
  }, [streaming.responses, streaming.isLoading]);

  const handleToggleModel = (modelId: string) => {
    const success = arena.toggleModel(modelId, maxModels);
    if (!success) {
      toast({
        title: `Max ${maxModels} models`,
        description: isPro
          ? 'Pro plan allows up to 5 models.'
          : 'Upgrade to Pro for up to 5 models.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = () => {
    arena.selectAllModels(
      ALL_MODELS.map((m) => m.id),
      maxModels
    );
  };

  const handleSendMessage = async (message: string) => {
    if (!isPro) {
      if (hasReachedLimit) {
        toast({
          title: 'Usage limit reached',
          description: 'Upgrade to Pro for unlimited queries.',
          variant: 'destructive',
        });
        return;
      }
      const usageResult = await incrementUsage();
      if (!usageResult.success) {
        toast({
          title: usageResult.error === 'Usage limit reached' ? 'Usage limit reached' : 'Error',
          description: usageResult.error || 'Failed to track usage',
          variant: 'destructive',
        });
        refetchSubscription();
        return;
      }
    }

    if (arena.deepMode) {
      const debateModels = arena.selectedModels.filter((m) =>
        DEBATE_MODELS.includes(m)
      );
      if (debateModels.length < 2) {
        toast({
          title: 'Need more models for debate',
          description:
            'Deep Mode requires at least 2 compatible models (GPT-5, GPT-5 Mini, Gemini Pro, Gemini Flash).',
          variant: 'destructive',
        });
        return;
      }
      arena.setCurrentDebateId(null);
      deepDebate.startDebate(message, debateModels, arena.deepModeSettings);
      return;
    }

    if (arena.selectedModels.length === 0) {
      toast({
        title: 'No models selected',
        description: 'Please select at least one AI model to compare.',
        variant: 'destructive',
      });
      return;
    }

    arena.setCurrentComparisonId(null);
    arena.setCurrentQuery(message);

    const category = classifyQuery(message);
    arena.setCurrentCategory(category);
    conversation.addTurn(message);
    const contextMessages = conversation.getContextMessages();

    streaming.reset();
    streaming.startComparison(message, arena.selectedModels, contextMessages);
  };

  const handleClearHistory = () => {
    streaming.reset();
    deepDebate.reset();
    conversation.clearConversation();
    arena.resetComparison();
    history.clearHistory();
  };

  const handleSaveDebate = () => {
    const transcript = deepDebate.getDebateTranscript();
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Debate saved', description: 'Downloaded as markdown file' });
  };

  const handleVote = (historyId: string, modelId: string, type: 'up' | 'down') => {
    history.vote(historyId, 'comparison', modelId, type);
  };

  const handleDebateVote = (modelId: string, type: 'up' | 'down') => {
    if (arena.currentDebateId) {
      history.vote(arena.currentDebateId, 'debate', modelId, type);
    }
  };

  const handleDebateRating = (modelId: string, round: number, rating: number) => {
    if (arena.currentDebateId) {
      debateRatings.rateResponse(modelId, round, rating);
    }
  };

  const handleRegenerate = (modelId: string) => {
    if (!arena.currentQuery) return;
    streaming.startComparison(arena.currentQuery, [modelId]);
    toast({
      title: 'Regenerating response',
      description: `Requesting new response from ${modelId.split('/')[1]}...`,
    });
  };

  return {
    // State (from store)
    ...arena,
    maxModels,
    isPro,

    // Streaming
    streaming,
    streamingResponses: streaming.getResponsesArray(),
    isProcessing: streaming.isLoading || deepDebate.isDebating,

    // Deep debate
    deepDebate,

    // Conversation
    conversation,

    // History
    history,

    // Ratings
    ratings,
    debateRatings,

    // Actions
    handleToggleModel,
    handleSelectAll,
    handleDeselectAll: arena.deselectAllModels,
    handleSendMessage,
    handleClearHistory,
    handleSaveDebate,
    handleVote,
    handleDebateVote,
    handleDebateRating,
    handleRegenerate,
  };
}
