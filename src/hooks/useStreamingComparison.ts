import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useApiKeys, ApiKeyConfig } from '@/components/ApiKeysSettings';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface StreamingResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  isStreaming: boolean;
  apiKeySource?: 'user' | 'system';
}

interface StreamEvent {
  type: 'start' | 'delta' | 'complete' | 'error';
  model: string;
  content?: string;
  duration?: number;
  tokens?: TokenUsage;
  error?: string;
  apiKeySource?: 'user' | 'system';
}

export function useStreamingComparison() {
  const [responses, setResponses] = useState<Map<string, StreamingResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [streamingModels, setStreamingModels] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { apiKeys, isLoaded } = useApiKeys();

  const startComparison = useCallback(async (
    message: string, 
    models: string[],
    contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setStreamingModels(models);
    setResponses(new Map());

    try {
      // Get auth session for tracking
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      
      // Pass user API keys if available (they take priority over system keys)
      const userApiKeys: ApiKeyConfig | undefined = isLoaded && Object.values(apiKeys).some(Boolean) 
        ? apiKeys 
        : undefined;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dml-arena-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            message, 
            models, 
            contextMessages,
            userApiKeys, // User keys take priority on the backend
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start stream');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const event: StreamEvent = JSON.parse(jsonStr);
            handleEvent(event);
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.error('api', 'Streaming error', { error: (error as Error).message });
      }
    } finally {
      setIsLoading(false);
      setStreamingModels([]);
    }
  }, [apiKeys, isLoaded]);

  const handleEvent = useCallback((event: StreamEvent) => {
    setResponses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(event.model) || {
        model: event.model,
        response: '',
        duration: 0,
        isStreaming: false,
      };

      switch (event.type) {
        case 'start':
          newMap.set(event.model, {
            ...current,
            isStreaming: true,
            response: '',
          });
          break;

        case 'delta':
          newMap.set(event.model, {
            ...current,
            isStreaming: true,
            response: current.response + (event.content || ''),
          });
          break;

        case 'complete':
          newMap.set(event.model, {
            model: event.model,
            response: event.content || current.response,
            duration: event.duration || 0,
            tokens: event.tokens,
            isStreaming: false,
            apiKeySource: event.apiKeySource,
          });
          // Remove from streaming models
          setStreamingModels(prev => prev.filter(m => m !== event.model));
          break;

        case 'error':
          newMap.set(event.model, {
            model: event.model,
            response: '',
            error: event.error,
            duration: event.duration || 0,
            isStreaming: false,
          });
          setStreamingModels(prev => prev.filter(m => m !== event.model));
          break;
      }

      return newMap;
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingModels([]);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setResponses(new Map());
  }, [cancel]);

  const getResponsesArray = useCallback(() => {
    return Array.from(responses.values());
  }, [responses]);

  return {
    responses,
    getResponsesArray,
    isLoading,
    streamingModels,
    startComparison,
    cancel,
    reset,
  };
}
