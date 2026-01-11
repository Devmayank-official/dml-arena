import { useState, useCallback, useRef } from 'react';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface StreamingResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  isStreaming: boolean;
}

interface StreamEvent {
  type: 'start' | 'delta' | 'complete' | 'error';
  model: string;
  content?: string;
  duration?: number;
  tokens?: TokenUsage;
  error?: string;
}

export function useStreamingComparison() {
  const [responses, setResponses] = useState<Map<string, StreamingResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [streamingModels, setStreamingModels] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-ai-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message, models, contextMessages }),
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
        console.error('Streaming error:', error);
      }
    } finally {
      setIsLoading(false);
      setStreamingModels([]);
    }
  }, []);

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
