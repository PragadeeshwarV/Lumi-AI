import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Edit2
} from 'lucide-react';
import { Message, Citation } from '../../types';
import { speechManager } from '../../utils/speech';

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  isLastAssistant?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onRegenerate,
  onEdit,
  isLastAssistant,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Parse citations from JSON if needed
  let citations: Citation[] = message.citations || [];
  if (!citations.length && message.citations_json) {
    try {
      citations = JSON.parse(message.citations_json);
    } catch (e) {
      citations = [];
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechManager.stopSpeaking();
      setIsSpeaking(false);
    } else {
      speechManager.speak(message.content, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className={`py-4 px-4 sm:px-6 transition-colors ${isUser ? 'bg-transparent' : 'bg-[#FFFFFF] border-y border-[#E9E4F0]'}`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-[#EDE5FF] text-[#7654B8] flex items-center justify-center font-medium text-xs shadow-subtle">
              <UserIcon size={16} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-[#7654B8] text-white flex items-center justify-center shadow-subtle">
              <Sparkles size={16} />
            </div>
          )}
        </div>

        {/* Content & Actions */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Role & Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-[#777386]">
            <span className="font-semibold text-[#292638]">
              {isUser ? 'You' : 'Lumi AI'}
            </span>
            <div className="flex items-center gap-2">
              {message.latency_ms && (
                <span className="flex items-center gap-1 text-[10px] text-[#777386]">
                  <Clock size={10} />
                  <span>{Math.round(message.latency_ms)}ms</span>
                </span>
              )}
              {message.completion_tokens && (
                <span className="flex items-center gap-1 text-[10px] text-[#777386]">
                  <Cpu size={10} />
                  <span>{message.completion_tokens} tokens</span>
                </span>
              )}
              <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* User message edit mode */}
          {isUser && isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#7654B8] rounded-xl focus:outline-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#7654B8] text-white text-xs font-medium rounded-lg hover:bg-[#6543A0]"
                >
                  Save & Resubmit
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-[#EDE5FF] text-[#49356F] text-xs font-medium rounded-lg hover:bg-[#D8C8F5]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Markdown body */
            <div className="text-sm leading-relaxed text-[#292638] prose prose-purple max-w-none break-words">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeText = String(children).replace(/\n$/, '');
                      if (!inline) {
                        return (
                          <div className="relative group my-3">
                            <div className="flex items-center justify-between px-3 py-1 bg-[#49356F] text-[#EDE5FF] text-[10px] rounded-t-lg font-mono">
                              <span>{match ? match[1] : 'code'}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(codeText)}
                                className="flex items-center gap-1 hover:text-white"
                                title="Copy code"
                              >
                                <Copy size={12} />
                                <span>Copy</span>
                              </button>
                            </div>
                            <pre className="!mt-0 !rounded-t-none">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Citations Accordion */}
          {citations.length > 0 && (
            <div className="mt-3 border border-[#E9E4F0] rounded-xl bg-[#FAF9FF] overflow-hidden text-xs">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="w-full flex items-center justify-between px-3 py-2 text-[#49356F] font-medium hover:bg-[#EDE5FF] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#7654B8]" />
                  <span>{citations.length} Grounded Source{citations.length > 1 ? 's' : ''} Cited</span>
                </div>
                {showCitations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showCitations && (
                <div className="p-3 border-t border-[#E9E4F0] space-y-2 bg-white">
                  {citations.map((c, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#FAF9FF] border border-[#E9E4F0]">
                      <div className="flex items-center justify-between font-semibold text-[#7654B8] text-[11px] mb-1">
                        <span>[{idx + 1}] {c.source}</span>
                        {c.relevance_score && (
                          <span className="text-[10px] text-[#777386]">Score: {c.relevance_score}</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#777386] leading-snug">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 pt-1 text-[#777386]">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
              title="Copy text"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>

            {!isUser && (
              <>
                <button
                  onClick={handleToggleSpeak}
                  className={`p-1.5 hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors ${
                    isSpeaking ? 'text-[#7654B8] bg-[#EDE5FF]' : ''
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                {isLastAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </>
            )}

            {isUser && onEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
                title="Edit message"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
