import React, { useState } from 'react';
import {
  Globe,
  SlidersHorizontal,
  Download,
  Trash2,
  ChevronDown,
  Sparkles,
  Code2,
  PenTool,
  GraduationCap,
  FileSearch,
  BarChart,
  Palette,
  Terminal
} from 'lucide-react';
import { AssistantMode } from '../../types';
import { api } from '../../services/api';

interface ChatHeaderProps {
  conversationId: string | null;
  title: string;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedMode: AssistantMode;
  onSelectMode: (mode: AssistantMode) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onClearChat: () => void;
  allowedModels: string[];
}

const MODES: { id: AssistantMode; label: string; icon: any }[] = [
  { id: 'general', label: 'General', icon: Sparkles },
  { id: 'coding', label: 'Coding', icon: Code2 },
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'research', label: 'Research', icon: FileSearch },
  { id: 'data_analysis', label: 'Data Analysis', icon: BarChart },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'custom', label: 'Custom', icon: Terminal },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationId,
  title,
  selectedModel,
  onSelectModel,
  selectedMode,
  onSelectMode,
  webSearchEnabled,
  onToggleWebSearch,
  onClearChat,
  allowedModels,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  const CurrentModeIcon = MODES.find((m) => m.id === selectedMode)?.icon || Sparkles;

  const handleExportMarkdown = () => {
    if (conversationId) {
      window.open(api.exportMarkdownUrl(conversationId), '_blank');
    }
  };

  const handleExportJson = () => {
    if (conversationId) {
      window.open(api.exportJsonUrl(conversationId), '_blank');
    }
  };

  return (
    <header className="h-16 px-6 bg-[#FFFFFF] border-b border-[#E9E4F0] flex items-center justify-between z-10">
      {/* Title & Mode */}
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-sm sm:text-base text-[#292638] tracking-tight truncate max-w-xs sm:max-w-md">
          {title || 'New Chat'}
        </h1>

        {/* Mode Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#EDE5FF] text-[#49356F] rounded-full hover:bg-[#D8C8F5] transition-colors"
          >
            <CurrentModeIcon size={12} className="text-[#7654B8]" />
            <span className="capitalize">{selectedMode.replace('_', ' ')}</span>
            <ChevronDown size={12} />
          </button>

          {modeDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#E9E4F0] rounded-xl shadow-dropdown py-1 z-20">
              <div className="px-3 py-1 text-[10px] font-semibold text-[#777386] uppercase tracking-wider">
                Assistant Mode
              </div>
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMode(m.id);
                      setModeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left hover:bg-[#F5F1FF] transition-colors ${
                      selectedMode === m.id ? 'text-[#7654B8] font-medium bg-[#EDE5FF]' : 'text-[#292638]'
                    }`}
                  >
                    <Icon size={14} className={selectedMode === m.id ? 'text-[#7654B8]' : 'text-[#777386]'} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Model Selector & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Web search toggle pill */}
        <button
          onClick={onToggleWebSearch}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors ${
            webSearchEnabled
              ? 'bg-[#EDE5FF] border-[#7654B8] text-[#49356F] font-medium'
              : 'border-[#E9E4F0] text-[#777386] hover:bg-[#F5F1FF]'
          }`}
          title={webSearchEnabled ? 'Web search enabled' : 'Click to enable web search'}
        >
          <Globe size={13} className={webSearchEnabled ? 'text-[#7654B8]' : 'text-[#777386]'} />
          <span className="hidden sm:inline">Web Search</span>
        </button>

        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#292638] bg-[#FAF9FF] border border-[#E9E4F0] rounded-lg hover:border-[#7654B8] transition-colors"
          >
            <span>{selectedModel}</span>
            <ChevronDown size={12} className="text-[#777386]" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E9E4F0] rounded-xl shadow-dropdown py-1 z-20">
              <div className="px-3 py-1 text-[10px] font-semibold text-[#777386] uppercase tracking-wider">
                Groq AI Model
              </div>
              {allowedModels.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onSelectModel(m);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#F5F1FF] transition-colors ${
                    selectedModel === m ? 'text-[#7654B8] font-medium bg-[#EDE5FF]' : 'text-[#292638]'
                  }`}
                >
                  <span className="truncate">{m}</span>
                  {selectedModel === m && <Sparkles size={12} className="text-[#7654B8] ml-2 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Dropdown / Buttons */}
        {conversationId && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportMarkdown}
              className="p-1.5 text-[#777386] hover:text-[#7654B8] hover:bg-[#EDE5FF] rounded-lg transition-colors"
              title="Export as Markdown"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClearChat}
              className="p-1.5 text-[#777386] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
              title="Clear conversation messages"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
