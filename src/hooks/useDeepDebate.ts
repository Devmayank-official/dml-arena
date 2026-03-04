import { useState, useRef, useCallback } from 'react';
import type { DeepModeSettings } from '@/components/DeepModeToggle';

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

interface Status {
  phase: string;
  round?: number;
  message: string;
}

export function useDeepDebate() {
  const [isDebating, setIsDebating] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [roundResponses, setRoundResponses] = useState<RoundResponse[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<FinalAnswer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [totalRounds, setTotalRounds] = useState(3);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [lastSettings, setLastSettings] = useState<DeepModeSettings | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startDebate = useCallback(async (message: string, models: string[], settings: DeepModeSettings) => {
    setTotalRounds(settings.rounds);
    setLastQuery(message);
    setLastSettings(settings);
    setIsDebating(true);
    setStatus(null);
    setRoundResponses([]);
    setFinalAnswer(null);
    setError(null);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dml-debate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            message, 
            models, 
            numRounds: settings.rounds,
            style: settings.style,
            responseLength: settings.responseLength,
            focusArea: settings.focusArea,
            persona: settings.persona,
            customPersona: settings.customPersona,
            synthesizer: settings.synthesizer,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];
            
            if (dataLine?.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.slice(6));
                
                switch (eventType) {
                  case 'status':
                    setStatus(data);
                    break;
                  case 'round_response':
                    setRoundResponses(prev => [...prev, data]);
                    break;
                  case 'final_answer':
                    setFinalAnswer(data);
                    break;
                  case 'error':
                    setError(data.message);
                    break;
                  case 'complete':
                    // Debate finished
                    break;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Deep debate error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsDebating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsDebating(false);
    setStatus(null);
    setRoundResponses([]);
    setFinalAnswer(null);
    setError(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const getDebateTranscript = useCallback(() => {
    if (!finalAnswer) return '';
    
    let transcript = `# Deep Debate Results\n\n`;
    transcript += `**Query:** ${lastQuery}\n\n`;
    transcript += `**Time:** ${Math.floor(elapsedTime / 1000)}s\n`;
    transcript += `**Rounds:** ${totalRounds}\n`;
    if (lastSettings) {
      transcript += `**Style:** ${lastSettings.style}\n`;
      transcript += `**Response Length:** ${lastSettings.responseLength}\n`;
    }
    transcript += `**Models:** ${finalAnswer.participants.join(', ')}\n`;
    transcript += `**Synthesizer:** ${finalAnswer.synthesizer}\n\n`;
    transcript += `---\n\n`;
    
    // Group responses by round
    for (let round = 1; round <= totalRounds; round++) {
      const roundResps = roundResponses.filter(r => r.round === round);
      if (roundResps.length > 0) {
        transcript += `## Round ${round}\n\n`;
        for (const resp of roundResps) {
          transcript += `### ${resp.model}\n${resp.response}\n\n`;
        }
      }
    }
    
    transcript += `---\n\n## Final Answer (Synthesized by ${finalAnswer.synthesizer})\n\n${finalAnswer.answer}`;
    
    return transcript;
  }, [finalAnswer, lastQuery, elapsedTime, totalRounds, roundResponses, lastSettings]);

  return {
    isDebating,
    status,
    roundResponses,
    finalAnswer,
    elapsedTime,
    error,
    totalRounds,
    startDebate,
    reset,
    getDebateTranscript,
  };
}
