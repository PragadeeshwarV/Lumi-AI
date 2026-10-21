import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Cpu,
  Brain,
  Volume2,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { UserSettings, UserMemory } from '../../types';
import { speechManager } from '../../utils/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'voice' | 'memory' | 'system'>('model');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setAvailableVoices(speechManager.getAvailableVoices());
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [s, m] = await Promise.all([api.getSettings(), api.getMemories()]);
      setSettings(s);
      setMemories(m);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await api.updateSettings({
        default_model: settings.default_model,
        default_mode: settings.default_mode,
        assistant_instructions: settings.assistant_instructions,
        speech_voice: settings.speech_voice,
        speech_rate: settings.speech_rate,
      });
      onSettingsUpdated();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    try {
      await api.createMemory(newMemKey.trim(), newMemVal.trim());
      setNewMemKey('');
      setNewMemVal('');
      const updated = await api.getMemories();
      setMemories(updated);
    } catch (err: any) {
      alert(`Error creating memory: ${err.message}`);
    }
  };

  const handleToggleMemory = async (mem: UserMemory) => {
    try {
      await api.updateMemory(mem.id, !mem.is_active);
      const updated = await api.getMemories();
      setMemories(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      const updated = await api.getMemories();
      setMemories(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 bg-[#292638]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#FAF9FF] border border-[#E9E4F0] rounded-3xl shadow-card p-6 flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDE5FF] text-[#7654B8] flex items-center justify-center">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#292638]">Lumi AI Settings & Preferences</h2>
              <p className="text-xs text-[#777386]">Personalize model behavior, system prompts, voice, and memories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777386] hover:text-[#292638] hover:bg-[#EDE5FF] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E9E4F0] pt-2">
          {[
            { id: 'model', label: 'AI Model & Mode', icon: Cpu },
            { id: 'voice', label: 'Voice & Speech', icon: Volume2 },
            { id: 'memory', label: 'Cross-Chat Memory', icon: Brain },
            { id: 'system', label: 'System & Diagnostics', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-[#7654B8] text-[#7654B8]'
                    : 'border-transparent text-[#777386] hover:text-[#292638]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#292638] mb-1">
                  Default AI Model
                </label>
                <select
                  value={settings.default_model}
                  onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E9E4F0] rounded-xl focus:outline-none focus:border-[#7654B8]"
                >
                  {settings.allowed_models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#777386] mt-1">
                  Provider: Groq High-Speed Inference Engine
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292638] mb-1">
                  Custom System Instructions
                </label>
                <textarea
                  value={settings.assistant_instructions}
                  onChange={(e) => setSettings({ ...settings, assistant_instructions: e.target.value })}
                  placeholder="e.g. Always respond in concise bullet points with Python 3 type hints..."
                  rows={4}
                  className="w-full text-xs p-3 bg-white border border-[#E9E4F0] rounded-xl focus:outline-none focus:border-[#7654B8]"
                />
                <p className="text-[11px] text-[#777386] mt-1">
                  These instructions are automatically prepended to every conversation's system context.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#292638] mb-1">
                  Text-to-Speech Voice
                </label>
                <select
                  value={settings.speech_voice}
                  onChange={(e) => setSettings({ ...settings, speech_voice: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E9E4F0] rounded-xl focus:outline-none focus:border-[#7654B8]"
                >
                  <option value="natural">Browser Default Voice</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292638] mb-1">
                  Speech Rate: {settings.speech_rate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.speech_rate}
                  onChange={(e) => setSettings({ ...settings, speech_rate: parseFloat(e.target.value) })}
                  className="w-full accent-[#7654B8]"
                />
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[#292638]">Cross-Conversation User Preferences</h3>
                <p className="text-[11px] text-[#777386]">
                  Lumi AI remembers these facts across all conversations to tailor its advice.
                </p>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="p-3 bg-white border border-[#E9E4F0] rounded-2xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. Preferred Language)"
                    value={newMemKey}
                    onChange={(e) => setNewMemKey(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Preference (e.g. Python & TypeScript)"
                    value={newMemVal}
                    onChange={(e) => setNewMemVal(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMemKey.trim() || !newMemVal.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7654B8] text-white text-xs font-medium rounded-xl hover:bg-[#6543A0] disabled:opacity-40"
                >
                  <Plus size={14} />
                  <span>Add Memory Preference</span>
                </button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                {memories.length === 0 ? (
                  <p className="text-xs text-[#777386] text-center py-4">No saved memories yet.</p>
                ) : (
                  memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-white border border-[#E9E4F0] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#7654B8]">{m.key}:</span>{' '}
                        <span className="text-[#292638]">{m.value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleMemory(m)}
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {m.is_active ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1 text-[#777386] hover:text-[#EF4444]"
                          title="Delete memory"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-3">
              <div className="p-4 bg-white border border-[#E9E4F0] rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#292638]">Groq Generative AI Provider</span>
                  <span className="flex items-center gap-1 font-semibold text-[#10B981]">
                    {settings.groq_configured ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Configured & Online</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-[#EF4444]" />
                        <span className="text-[#EF4444]">Missing GROQ_API_KEY</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#292638]">Live Web Search</span>
                  <span className="flex items-center gap-1 font-semibold text-[#10B981]">
                    <CheckCircle2 size={14} />
                    <span>Enabled (DuckDuckGo Provider)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#292638]">RAG Vector Indexing</span>
                  <span className="flex items-center gap-1 font-semibold text-[#10B981]">
                    <CheckCircle2 size={14} />
                    <span>Pure-Python BM25 Engine</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#292638]">Storage Database</span>
                  <span className="flex items-center gap-1 font-semibold text-[#10B981]">
                    <CheckCircle2 size={14} />
                    <span>SQLite / PostgreSQL Ready</span>
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#EDE5FF] text-[#49356F] rounded-2xl text-xs space-y-1">
                <p className="font-semibold">Security & Privacy Architecture:</p>
                <p className="text-[11px] leading-relaxed">
                  Lumi AI executes all RAG vector calculations and data profiling strictly on the server or in memory.
                  API keys are never sent to the client browser.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E9E4F0] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E9E4F0] text-[#777386] text-xs font-medium rounded-xl hover:bg-[#FAF9FF]"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await handleSaveSettings();
              onClose();
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-[#7654B8] text-white text-xs font-medium rounded-xl hover:bg-[#6543A0] disabled:opacity-40"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
