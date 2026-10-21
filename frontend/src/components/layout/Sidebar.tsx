import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  Edit2,
  Download,
  Settings,
  FileText,
  BarChart2,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { Conversation, AssistantMode } from '../../types';
import { api } from '../../services/api';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRefreshConversations: () => void;
  onOpenDocuments: () => void;
  onOpenAnalysis: () => void;
  onOpenVoice: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRefreshConversations,
  onOpenDocuments,
  onOpenAnalysis,
  onOpenVoice,
  onOpenSettings,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.is_pinned);
  const others = filtered.filter((c) => !c.is_pinned);

  const handleStartRename = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      await api.updateConversation(id, { title: editingTitle.trim() });
      setEditingId(null);
      onRefreshConversations();
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    await api.updateConversation(c.id, { is_pinned: !c.is_pinned });
    onRefreshConversations();
  };

  const handleToggleFavourite = async (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    await api.updateConversation(c.id, { is_favourite: !c.is_favourite });
    onRefreshConversations();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await api.deleteConversation(id);
      onRefreshConversations();
      if (activeConversationId === id) {
        onNewChat();
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="w-16 h-full bg-[#FAF9FF] border-r border-[#E9E4F0] flex flex-col items-center py-4 justify-between transition-all duration-200">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onToggleOpen}
            className="p-2 text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={onNewChat}
            className="p-3 bg-[#7654B8] hover:bg-[#6543A0] text-white rounded-xl shadow-subtle transition-colors"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenVoice}
            className="p-2 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Voice Assistant"
          >
            <Mic size={20} />
          </button>
          <button
            onClick={onOpenDocuments}
            className="p-2 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Knowledge & Documents"
          >
            <FileText size={20} />
          </button>
          <button
            onClick={onOpenAnalysis}
            className="p-2 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Data Analysis Workspace"
          >
            <BarChart2 size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 h-full bg-[#FAF9FF] border-r border-[#E9E4F0] flex flex-col justify-between select-none transition-all duration-200">
      {/* Top Header */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EDE5FF] flex items-center justify-center text-[#7654B8]">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#292638]">Lumi AI</span>
              <span className="block text-[10px] text-[#777386] uppercase tracking-wider font-medium">Assistant</span>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="p-1.5 text-[#777386] hover:text-[#292638] hover:bg-[#EDE5FF] rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#7654B8] hover:bg-[#6543A0] text-white text-sm font-medium rounded-xl shadow-subtle transition-all active:scale-[0.99]"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-[#777386]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E9E4F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#292638] placeholder-[#777386] focus:outline-none focus:border-[#7654B8] transition-colors"
          />
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        {/* Pinned section */}
        {pinned.length > 0 && (
          <div>
            <div className="px-2 pb-1 text-[11px] font-semibold text-[#777386] uppercase tracking-wider flex items-center gap-1.5">
              <Pin size={12} />
              <span>Pinned</span>
            </div>
            <div className="space-y-1">
              {pinned.map((c) => renderConversationItem(c))}
            </div>
          </div>
        )}

        {/* Recent / All section */}
        <div>
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#777386] uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={12} />
            <span>Recent Conversations</span>
          </div>
          {others.length === 0 && pinned.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#777386]">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            <div className="space-y-1">
              {others.map((c) => renderConversationItem(c))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav Features */}
      <div className="p-3 border-t border-[#E9E4F0] bg-[#FAF9FF] space-y-1">
        <button
          onClick={onOpenVoice}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#292638] hover:bg-[#EDE5FF] hover:text-[#7654B8] rounded-xl transition-colors"
        >
          <Mic size={16} className="text-[#7654B8]" />
          <span>Voice Mode</span>
        </button>

        <button
          onClick={onOpenDocuments}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#292638] hover:bg-[#EDE5FF] hover:text-[#7654B8] rounded-xl transition-colors"
        >
          <FileText size={16} className="text-[#7654B8]" />
          <span>Knowledge & Documents</span>
        </button>

        <button
          onClick={onOpenAnalysis}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#292638] hover:bg-[#EDE5FF] hover:text-[#7654B8] rounded-xl transition-colors"
        >
          <BarChart2 size={16} className="text-[#7654B8]" />
          <span>Data Analysis Workspace</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#292638] hover:bg-[#EDE5FF] hover:text-[#7654B8] rounded-xl transition-colors"
        >
          <Settings size={16} className="text-[#7654B8]" />
          <span>Settings & Memory</span>
        </button>
      </div>
    </aside>
  );

  function renderConversationItem(c: Conversation) {
    const isActive = activeConversationId === c.id;

    if (editingId === c.id) {
      return (
        <form
          key={c.id}
          onSubmit={(e) => handleSaveRename(e, c.id)}
          className="px-2 py-1"
        >
          <input
            type="text"
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={(e) => handleSaveRename(e, c.id)}
            className="w-full text-xs px-2 py-1 bg-white border border-[#7654B8] rounded-lg focus:outline-none"
          />
        </form>
      );
    }

    return (
      <div
        key={c.id}
        onClick={() => onSelectConversation(c.id)}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-[#EDE5FF] text-[#49356F] font-medium'
            : 'text-[#292638] hover:bg-[#F5F1FF]'
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {c.is_favourite ? (
            <Star size={13} className="text-[#7654B8] fill-[#7654B8] flex-shrink-0" />
          ) : (
            <Bot size={13} className="text-[#777386] flex-shrink-0" />
          )}
          <span className="truncate">{c.title}</span>
        </div>

        {/* Action icons on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => handleTogglePin(e, c)}
            className={`p-1 rounded hover:bg-[#D8C8F5] ${c.is_pinned ? 'text-[#7654B8]' : 'text-[#777386]'}`}
            title={c.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={12} />
          </button>
          <button
            onClick={(e) => handleToggleFavourite(e, c)}
            className={`p-1 rounded hover:bg-[#D8C8F5] ${c.is_favourite ? 'text-[#7654B8]' : 'text-[#777386]'}`}
            title="Favourite"
          >
            <Star size={12} />
          </button>
          <button
            onClick={(e) => handleStartRename(e, c)}
            className="p-1 rounded hover:bg-[#D8C8F5] text-[#777386]"
            title="Rename"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => handleDelete(e, c.id)}
            className="p-1 rounded hover:bg-[#EF4444] hover:text-white text-[#777386]"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }
};
