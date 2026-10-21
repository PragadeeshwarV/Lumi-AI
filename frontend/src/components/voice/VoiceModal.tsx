import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { speechManager } from '../../utils/speech';
import { api } from '../../services/api';
import { AssistantMode } from '../../types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId: string | null;
  selectedModel: string;
  selectedMode: AssistantMode;
  onNewMessageAdded: () => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  activeConversationId,
  selectedModel,
  selectedMode,
  onNewMessageAdded,
}) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseAccumulator, setResponseAccumulator] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      speechManager.stopSpeaking();
      speechManager.stopListening();
      setState('idle');
      setTranscript('');
      setResponseAccumulator('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startVoiceTurn = () => {
    setErrorMsg(null);
    speechManager.stopSpeaking();
    setState('listening');
    setTranscript('');
    setResponseAccumulator('');

    speechManager.startListening({
      onResult: (text) => {
        setTranscript(text);
      },
      onError: (err) => {
        setErrorMsg(err);
        setState('idle');
      },
      onEnd: () => {
        // Automatically submit transcript when user pauses speaking
        if (transcript.trim()) {
          processSpokenQuery(transcript.trim());
        } else {
          setState('idle');
        }
      },
    });
  };

  const processSpokenQuery = async (queryText: string) => {
    setState('thinking');
    let fullResponse = '';

    await api.streamChat(
      {
        conversation_id: activeConversationId || undefined,
        content: queryText,
        model_name: selectedModel,
        assistant_mode: selectedMode,
      },
      {
        onToken: (tok) => {
          fullResponse += tok;
          setResponseAccumulator((prev) => prev + tok);
        },
        onDone: () => {
          onNewMessageAdded();
          if (fullResponse.trim()) {
            setState('speaking');
            speechManager.speak(fullResponse, {
              onEnd: () => setState('idle'),
              onError: () => setState('idle'),
            });
          } else {
            setState('idle');
          }
        },
        onError: (err) => {
          setErrorMsg(err);
          setState('idle');
        },
      }
    );
  };

  const handleStopSpeaking = () => {
    speechManager.stopSpeaking();
    setState('idle');
  };

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return 'Listening... Speak your question.';
      case 'thinking':
        return 'Thinking and generating answer...';
      case 'speaking':
        return 'Lumi is speaking...';
      default:
        return 'Tap microphone to start talking.';
    }
  };

  return (
    <div className="fixed inset-0 bg-[#292638]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#FAF9FF] border border-[#E9E4F0] rounded-3xl shadow-card p-6 flex flex-col items-center text-center space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-[#777386] hover:text-[#292638] hover:bg-[#EDE5FF] rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE5FF] text-[#7654B8] text-xs font-medium">
            <Sparkles size={14} />
            <span>Dedicated Voice Mode</span>
          </div>
          <h2 className="text-xl font-semibold text-[#292638] tracking-tight">Conversational Voice Assistant</h2>
        </div>

        {/* Central Audio Wave / Mic Control */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated Wave Rings */}
          {(state === 'listening' || state === 'speaking') && (
            <div className="absolute w-40 h-40 rounded-full bg-[#D8C8F5] opacity-40 animate-ping pointer-events-none" />
          )}

          <button
            onClick={() => {
              if (state === 'idle') startVoiceTurn();
              else if (state === 'listening') {
                speechManager.stopListening();
                if (transcript.trim()) processSpokenQuery(transcript.trim());
                else setState('idle');
              } else if (state === 'speaking') handleStopSpeaking();
            }}
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-card transition-all active:scale-95 ${
              state === 'listening'
                ? 'bg-red-500 text-white shadow-red-200'
                : state === 'speaking'
                ? 'bg-[#7654B8] text-white'
                : state === 'thinking'
                ? 'bg-[#EDE5FF] text-[#7654B8]'
                : 'bg-white hover:bg-[#EDE5FF] text-[#7654B8] border-2 border-[#D8C8F5]'
            }`}
          >
            {state === 'thinking' ? (
              <Loader2 size={36} className="animate-spin" />
            ) : state === 'listening' ? (
              <Mic size={36} />
            ) : state === 'speaking' ? (
              <Volume2 size={36} className="animate-pulse" />
            ) : (
              <Mic size={36} />
            )}
          </button>
        </div>

        {/* Waveform Bars */}
        <div className="flex items-center gap-1.5 h-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-1.5 bg-[#7654B8] rounded-full transition-all duration-300 ${
                state === 'listening' || state === 'speaking'
                  ? `h-8 animate-wave-${i}`
                  : 'h-2 opacity-30'
              }`}
            />
          ))}
        </div>

        {/* Status Label */}
        <div className="text-sm font-medium text-[#49356F]">
          {getStateText()}
        </div>

        {/* Transcript Box */}
        {(transcript || responseAccumulator) && (
          <div className="w-full max-h-40 overflow-y-auto p-4 bg-white border border-[#E9E4F0] rounded-2xl text-left text-xs space-y-2">
            {transcript && (
              <div>
                <span className="font-semibold text-[#7654B8] block text-[10px] uppercase">You Said:</span>
                <p className="text-[#292638] mt-0.5">{transcript}</p>
              </div>
            )}
            {responseAccumulator && (
              <div>
                <span className="font-semibold text-[#49356F] block text-[10px] uppercase">Lumi Answered:</span>
                <p className="text-[#777386] mt-0.5">{responseAccumulator}</p>
              </div>
            )}
          </div>
        )}

        {/* Error notice */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center gap-3">
          {state === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E9E4F0] text-[#EF4444] text-xs font-medium rounded-xl hover:bg-red-50"
            >
              <VolumeX size={14} />
              <span>Stop Speaking</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#EDE5FF] text-[#49356F] text-xs font-medium rounded-xl hover:bg-[#D8C8F5]"
          >
            Exit Voice Mode
          </button>
        </div>
      </div>
    </div>
  );
};
