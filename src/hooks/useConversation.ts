import { useState, useCallback } from 'react';
import type { ConversationTurn, ModelResponse } from '@/types';

interface UseConversationReturn {
  turns: ConversationTurn[];
  addTurn: (query: string, responses?: ModelResponse[]) => string;
  updateTurn: (turnId: string, responses: ModelResponse[]) => void;
  clearConversation: () => void;
  getContextMessages: () => Array<{ role: 'user' | 'assistant'; content: string }>;
  currentTurnId: string | null;
  setCurrentTurnId: (id: string | null) => void;
}

export function useConversation(): UseConversationReturn {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);

  const addTurn = useCallback((query: string, responses: ModelResponse[] = []): string => {
    const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    const newTurn: ConversationTurn = {
      id: turnId,
      query,
      responses,
      timestamp: new Date(),
    };

    setTurns(prev => [...prev, newTurn]);
    setCurrentTurnId(turnId);
    
    return turnId;
  }, []);

  const updateTurn = useCallback((turnId: string, responses: ModelResponse[]) => {
    setTurns(prev => 
      prev.map(turn => 
        turn.id === turnId 
          ? { ...turn, responses } 
          : turn
      )
    );
  }, []);

  const clearConversation = useCallback(() => {
    setTurns([]);
    setCurrentTurnId(null);
  }, []);

  // Build context messages for multi-turn conversation
  const getContextMessages = useCallback(() => {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    for (const turn of turns) {
      // Add user message
      messages.push({
        role: 'user',
        content: turn.query,
      });
      
      // Add best/first successful AI response as assistant context
      const successfulResponse = turn.responses.find(r => !r.error && r.response);
      if (successfulResponse) {
        messages.push({
          role: 'assistant',
          content: successfulResponse.response,
        });
      }
    }
    
    return messages;
  }, [turns]);

  return {
    turns,
    addTurn,
    updateTurn,
    clearConversation,
    getContextMessages,
    currentTurnId,
    setCurrentTurnId,
  };
}
