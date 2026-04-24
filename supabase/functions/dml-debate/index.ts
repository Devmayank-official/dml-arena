import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// AI Gateway endpoint (OpenAI-compatible). Configure via AI_GATEWAY_URL secret to override.
const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";

// Input validation limits
const MAX_MESSAGE_LENGTH = 10000;
const MAX_MODELS_COUNT = 6;
const MAX_CUSTOM_PERSONA_LENGTH = 1000;

const DEBATE_MODELS = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
];

interface DebateRound {
  round: number;
  responses: { model: string; response: string }[];
}

type DebateStyle = 'collaborative' | 'competitive' | 'analytical' | 'socratic' | 'devils_advocate' | 'consensus';
type ResponseLength = 'concise' | 'balanced' | 'detailed' | 'more_detailed';
type FocusArea = 'balanced' | 'technical' | 'creative' | 'practical' | 'theoretical';
type ExpertPersona = 'none' | 'scientist' | 'engineer' | 'philosopher' | 'business' | 'educator' | 'critic' | 'custom';

function getStylePrompt(style: DebateStyle): string {
  switch (style) {
    case 'collaborative':
      return 'You are participating in a collaborative discussion. Build on others\' ideas, acknowledge good points, and work together to find the best solution.';
    case 'competitive':
      return 'You are in a competitive debate. Challenge weak arguments, point out flaws in reasoning, and defend your position strongly while remaining professional.';
    case 'analytical':
      return 'You are conducting an analytical discussion. Focus on facts, data, and logical reasoning. Evaluate claims critically and support your arguments with evidence.';
    case 'socratic':
      return 'You are engaging in Socratic dialogue. Ask probing questions to uncover assumptions, challenge premises, and guide others toward deeper understanding through inquiry rather than direct answers.';
    case 'devils_advocate':
      return 'You are playing devil\'s advocate. Argue against the popular or obvious position, challenge conventional wisdom, and explore counterarguments even if you don\'t personally believe them. Stress-test ideas rigorously.';
    case 'consensus':
      return 'You are focused on consensus-building. Identify areas of agreement, bridge differences between perspectives, highlight shared values, and work toward synthesizing a position everyone can accept.';
  }
}

function getLengthInstruction(length: ResponseLength): string {
  switch (length) {
    case 'concise':
      return 'Keep your response brief and focused - aim for 2-3 paragraphs maximum.';
    case 'balanced':
      return 'Provide a moderately detailed response with key points well explained.';
    case 'detailed':
      return 'Provide a comprehensive, in-depth response covering all relevant aspects.';
    case 'more_detailed':
      return 'Provide an exhaustive, highly detailed response. Cover every relevant aspect thoroughly with examples, explanations, and nuanced analysis. Leave no important point unexplored.';
  }
}

function getFocusPrompt(focus: FocusArea): string {
  switch (focus) {
    case 'balanced':
      return '';
    case 'technical':
      return 'Focus on technical details, implementation specifics, code examples, and precise terminology.';
    case 'creative':
      return 'Emphasize creative and innovative approaches, novel solutions, and outside-the-box thinking.';
    case 'practical':
      return 'Prioritize real-world applicability, actionable advice, and pragmatic solutions that can be implemented immediately.';
    case 'theoretical':
      return 'Explore underlying concepts, principles, frameworks, and theoretical foundations in depth.';
  }
}

function getPersonaPrompt(persona: ExpertPersona, customPersona?: string): string {
  switch (persona) {
    case 'none':
      return '';
    case 'scientist':
      return 'You are a research scientist. Ground your arguments in empirical evidence, cite methodologies, consider reproducibility, and maintain rigorous scientific standards. Question assumptions and demand evidence.';
    case 'engineer':
      return 'You are a senior software engineer. Focus on practical implementation, scalability, maintainability, performance trade-offs, and real-world constraints. Provide concrete solutions and consider edge cases.';
    case 'philosopher':
      return 'You are a philosopher. Analyze concepts deeply, consider ethical implications, explore logical foundations, examine underlying assumptions, and consider multiple philosophical frameworks.';
    case 'business':
      return 'You are a business strategist. Consider ROI, market dynamics, competitive advantages, resource allocation, risk assessment, and strategic positioning. Frame answers in terms of business value and outcomes.';
    case 'educator':
      return 'You are an expert educator. Explain concepts progressively, use analogies and examples, anticipate misconceptions, build understanding step-by-step, and ensure clarity without oversimplification.';
    case 'critic':
      return 'You are a critical analyst. Systematically evaluate claims, identify weaknesses, assess risks, challenge assumptions, and provide balanced but skeptical analysis. Point out what could go wrong.';
    case 'custom':
      return customPersona || '';
  }
}

