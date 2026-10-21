import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  Globe
} from 'lucide-react';
import { speechManager } from '../../utils/speech';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

interface MessageComposerProps {
  onSendMessage: (content: string, documentIds: string[]) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  webSearchEnabled: boolean;
  conversationId: string | null;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  webSearchEnabled,
  conversationId,
}) => {
  const [content, setContent] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopGeneration();
      return;
    }

    if (!content.trim() && attachedDocs.length === 0) return;

    const docIds = attachedDocs.map((d) => d.id);
    onSendMessage(content.trim(), docIds);
    setContent('');
    setAttachedDocs([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const doc = await api.uploadDocument(file, conversationId || undefined);
        setAttachedDocs((prev) => [...prev, doc]);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleVoice = () => {
    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechManager.startListening({
        onResult: (transcript) => {
          setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  return (
    <div className="p-4 bg-gradient-to-t from-[#FAF9FF] via-[#FAF9FF] to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#FFFFFF] border border-[#E9E4F0] rounded-2xl shadow-card p-3 transition-all focus-within:border-[#7654B8] focus-within:shadow-md">
          {/* Attached Files & Indicators */}
          {(attachedDocs.length > 0 || webSearchEnabled || isUploading) && (
            <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-[#E9E4F0]">
              {webSearchEnabled && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#EDE5FF] text-[#49356F] rounded-lg">
                  <Globe size={11} className="text-[#7654B8]" />
                  <span>Web Search Active</span>
                </span>
              )}

              {attachedDocs.map((doc) => (
                <span
                  key={doc.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-[#FAF9FF] border border-[#E9E4F0] text-[#292638] rounded-lg"
                >
                  <FileText size={12} className="text-[#7654B8]" />
                  <span className="truncate max-w-xs">{doc.filename}</span>
                  <button
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="p-0.5 text-[#777386] hover:text-[#EF4444]"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {isUploading && (
                <span className="text-[11px] text-[#7654B8] animate-pulse">
                  Uploading and indexing document...
                </span>
              )}
            </div>
          )}

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... Speak now..." : "Ask a question, explore an idea, or paste code..."}
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none bg-transparent text-sm text-[#292638] placeholder-[#777386] focus:outline-none max-h-48 overflow-y-auto"
          />

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              {/* File Attachment Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || isUploading}
                className="p-2 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-xl transition-colors disabled:opacity-40"
                title="Attach Document (PDF, DOCX, TXT, MD, CSV, JSON)"
              >
                <Paperclip size={18} />
              </button>

              {/* Voice Input */}
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isStreaming}
                className={`p-2 rounded-xl transition-colors ${
                  isListening
                    ? 'text-red-500 bg-red-50 animate-pulse'
                    : 'text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF]'
                } disabled:opacity-40`}
                title={isListening ? "Stop listening" : "Speak message (Microphone)"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>

            {/* Send or Stop Generation Button */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#777386] hidden sm:inline">
                {isStreaming ? 'Streaming answer...' : 'Shift+Enter for newline'}
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2.5 bg-[#49356F] hover:bg-[#292638] text-white rounded-xl shadow-subtle transition-all active:scale-95"
                  title="Stop generation"
                >
                  <Square size={16} className="fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!content.trim() && attachedDocs.length === 0}
                  className="p-2.5 bg-[#7654B8] hover:bg-[#6543A0] text-white rounded-xl shadow-subtle transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
