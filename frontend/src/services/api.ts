import {
  Conversation,
  Message,
  DocumentItem,
  DatasetProfile,
  UserMemory,
  UserSettings,
  AssistantMode,
  Citation
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiService {
  private token: string | null = null;
  private sessionId: string;

  constructor() {
    this.token = localStorage.getItem('lumi_token');
    let sid = localStorage.getItem('lumi_session_id');
    if (!sid) {
      sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'guest-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('lumi_session_id', sid);
    }
    this.sessionId = sid;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('lumi_token', token);
    } else {
      localStorage.removeItem('lumi_token');
    }
  }

  private getHeaders(custom: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Session-ID': this.sessionId,
      ...custom
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Health
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }

  // Conversations
  async getConversations(searchQuery?: string): Promise<Conversation[]> {
    const endpoint = searchQuery
      ? `${API_BASE}/conversations/?q=${encodeURIComponent(searchQuery)}`
      : `${API_BASE}/conversations/`;
    const res = await fetch(endpoint, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  }

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  }

  async createConversation(data: {
    title?: string;
    assistant_mode?: AssistantMode;
    model_name?: string;
  }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  }

  async updateConversation(
    id: string,
    data: {
      title?: string;
      assistant_mode?: AssistantMode;
      model_name?: string;
      is_pinned?: boolean;
      is_favourite?: boolean;
    }
  ): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  }

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  }

  async clearConversationMessages(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${id}/messages`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear messages');
  }

  exportMarkdownUrl(id: string): string {
    return `${API_BASE}/conversations/${id}/export/markdown`;
  }

  exportJsonUrl(id: string): string {
    return `${API_BASE}/conversations/${id}/export/json`;
  }

  // Streaming Chat
  async streamChat(
    payload: {
      conversation_id?: string;
      content: string;
      model_name?: string;
      assistant_mode?: AssistantMode;
      temperature?: number;
      enable_web_search?: boolean;
      document_ids?: string[];
    },
    callbacks: {
      onInit?: (data: { conversation_id: string; title: string; user_message_id?: string }) => void;
      onToken: (token: string) => void;
      onCitations?: (citations: Citation[]) => void;
      onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; latency_ms: number }) => void;
      onDone: (data: { message_id: string; conversation_id: string; title?: string }) => void;
      onError: (err: string) => void;
    },
    signal?: AbortSignal
  ) {
    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: this.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
        signal
      });

      if (!res.ok) {
        if (res.status === 401 && this.token) {
          this.setToken(null);
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to stream response');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Streaming response body is unavailable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'init') {
                callbacks.onInit?.(data);
              } else if (data.type === 'token') {
                callbacks.onToken(data.content);
              } else if (data.type === 'citations') {
                callbacks.onCitations?.(data.citations);
              } else if (data.type === 'usage') {
                callbacks.onUsage?.(data);
              } else if (data.type === 'done') {
                callbacks.onDone(data);
              } else if (data.type === 'error') {
                callbacks.onError(data.message);
              }
            } catch (err) {
              console.error('Failed to parse SSE line:', jsonStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        callbacks.onError(err.message || 'Stream connection error');
      }
    }
  }

  // Documents & Knowledge
  async uploadDocument(file: File, conversation_id?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (conversation_id) formData.append('conversation_id', conversation_id);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  }

  async getDocuments(conversation_id?: string): Promise<DocumentItem[]> {
    const endpoint = conversation_id
      ? `${API_BASE}/documents/?conversation_id=${encodeURIComponent(conversation_id)}`
      : `${API_BASE}/documents/`;
    const res = await fetch(endpoint, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  }

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete document');
  }

  async queryRag(query: string, top_k: number = 3): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents/query`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, top_k })
    });
    if (!res.ok) throw new Error('Failed to query knowledge base');
    return res.json();
  }

  // CSV Data Analysis
  async getDatasetProfile(document_id: string): Promise<DatasetProfile> {
    const res = await fetch(`${API_BASE}/analysis/${document_id}/profile`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to profile dataset');
    }
    return res.json();
  }

  async executeAggregation(
    document_id: string,
    group_column: string,
    agg_column: string,
    agg_func: string = 'mean'
  ): Promise<any[]> {
    const res = await fetch(`${API_BASE}/analysis/${document_id}/aggregate`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ group_column, agg_column, agg_func })
    });
    if (!res.ok) throw new Error('Failed to execute aggregation');
    return res.json();
  }

  // Memory
  async getMemories(): Promise<UserMemory[]> {
    const res = await fetch(`${API_BASE}/memory/`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  }

  async createMemory(key: string, value: string): Promise<UserMemory> {
    const res = await fetch(`${API_BASE}/memory/`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  }

  async updateMemory(id: string, is_active: boolean): Promise<UserMemory> {
    const res = await fetch(`${API_BASE}/memory/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ is_active })
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  }

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/memory/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings/`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  }

  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings/`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
}

export const api = new ApiService();
