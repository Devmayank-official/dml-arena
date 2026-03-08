import { AppLayout } from '@/components/AppLayout';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { DeepModeToggle } from '@/components/DeepModeToggle';
import { UsageAlert } from '@/components/UsageAlert';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { ConversationThread } from '@/components/ConversationThread';
import {
  useArena,
  DebateSection,
  ResponsesSection,
  ArenaEmptyState,
} from '@/features/arena';

export function ArenaPage() {
  const arena = useArena();

  return (
    <AppLayout>
      <main className="container mx-auto space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 md:space-y-8 md:py-8">
        {/* Usage Alert for Free Users */}
        <UsageAlert />

        {/* Model Selector */}
        <section
          className="rounded-xl border border-border bg-card p-3 sm:p-4 md:p-6"
          data-tour="model-selector"
        >
          <ModelSelector
            selectedModels={arena.selectedModels}
            onToggleModel={arena.handleToggleModel}
            onSelectAll={arena.handleSelectAll}
            onDeselectAll={arena.handleDeselectAll}
            onSetModels={arena.setSelectedModels}
          />
        </section>

        {/* Deep Mode Toggle */}
        <section className="mx-auto max-w-3xl" data-tour="deep-mode">
          <DeepModeToggle
            enabled={arena.deepMode}
            onToggle={arena.setDeepMode}
            settings={arena.deepModeSettings}
            onSettingsChange={arena.setDeepModeSettings}
            onVoicePrompt={(prompt) => {
              if (prompt.trim()) {
                arena.handleSendMessage(prompt.trim());
              }
            }}
          />
        </section>

        {/* Conversation Thread */}
        {!arena.deepMode && arena.conversation.turns.length > 0 && (
          <section className="mx-auto max-w-3xl">
            <ConversationThread
              turns={arena.conversation.turns.slice(0, -1)}
              onClearConversation={arena.conversation.clearConversation}
            />
          </section>
        )}

        {/* Chat Input */}
        <section className="mx-auto max-w-3xl" data-tour="chat-input">
          <ChatInput
            onSend={arena.handleSendMessage}
            isLoading={arena.isProcessing}
            disabled={arena.selectedModels.length === 0}
          />
        </section>

        {/* Debate Section */}
        <DebateSection
          deepDebate={arena.deepDebate}
          currentDebateId={arena.currentDebateId}
          onSaveDebate={arena.handleSaveDebate}
          onShareDebate={() =>
            arena.history.shareResult(arena.currentDebateId!, 'debate')
          }
          onVote={arena.handleDebateVote}
          getVote={(modelId) =>
            arena.history.getVote(arena.currentDebateId || '', modelId)
          }
          onRate={arena.handleDebateRating}
          getRating={(modelId, round) =>
            arena.debateRatings.getRating(modelId, round)
          }
        />

        {/* Streaming Responses */}
        {!arena.deepMode && (
          <ResponsesSection
            streamingResponses={arena.streamingResponses}
            streamingModels={arena.streaming.streamingModels}
            selectedModels={arena.selectedModels}
            isLoading={arena.streaming.isLoading}
            currentQuery={arena.currentQuery}
            currentCategory={arena.currentCategory}
            currentComparisonId={arena.currentComparisonId}
            historyUser={arena.history.user}
            onCancel={arena.streaming.cancel}
            onReRun={(query, models) => {
              arena.setCurrentComparisonId(null);
              arena.setCurrentQuery(query);
              arena.streaming.startComparison(query, models);
            }}
            onShare={() =>
              arena.history.shareResult(arena.currentComparisonId!, 'comparison')
            }
            onVote={(modelId, type) =>
              arena.handleVote(arena.currentComparisonId!, modelId, type)
            }
            getVote={(modelId) =>
              arena.currentComparisonId
                ? arena.history.getVote(arena.currentComparisonId, modelId)
                : null
            }
            onRegenerate={arena.handleRegenerate}
            onRate={(modelId, rating) =>
              arena.currentComparisonId &&
              arena.ratings.rate(
                arena.currentComparisonId,
                'comparison',
                modelId,
                rating
              )
            }
            getRating={(modelId) =>
              arena.currentComparisonId
                ? arena.ratings.getRating(arena.currentComparisonId, modelId)
                : null
            }
            resetStreaming={arena.streaming.reset}
          />
        )}

        {/* Empty States */}
        <ArenaEmptyState
          deepMode={arena.deepMode}
          hasContent={arena.streamingResponses.length > 0}
          isDebating={arena.deepDebate.isDebating}
          hasFinalAnswer={!!arena.deepDebate.finalAnswer}
          hasRoundResponses={arena.deepDebate.roundResponses.length > 0}
          historyUser={arena.history.user}
          deepModeSettings={arena.deepModeSettings}
        />
      </main>

      <BackgroundEffects />
    </AppLayout>
  );
}

// Default export for React.lazy compatibility
export default ArenaPage;
