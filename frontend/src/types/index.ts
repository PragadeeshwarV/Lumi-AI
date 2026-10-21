export type AssistantMode =
  | 'general'
  | 'coding'
  | 'writing'
  | 'learning'
  | 'research'
  | 'data_analysis'
  | 'creative'
  | 'custom';

export interface Citation {
  source: string;
  content: string;
  relevance_score?: number;
  chunk_id?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  latency_ms?: number;
  citations_json?: string;
  citations?: Citation[];
  created_at: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  assistant_mode: AssistantMode;
  model_name: string;
  system_prompt?: string;
  is_pinned: boolean;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_preview?: string;
  messages?: Message[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  created_at: string;
  conversation_id?: string;
}

export interface ColumnProfile {
  name: string;
  dtype: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    std?: number;
    median?: number;
    top_categories?: Record<string, number>;
  };
}

export interface DatasetProfile {
  filename: string;
  total_rows: number;
  total_columns: number;
  duplicate_rows: number;
  columns: ColumnProfile[];
  head_rows: Record<string, any>[];
}

export interface UserMemory {
  id: string;
  key: string;
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  theme: string;
  default_model: string;
  default_mode: AssistantMode;
  assistant_instructions: string;
  speech_voice: string;
  speech_rate: number;
  allowed_models: string[];
  groq_configured: boolean;
  web_search_configured: boolean;
  embedding_provider: string;
}
