import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { ResponseGrid } from '@/components/ResponseGrid';
import { DeepModeToggle, DeepModeSettings } from '@/components/DeepModeToggle';
import { DebateProgress } from '@/components/DebateProgress';
import { ShareButton } from '@/components/ShareButton';
import { ExportDropdown } from '@/components/ExportDropdown';
import { AI_MODELS } from '@/lib/models';
import { useDeepDebate } from '@/hooks/useDeepDebate';
import { useHistory } from '@/hooks/useHistory';
import { useStreamingComparison } from '@/hooks/useStreamingComparison';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';
import { History, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

interface QueryHistory {
  id: string | null;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

const DEBATE_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
];

export default function Index() {
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [hasInitializedModels, setHasInitializedModels] = useState(false);
  const [deepMode, setDeepMode] = useState(false);
  const [deepModeSettings, setDeepModeSettings] = useState<DeepModeSettings>({
    rounds: 2,
    style: 'collaborative',
    responseLength: 'concise',
    focusArea: 'balanced',
    persona: 'none',
    customPersona: undefined,
    synthesizer: 'google/gemini-2.5-pro',
  });
  const [currentDebateId, setCurrentDebateId] = useState<string | null>(null);
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { toast } = useToast();

  const deepDebate = useDeepDebate();
  const history = useHistory(settings.autoSaveHistory);
  const streaming = useStreamingComparison();

  // Initialize selected models from settings
  useEffect(() => {
    if (settingsLoaded && !hasInitializedModels) {
      setSelectedModels(settings.defaultModels);
      setHasInitializedModels(true);
    }
  }, [settingsLoaded, settings.defaultModels, hasInitializedModels]);

  // Save debate when complete
  useEffect(() => {
    if (deepDebate.finalAnswer && !currentDebateId) {
      const query = deepDebate.roundResponses[0]?.response?.slice(0, 200) || 'Debate';
      history.saveDebate(
        query,
        DEBATE_MODELS,
        deepModeSettings,
        deepDebate.roundResponses,
        deepDebate.finalAnswer.answer,
        deepDebate.totalRounds,
        deepDebate.elapsedTime
      ).then(id => {
        if (id) setCurrentDebateId(id);
      });
    }
  }, [deepDebate.finalAnswer]);

  // Save comparison when streaming completes
  useEffect(() => {
    const responses = streaming.getResponsesArray();
    const allComplete = responses.length > 0 && 
      responses.every(r => !r.isStreaming) && 
      !streaming.isLoading;
    
    if (allComplete && currentQuery && !currentComparisonId) {
      const formattedResponses = responses.map(r => ({
        model: r.model,
        response: r.response,
        error: r.error,
        duration: r.duration,
        tokens: r.tokens,
      }));
      
      history.saveComparison(currentQuery, formattedResponses).then(id => {
        if (id) {
          setCurrentComparisonId(id);
          toast({
            title: 'Responses received',
            description: `Got ${responses.length} responses from AI models.`,
          });
        }
      });
    }
  }, [streaming.responses, streaming.isLoading]);

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

  const handleToggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSelectAll = () => {
    setSelectedModels(AI_MODELS.map(m => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedModels([]);
  };

  const handleSendMessage = async (message: string) => {
    if (deepMode) {
      const debateModels = selectedModels.filter(m => DEBATE_MODELS.includes(m));
      if (debateModels.length < 2) {
        toast({
          title: 'Need more models for debate',
          description: 'Deep Mode requires at least 2 compatible models (GPT-5, GPT-5 Mini, Gemini Pro, Gemini Flash).',
          variant: 'destructive',
        });
        return;
      }
      
      setCurrentDebateId(null);
      deepDebate.startDebate(message, debateModels, deepModeSettings);
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: 'No models selected',
        description: 'Please select at least one AI model to compare.',
        variant: 'destructive',
      });
      return;
    }

    // Reset for new comparison
    setCurrentComparisonId(null);
    setCurrentQuery(message);
    streaming.reset();
    
    // Start streaming comparison
    streaming.startComparison(message, selectedModels);
  };

  const handleClearHistory = () => {
    streaming.reset();
    deepDebate.reset();
    setCurrentDebateId(null);
    setCurrentComparisonId(null);
    setCurrentQuery('');
    history.clearHistory();
  };

  const handleVote = (historyId: string, modelId: string, type: 'up' | 'down') => {
    history.vote(historyId, 'comparison', modelId, type);
  };

  const handleDebateVote = (modelId: string, type: 'up' | 'down') => {
    if (currentDebateId) {
      history.vote(currentDebateId, 'debate', modelId, type);
    }
  };

  const handleRegenerate = (modelId: string) => {
    if (!currentQuery) return;
    // Regenerate just this one model
    streaming.startComparison(currentQuery, [modelId]);
    toast({
      title: 'Regenerating response',
      description: `Requesting new response from ${modelId.split('/')[1]}...`,
    });
  };

  const isProcessing = streaming.isLoading || deepDebate.isDebating;

  // Get current streaming responses
  const streamingResponses = streaming.getResponsesArray();
  const hasStreamingContent = streamingResponses.length > 0;

  // Use persistent history
  const displayHistory = history.comparisonHistory.map(h => ({
    id: h.id,
    query: h.query,
    responses: h.responses as ModelResponse[],
    timestamp: new Date(h.created_at),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Model Selector */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6" data-tour="model-selector">
          <ModelSelector
            selectedModels={selectedModels}
            onToggleModel={handleToggleModel}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </section>

        {/* Deep Mode Toggle */}
        <section className="max-w-3xl mx-auto" data-tour="deep-mode">
          <DeepModeToggle
            enabled={deepMode} 
            onToggle={setDeepMode}
            settings={deepModeSettings}
            onSettingsChange={setDeepModeSettings}
          />
        </section>

        {/* Chat Input */}
        <section className="max-w-3xl mx-auto" data-tour="chat-input">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isProcessing}
            disabled={selectedModels.length === 0}
          />
        </section>

        {/* Deep Mode Debate Progress */}
        {(deepDebate.isDebating || deepDebate.finalAnswer || deepDebate.roundResponses.length > 0) && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold gradient-text">Deep Debate</h2>
              <div className="flex items-center gap-2">
                {deepDebate.finalAnswer && currentDebateId && (
                  <ShareButton
                    onShare={() => history.shareResult(currentDebateId, 'debate')}
                  />
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
              onSave={deepDebate.finalAnswer ? handleSaveDebate : undefined}
              showVoting={!!currentDebateId}
              onVote={handleDebateVote}
              getVote={(modelId) => history.getVote(currentDebateId || '', modelId)}
            />
            {deepDebate.error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                {deepDebate.error}
              </div>
            )}
          </section>
        )}

        {/* Current Streaming Responses */}
        {!deepMode && hasStreamingContent && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {streaming.isLoading ? 'Streaming Responses...' : 'Current Responses'}
                </h2>
                {streaming.isLoading && (
                  <span className="text-xs text-primary animate-pulse">
                    {streaming.streamingModels.length} models streaming
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentComparisonId && !streaming.isLoading && (
                  <ExportDropdown
                    query={currentQuery}
                    responses={streamingResponses}
                  />
                )}
                {currentComparisonId && (
                  <ShareButton
                    onShare={() => history.shareResult(currentComparisonId, 'comparison')}
                  />
                )}
                {streaming.isLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={streaming.cancel}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            {currentQuery && (
              <div className="bg-secondary/30 rounded-lg p-4 border-l-4 border-primary">
                <p className="text-sm font-medium">Your Query:</p>
                <p className="text-muted-foreground mt-1">{currentQuery}</p>
              </div>
            )}
            <ResponseGrid 
              responses={streamingResponses} 
              loadingModels={streaming.streamingModels.filter(m => 
                !streamingResponses.some(r => r.model === m)
              )}
              historyId={currentComparisonId}
              showVoting={!!currentComparisonId}
              onVote={(modelId, type) => currentComparisonId && handleVote(currentComparisonId, modelId, type)}
              getVote={(modelId) => currentComparisonId ? history.getVote(currentComparisonId, modelId) : null}
              onRegenerate={!streaming.isLoading ? handleRegenerate : undefined}
            />
          </section>
        )}

        {/* Response History (Regular Mode) */}
        {!deepMode && displayHistory.length > 0 && !hasStreamingContent && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Responses</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                <History className="h-3 w-3" />
                Saved
              </span>
            </div>

            {displayHistory.map((entry, index) => (
              <div key={entry.id || index} className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4 border-l-4 border-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Your Query:</p>
                      <p className="text-muted-foreground mt-1">{entry.query}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {entry.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.id && (
                        <ExportDropdown
                          query={entry.query}
                          responses={entry.responses}
                          createdAt={entry.timestamp.toISOString()}
                        />
                      )}
                      {entry.id && (
                        <ShareButton
                          onShare={() => history.shareResult(entry.id!, 'comparison')}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <ResponseGrid 
                  responses={entry.responses} 
                  loadingModels={[]}
                  historyId={entry.id}
                  showVoting={!!entry.id}
                  onVote={(modelId, type) => entry.id && handleVote(entry.id, modelId, type)}
                  getVote={(modelId) => entry.id ? history.getVote(entry.id, modelId) : null}
                />
              </div>
            ))}
          </section>
        )}

        {/* Empty State */}
        {!deepMode && displayHistory.length === 0 && !hasStreamingContent && !deepDebate.isDebating && !deepDebate.finalAnswer && (
          <section className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Ready to Compare</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Select the AI models you want to compare and ask any question. 
              Enable <span className="text-accent font-medium">Deep Mode</span> for AI models to debate and synthesize the best answer.
            </p>
            {!history.user && (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in to save your comparisons
                </Button>
              </Link>
            )}
          </section>
        )}

        {/* Deep Mode Empty State */}
        {deepMode && !deepDebate.isDebating && !deepDebate.finalAnswer && deepDebate.roundResponses.length === 0 && (
          <section className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4 animate-pulse">
              <span className="text-3xl">🧠</span>
            </div>
            <h3 className="text-lg font-medium mb-2 gradient-text">Deep Mode Active</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask a complex question. AI models will engage in a {deepModeSettings.style} debate over {deepModeSettings.rounds} rounds, 
              then synthesize the best response.
            </p>
          </section>
        )}
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
