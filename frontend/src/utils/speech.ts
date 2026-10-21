export function cleanMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isSynthesisSupported(): boolean {
    return this.synth !== null;
  }

  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  speak(
    text: string,
    options: {
      rate?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    if (!this.synth) {
      options.onError?.(new Error('Speech synthesis is not supported in this browser.'));
      return;
    }

    this.stopSpeaking();

    const cleanText = cleanMarkdownForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.0;

    if (options.voiceName) {
      const voices = this.synth.getVoices();
      const match = voices.find((v) => v.name === options.voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = (e) => options.onError?.(e);

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  startListening(callbacks: {
    onResult: (transcript: string) => void;
    onError: (err: string) => void;
    onEnd: () => void;
  }) {
    if (!this.isRecognitionSupported()) {
      callbacks.onError('Browser Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      callbacks.onResult(finalTranscript);
    };

    this.recognition.onerror = (event: any) => {
      callbacks.onError(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      callbacks.onEnd();
    };

    this.recognition.start();
    return this.recognition;
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }
}

export const speechManager = new SpeechManager();
