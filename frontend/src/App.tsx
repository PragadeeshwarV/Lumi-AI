import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageItem } from './components/chat/MessageItem';
import { MessageComposer } from './components/chat/MessageComposer';
import { WelcomeView } from './components/chat/WelcomeView';
import { VoiceModal } from './components/voice/VoiceModal';
import { DocumentModal } from './components/documents/DocumentModal';
import { AnalysisModal } from './components/analysis/AnalysisModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { api } from './services/api';
import { Conversation, Message, AssistantMode, UserSettings } from './types';
import { AlertTriangle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Assistant Configuration
  const [selectedModel, setSelectedModel] = useState<string>('qwen/qwen3.8-27b');
  const [selectedMode, setSelectedMode] = useState<AssistantMode>('general');
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Modals & UI Controls
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<{ message: string; type: 'warning' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial conversations & system settings
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [convs, s] = await Promise.all([
        api.getConversations(),
        api.getSettings()
      ]);
      setConversations(convs);
      setUserSettings(s);
      if (s.default_model) setSelectedModel(s.default_model);
      if (s.default_mode) setSelectedMode(s.default_mode);

      if (!s.groq_configured) {
        setGlobalBanner({
          type: 'warning',
          message: 'GROQ_API_KEY is not configured in your backend .env file. Real AI responses require an active Groq API key.'
        });
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleRefreshConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const conv = await api.getConversation(id);
      setActiveConversation(conv);
      setSelectedModel(conv.model_name || 'llama-3.3-70b-versatile');
      setSelectedMode(conv.assistant_mode || 'general');
      setMessages(conv.messages || []);
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveConversation(null);
    setMessages([]);
  };

  const handleSendMessage = async (text: string, documentIds: string[] = []) => {
    if (!text.trim() && documentIds.length === 0) return;

    // Optimistic user message
    const tempUserMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // Placeholder assistant message for streaming
    const tempAssistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      await api.streamChat(
        {
          conversation_id: activeConversationId || undefined,
          content: text,
          model_name: selectedModel,
          assistant_mode: selectedMode,
          enable_web_search: webSearchEnabled,
          document_ids: documentIds,
        },
        {
          onToken: (tok) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                last.content += tok;
              }
              return updated;
            });
          },
          onCitations: (citations) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                last.citations = citations;
              }
              return updated;
            });
          },
          onUsage: (usage) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                last.latency_ms = usage.latency_ms;
                last.completion_tokens = usage.completion_tokens;
                last.prompt_tokens = usage.prompt_tokens;
              }
              return updated;
            });
          },
          onDone: async (data) => {
            setIsStreaming(false);
            setAbortController(null);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                last.isStreaming = false;
                last.id = data.message_id;
              }
              return updated;
            });

            if (!activeConversationId && data.conversation_id) {
              setActiveConversationId(data.conversation_id);
            }
            await handleRefreshConversations();
          },
          onError: (errMsg) => {
            setIsStreaming(false);
            setAbortController(null);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === 'assistant') {
                last.isStreaming = false;
                last.content = `⚠️ **Provider Notice:** ${errMsg}`;
              }
              return updated;
            });
          },
        },
        controller.signal
      );
    } catch (err: any) {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
    }
  };

  const handleClearChat = async () => {
    if (activeConversationId) {
      if (window.confirm('Clear all messages in this conversation?')) {
        await api.clearConversationMessages(activeConversationId);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  const handleRegenerateLast = async () => {
    if (messages.length === 0 || isStreaming) return;
    // Find last user prompt
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message
      setMessages((prev) => {
        const withoutLast = [...prev];
        if (withoutLast.length > 0 && withoutLast[withoutLast.length - 1].role === 'assistant') {
          withoutLast.pop();
        }
        return withoutLast;
      });
      await handleSendMessage(lastUserMessage.content);
    }
  };

  const handleEditUserMessage = async (newContent: string) => {
    await handleSendMessage(newContent);
  };

  return (
    <div className="flex h-screen bg-[#FAF9FF] text-[#292638] font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRefreshConversations={handleRefreshConversations}
        onOpenDocuments={() => setDocumentsModalOpen(true)}
        onOpenAnalysis={() => setAnalysisModalOpen(true)}
        onOpenVoice={() => setVoiceModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF9FF]">
        {/* Global Warning Banner */}
        {globalBanner && (
          <div className="bg-[#EDE5FF] border-b border-[#D8C8F5] px-4 py-2 text-xs text-[#49356F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#7654B8] flex-shrink-0" />
              <span>{globalBanner.message}</span>
            </div>
            <button
              onClick={() => setGlobalBanner(null)}
              className="text-[#777386] hover:text-[#292638] text-[11px] font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chat Header */}
        <ChatHeader
          conversationId={activeConversationId}
          title={activeConversation?.title || 'New Chat'}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
          onClearChat={handleClearChat}
          allowedModels={userSettings?.allowed_models || [
            'qwen/qwen3.8-27b',
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b',
            'allam-2-7b'
          ]}
        />

        {/* Messages or Welcome View */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeView
              onSelectPrompt={(prompt, mode) => {
                if (mode) setSelectedMode(mode);
                handleSendMessage(prompt);
              }}
            />
          ) : (
            <div className="py-4 space-y-1">
              {messages.map((msg, idx) => (
                <MessageItem
                  key={msg.id || idx}
                  message={msg}
                  onRegenerate={handleRegenerateLast}
                  onEdit={handleEditUserMessage}
                  isLastAssistant={idx === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Composer */}
        <MessageComposer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          webSearchEnabled={webSearchEnabled}
          conversationId={activeConversationId}
        />
      </div>

      {/* Voice Modal */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        activeConversationId={activeConversationId}
        selectedModel={selectedModel}
        selectedMode={selectedMode}
        onNewMessageAdded={handleRefreshConversations}
      />

      {/* Documents Modal */}
      <DocumentModal
        isOpen={documentsModalOpen}
        onClose={() => setDocumentsModalOpen(false)}
        onDocumentUploaded={handleRefreshConversations}
      />

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSettingsUpdated={loadInitialData}
      />
    </div>
  );
};

export default App;
