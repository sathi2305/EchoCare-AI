/**
 * EchoCare AI — Client-Side Speech Processing & Audio Management
 * Implements real SpeechRecognition, Web Speech Synthesis, and Web Audio Analyser
 */

export interface SpeechToTextCallbacks {
  onStart: () => void;
  onInterimTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onWakeWordDetected?: () => void;
}

export class SpeechToTextService {
  private recognition: any = null;
  private isListening = false;
  private isWakeWordActive = false;
  private language = 'en-US';
  private callbacks: SpeechToTextCallbacks | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks?.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          this.callbacks?.onInterimTranscript(interim);
        }

        if (final) {
          const cleanFinal = final.trim();
          // Check wake word if in wake-word mode
          if (this.isWakeWordActive) {
            const lower = cleanFinal.toLowerCase();
            if (lower.includes('echocare') || lower.includes('echo care') || lower.includes('hey echo')) {
              this.callbacks?.onWakeWordDetected?.();
              // Strip wake word and send remainder
              const remainder = cleanFinal.replace(/^(?:hey\s+)?echo\s*care\s*[,]?\s*/i, '').trim();
              if (remainder.length > 2) {
                this.callbacks?.onFinalTranscript(remainder);
                return;
              }
            }
          }
          this.callbacks?.onFinalTranscript(cleanFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errMsg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          errMsg = 'Microphone permission denied. Please grant microphone access in browser settings.';
        } else if (event.error === 'no-speech') {
          errMsg = 'No speech detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          errMsg = 'No microphone device was detected.';
        }
        this.callbacks?.onError(errMsg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks?.onEnd();

        // If in continuous wake-word mode, restart listening safely
        if (this.isWakeWordActive) {
          setTimeout(() => {
            if (this.isWakeWordActive && !this.isListening) {
              try {
                this.recognition.start();
              } catch (e) {
                // Ignore start collision
              }
            }
          }, 400);
        }
      };
    }
  }

  setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  setWakeWordMode(enabled: boolean) {
    this.isWakeWordActive = enabled;
    if (enabled && !this.isListening && this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // ignore
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  startListening(callbacks: SpeechToTextCallbacks) {
    this.callbacks = callbacks;
    if (!this.recognition) {
      callbacks.onError('Browser does not support SpeechRecognition. You can still use text input.');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    try {
      this.recognition.lang = this.language;
      this.recognition.start();
    } catch (e: any) {
      console.warn('SpeechRecognition start error:', e);
    }
  }

  stopListening() {
    this.isWakeWordActive = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }
}

export class TextToSpeechService {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadVoices();
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        this.availableVoices = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  speak(
    text: string,
    options?: {
      language?: string;
      voiceName?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onEnd?.();
      return;
    }

    // Stop ongoing speech
    this.stop();

    // Clean text for speech: remove markdown, emojis, asterisks
    const cleanText = text
      .replace(/[•*#_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options?.language || 'en-US';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume !== undefined ? options.volume : 1.0;

    // Pick best matching voice
    const voices = this.getVoices();
    if (options?.voiceName) {
      const match = voices.find(v => v.name === options.voiceName);
      if (match) utterance.voice = match;
    } else {
      // Prefer neural, natural, Google, Samantha, or primary english voice
      const preferred = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')) &&
        (utterance.lang.startsWith(v.lang.slice(0, 2)))
      ) || voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));

      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis playback error:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onError?.();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking || (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);
  }
}

/**
 * Real-time microphone audio frequency analyser using Web Audio API
 */
export class RealtimeAudioAnalyser {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;

  async start(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (e) {
      console.warn('RealtimeAudioAnalyser permission or start failed:', e);
      return false;
    }
  }

  getFrequencies(): number[] {
    if (!this.analyser || !this.dataArray) {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    (this.analyser as any).getByteFrequencyData(this.dataArray);
    const result: number[] = [];
    const step = Math.floor(this.dataArray.length / 8);
    for (let i = 0; i < 8; i++) {
      result.push(this.dataArray[i * step] / 255);
    }
    return result;
  }

  stop() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }
}

export const speechToText = new SpeechToTextService();
export const textToSpeech = new TextToSpeechService();