async function queryModel(model: string, messages: { role: string; content: string }[], apiKey: string): Promise<string> {
  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from ${model}:`, response.status, errorText);
      return `[Error: ${response.status}]`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '[No response]';
  } catch (error) {
    console.error(`Error querying ${model}:`, error);
    return `[Error: ${error instanceof Error ? error.message : 'Unknown'}]`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ========== AUTHENTICATION ==========
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          sendEvent('error', { message: 'Authentication required' });
          controller.close();
          return;
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });

        // Verify JWT and get user
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claimsData?.claims) {
          sendEvent('error', { message: 'Invalid authentication token' });
          controller.close();
          return;
        }

        const userId = claimsData.claims.sub as string;

        // ========== SERVER-SIDE PRO PLAN ENFORCEMENT ==========
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        
        const { data: subscription, error: subError } = await adminClient
          .from('subscriptions')
          .select('plan')
          .eq('user_id', userId)
          .single();

        if (subError || !subscription) {
          console.error('Error fetching subscription:', subError);
          sendEvent('error', { message: 'Subscription not found' });
          controller.close();
          return;
        }

        // Deep Mode requires Pro subscription
        if (subscription.plan !== 'pro') {
          sendEvent('error', { message: 'Deep Mode requires Pro subscription. Upgrade to Pro to access this feature.' });
          controller.close();
          return;
        }

        // ========== INPUT VALIDATION ==========
        const { 
          message, 
          models: selectedModels, 
          numRounds = 3,
          style = 'collaborative',
          responseLength = 'balanced',
          focusArea = 'balanced',
          persona = 'none',
          customPersona,
          synthesizer = 'google/gemini-2.5-pro'
        } = await req.json();
        
        // Validate message
        if (!message || typeof message !== 'string') {
          sendEvent('error', { message: 'Message is required' });
          controller.close();
          return;
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length === 0 || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
          sendEvent('error', { message: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` });
          controller.close();
          return;
        }

        // Validate custom persona
        if (customPersona && typeof customPersona === 'string' && customPersona.length > MAX_CUSTOM_PERSONA_LENGTH) {
          sendEvent('error', { message: `Custom persona too long (max ${MAX_CUSTOM_PERSONA_LENGTH} characters)` });
          controller.close();
          return;
        }

        // Validate models
        if (Array.isArray(selectedModels) && selectedModels.length > MAX_MODELS_COUNT) {
          sendEvent('error', { message: `Maximum ${MAX_MODELS_COUNT} models allowed for debates` });
          controller.close();
          return;
        }

        console.log(`User ${userId} (pro) starting Deep Mode debate`);

        const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
        if (!AI_GATEWAY_API_KEY) {
          sendEvent('error', { message: 'AI service not configured' });
          controller.close();
          return;
        }
        
        const modelsToUse = selectedModels?.length > 0 
          ? selectedModels.filter((m: string) => DEBATE_MODELS.includes(m))
          : DEBATE_MODELS;

        if (modelsToUse.length < 2) {
          sendEvent('error', { message: 'At least 2 models required for debate' });
          controller.close();
          return;
        }

        const NUM_ROUNDS = Math.min(10, Math.max(2, numRounds));
        const stylePrompt = getStylePrompt(style as DebateStyle);
        const lengthInstruction = getLengthInstruction(responseLength as ResponseLength);
        const focusPrompt = getFocusPrompt(focusArea as FocusArea);
        const personaPrompt = getPersonaPrompt(persona as ExpertPersona, customPersona);
        
        sendEvent('status', { 
          phase: 'starting', 
          message: `Initiating ${NUM_ROUNDS}-round ${style} debate...` 
        });

        const debateHistory: DebateRound[] = [];

        // ROUND 1: Initial Answers
        sendEvent('status', { phase: 'round', round: 1, message: 'Round 1: Initial perspectives...' });
        
        const round1Promises = modelsToUse.map(async (model: string) => {
          const systemParts = [personaPrompt, stylePrompt, focusPrompt, 'Provide your best initial answer to the question.', lengthInstruction].filter(Boolean);
          const response = await queryModel(model, [
            { role: 'system', content: systemParts.join(' ') },
            { role: 'user', content: message }
          ], AI_GATEWAY_API_KEY);
          
          sendEvent('round_response', { round: 1, model, response });
          return { model, response };
        });

        const round1Results = await Promise.all(round1Promises);
        debateHistory.push({ round: 1, responses: round1Results });

        // Dynamic rounds (2 to NUM_ROUNDS)
        let previousRoundResults = round1Results;
        
        for (let round = 2; round <= NUM_ROUNDS; round++) {
          const isLastRound = round === NUM_ROUNDS;
          const roundLabel = isLastRound ? 'Finding consensus' : `Round ${round}: Refinement`;
          
          sendEvent('status', { phase: 'round', round, message: `${roundLabel}...` });

          const prevAnswers = previousRoundResults.map(r => `${r.model}: ${r.response}`).join('\n\n');

          const roundPromises = modelsToUse.map(async (model: string) => {
            const myPrevAnswer = previousRoundResults.find(r => r.model === model)?.response || '';
            
            let systemPrompt: string;
            let userPrompt: string;
            const baseParts = [personaPrompt, stylePrompt, focusPrompt].filter(Boolean);
            
            if (isLastRound) {
              systemPrompt = [...baseParts, 'This is the final round. Identify the strongest arguments and provide your most refined position.', lengthInstruction].join(' ');
              userPrompt = `Original question: ${message}\n\nPrevious round answers:\n${prevAnswers}\n\nProvide your final, most refined answer incorporating the collective wisdom.`;
            } else {
              systemPrompt = [...baseParts, 'Review other models\' answers, identify strengths and weaknesses, and refine your answer.', lengthInstruction].join(' ');
              userPrompt = `Original question: ${message}\n\nYour previous answer: ${myPrevAnswer}\n\nOther perspectives:\n${prevAnswers}\n\nProvide your refined answer.`;
            }
            
            const response = await queryModel(model, [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ], AI_GATEWAY_API_KEY);
            
            sendEvent('round_response', { round, model, response });
            return { model, response };
          });

          const roundResults = await Promise.all(roundPromises);
          debateHistory.push({ round, responses: roundResults });
          previousRoundResults = roundResults;
        }

        // FINAL SYNTHESIS
        sendEvent('status', { phase: 'synthesis', message: `Synthesizing with ${synthesizer}...` });

        const allDebateContent = debateHistory.map(round => 
          `=== ROUND ${round.round} ===\n${round.responses.map(r => `${r.model}: ${r.response}`).join('\n\n')}`
        ).join('\n\n');

        const synthesisInstruction = responseLength === 'concise' 
          ? 'Provide a focused, concise synthesis.'
          : responseLength === 'more_detailed' 
            ? 'Provide an exhaustive, highly detailed synthesis covering every important point, nuance, and insight from the debate.'
            : responseLength === 'detailed' 
              ? 'Provide a comprehensive, detailed synthesis covering all important points.'
              : 'Provide a well-balanced synthesis with appropriate detail.';

        const finalAnswer = await queryModel(synthesizer, [
          { role: 'system', content: `You are a master synthesizer. You have witnessed a ${style} debate between AI models. Your task is to create the definitive, best possible answer by:
1. Identifying the strongest arguments and insights from all rounds
2. Resolving any contradictions with the most logical conclusion
3. Presenting a comprehensive, well-structured final answer
4. Being clear about which model(s) contributed the key insights

${synthesisInstruction}

Format your response as:
## Best Answer
[The synthesized answer]

## Key Contributors
[Which models provided the most valuable insights and why]` },
          { role: 'user', content: `Original question: ${message}\n\nComplete ${style} debate transcript:\n${allDebateContent}\n\nSynthesize the best possible answer from this debate.` }
        ], AI_GATEWAY_API_KEY);

        sendEvent('final_answer', { 
          answer: finalAnswer,
          synthesizer,
          rounds: debateHistory.length,
          participants: modelsToUse
        });

        sendEvent('complete', { message: 'Deep Debate complete!' });
        
      } catch (error) {
        console.error('Deep debate error:', error);
        sendEvent('error', { message: error instanceof Error ? error.message : 'Unknown error' });
      }
      
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
