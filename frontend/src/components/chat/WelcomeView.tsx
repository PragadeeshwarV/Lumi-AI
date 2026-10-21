import React from 'react';
import {
  Sparkles,
  BookOpen,
  PenTool,
  Code2,
  FileText,
  Lightbulb,
  BarChart2
} from 'lucide-react';
import { AssistantMode } from '../../types';

interface WelcomeViewProps {
  onSelectPrompt: (prompt: string, mode?: AssistantMode) => void;
}

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: 'Explain a difficult concept',
    desc: 'Break down quantum computing, zero-knowledge proofs, or neural networks intuitively.',
    prompt: 'Explain the concept of Zero-Knowledge Proofs in simple, intuitive terms with practical examples.',
    mode: 'learning' as AssistantMode,
  },
  {
    icon: PenTool,
    title: 'Help me write something',
    desc: 'Draft an executive briefing, professional email, or compelling proposal.',
    prompt: 'Help me draft a concise, persuasive executive proposal announcing an AI infrastructure upgrade.',
    mode: 'writing' as AssistantMode,
  },
  {
    icon: Code2,
    title: 'Debug my Python code',
    desc: 'Identify logical bugs, optimize algorithms, or refactor for production performance.',
    prompt: 'Here is my Python function that is running slowly. How can I optimize it for memory efficiency and speed?\n\ndef find_duplicates(items):\n    dups = []\n    for i in range(len(items)):\n        for j in range(i+1, len(items)):\n            if items[i] == items[j] and items[i] not in dups:\n                dups.append(items[i])\n    return dups',
    mode: 'coding' as AssistantMode,
  },
  {
    icon: FileText,
    title: 'Summarize a document',
    desc: 'Extract key findings, action items, and executive summaries from uploaded reports.',
    prompt: 'What are the best practices for structuring a multi-page technical report for executive leadership?',
    mode: 'research' as AssistantMode,
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm a project',
    desc: 'Generate novel product ideas, architectural designs, or feature roadmaps.',
    prompt: 'Brainstorm 5 innovative, high-impact features for an enterprise AI knowledge assistant that delight power users.',
    mode: 'creative' as AssistantMode,
  },
  {
    icon: BarChart2,
    title: 'Analyze a dataset',
    desc: 'Discover statistical correlations, summarize distributions, and interpret outliers.',
    prompt: 'What descriptive statistical tests and visualizations should I run first when exploring a new tabular sales dataset?',
    mode: 'data_analysis' as AssistantMode,
  },
];

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Sparkle Icon & Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE5FF] text-[#7654B8] shadow-subtle mx-auto">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#292638]">
            What would you like to work on?
          </h2>
          <p className="text-sm text-[#777386] max-w-md mx-auto">
            Ask a question, explore an idea, or work through something complex.
          </p>
        </div>

        {/* 6 Suggested Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt, item.mode)}
                className="group p-3.5 bg-white border border-[#E9E4F0] hover:border-[#7654B8] rounded-2xl shadow-subtle hover:shadow-card transition-all text-left flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-[#FAF9FF] text-[#7654B8] group-hover:bg-[#EDE5FF] transition-colors">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-medium text-xs text-[#292638] group-hover:text-[#7654B8] transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[11px] text-[#777386] leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
