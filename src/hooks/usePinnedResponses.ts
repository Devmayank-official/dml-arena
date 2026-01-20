import { useState, useEffect, useCallback } from 'react';

export interface PinnedResponse {
  id: string;
  historyId: string;
  historyType: 'comparison' | 'debate';
  modelId: string;
  query: string;
  response: string;
  pinnedAt: string;
}

const STORAGE_KEY = 'compareai-pinned-responses';

function getStoredPinned(): PinnedResponse[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePinned(pinned: PinnedResponse[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
}

export function usePinnedResponses() {
  const [pinnedResponses, setPinnedResponses] = useState<PinnedResponse[]>(getStoredPinned);

  useEffect(() => {
    setPinnedResponses(getStoredPinned());
  }, []);

  const pinResponse = useCallback((response: Omit<PinnedResponse, 'id' | 'pinnedAt'>) => {
    const newPinned: PinnedResponse = {
      ...response,
      id: crypto.randomUUID(),
      pinnedAt: new Date().toISOString(),
    };
    setPinnedResponses(prev => {
      const updated = [newPinned, ...prev];
      savePinned(updated);
      return updated;
    });
    return newPinned;
  }, []);

  const unpinResponse = useCallback((id: string) => {
    setPinnedResponses(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePinned(updated);
      return updated;
    });
  }, []);

  const isPinned = useCallback((historyId: string, modelId: string) => {
    return pinnedResponses.some(p => p.historyId === historyId && p.modelId === modelId);
  }, [pinnedResponses]);

  const getPinnedId = useCallback((historyId: string, modelId: string) => {
    return pinnedResponses.find(p => p.historyId === historyId && p.modelId === modelId)?.id;
  }, [pinnedResponses]);

  const clearAllPinned = useCallback(() => {
    setPinnedResponses([]);
    savePinned([]);
  }, []);

  return {
    pinnedResponses,
    pinResponse,
    unpinResponse,
    isPinned,
    getPinnedId,
    clearAllPinned,
    pinnedCount: pinnedResponses.length,
  };
}
