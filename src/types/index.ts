// Shared types used across the application

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  isStreaming?: boolean;
}

export interface ComparisonHistory {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
}

export interface DebateHistory {
  id: string;
  query: string;
  models: string[];
  settings: any;
  round_responses: any[];
  final_answer: string | null;
  total_rounds: number;
  elapsed_time: number;
  created_at: string;
}

export interface Vote {
  id: string;
  history_id: string;
  history_type: 'comparison' | 'debate';
  model_id: string;
  vote_type: 'up' | 'down';
}

export interface QueryHistory {
  id: string | null;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

// Conversation threading types
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

export interface ConversationTurn {
  id: string;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  turns: ConversationTurn[];
  selectedModels: string[];
  createdAt: Date;
  updatedAt: Date;
}
