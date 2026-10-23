import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  RotateCcw,
  Volume2,
  X,
  Keyboard,
  Send,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { AiOrb, AiOrbState } from '../common/AiOrb';
import { VoiceWaveform } from './VoiceWaveform';
import { speechToText, textToSpeech } from '../../utils/voiceClient';
import { audioManager } from '../../utils/audio';
import { api } from '../../services/api';
import { VoiceTurnResponse } from '../../types';

interface OneTapVoiceBarProps {
  onDataChanged: () => void;
  onOpenCheatSheet: () => void;
  isSimpleMode?: boolean;
}

export const OneTapVoiceBar: React.FC<OneTapVoiceBarProps> = ({
  onDataChanged,
  onOpenCheatSheet,
  isSimpleMode = false
}) => {
  const [orbState, setOrbState] = useState<AiOrbState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [spokenResponse, setSpokenResponse] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [lastSpokenMemory, setLastSpokenMemory] = useState<string>('');

  useEffect(() => {
    return () => {
      speechToText.stopListening();
      textToSpeech.stop();
    };
  }, []);

  const stopAll = () => {
    speechToText.stopListening();
    textToSpeech.stop();
    setOrbState('idle');
  };

  const handleStartListening = () => {
    stopAll();
    setErrorMessage(null);
    setInterimText('');
    setTranscript('');
    audioManager.playConfirmSound();

    speechToText.startListening({
      onStart: () => {
        setOrbState('listening');
      },
      onInterimTranscript: (interim) => {
        setInterimText(interim);
      },
      onFinalTranscript: (final) => {
        setInterimText('');
        setTranscript(final);
        processSpokenQuery(final);
      },
      onError: (err) => {
        setOrbState('error');
        setErrorMessage(err || 'Microphone error. Please allow microphone access or type instead.');
        setTimeout(() => setOrbState('idle'), 4000);
      },
      onEnd: () => {
        if (orbState === 'listening') {
          setOrbState('idle');
        }
      }
    });
  };

  const handleCancelListening = () => {
    speechToText.stopListening();
    setInterimText('');
    setTranscript('');
    setOrbState('idle');
  };

  const processSpokenQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    speechToText.stopListening();
    setOrbState('thinking');
    setErrorMessage(null);

    try {
      const turnRes: VoiceTurnResponse = await api.sendVoiceTurn({
        sessionId: sessionId || undefined,
        transcript: text
      });

      setSessionId(turnRes.sessionId);
      setSpokenResponse(turnRes.spokenText);
      setDisplayText(turnRes.displayText);
      setLastSpokenMemory(turnRes.spokenText);

      if (turnRes.toolExecution) {
        audioManager.playConfirmSound();
        onDataChanged();
      }

      // Transition to speaking state
      setOrbState('speaking');
      textToSpeech.speak(turnRes.spokenText, {
        rate: isSimpleMode ? 0.9 : 1.0,
        onStart: () => setOrbState('speaking'),
        onEnd: () => {
          setOrbState('success');
          setTimeout(() => {
            setOrbState('idle');
          }, 1500);
        },
        onError: () => setOrbState('idle')
      });
    } catch (err: any) {
      setOrbState('error');
      setErrorMessage(err.message || 'Trouble connecting to EchoCare voice brain. Please try again.');
      setTimeout(() => setOrbState('idle'), 4000);
    }
  };

  const handleRepeatLast = () => {
    if (!lastSpokenMemory) {
      textToSpeech.speak("Nothing to repeat yet. Press the microphone to talk with EchoCare.", {
        onStart: () => setOrbState('speaking'),
        onEnd: () => setOrbState('idle')
      });
      return;
    }
    setOrbState('speaking');
    textToSpeech.speak(lastSpokenMemory, {
      rate: isSimpleMode ? 0.9 : 1.0,
      onStart: () => setOrbState('speaking'),
      onEnd: () => setOrbState('idle')
    });
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const q = inputText;
    setInputText('');
    setTranscript(q);
    processSpokenQuery(q);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        orbState === 'listening'
          ? 'bg-gradient-to-r from-[#071d1e] via-[#09272b] to-[#0a1f29] border-emerald-500/50 shadow-2xl shadow-emerald-950/40 ring-2 ring-emerald-500/20'
          : orbState === 'thinking'
          ? 'bg-gradient-to-r from-[#170e28] via-[#1d1233] to-[#110e24] border-purple-500/50 shadow-2xl shadow-purple-950/40'
          : orbState === 'speaking'
          ? 'bg-gradient-to-r from-[#09182d] via-[#0d223f] to-[#0b1c34] border-cyan-500/50 shadow-2xl shadow-cyan-950/40'
          : 'bg-gradient-to-r from-[#0c1424] via-[#0f1b2f] to-[#0d1628] border-cyan-500/30 shadow-xl'
      } ${isSimpleMode ? 'p-6 sm:p-7' : 'p-5 sm:p-6'}`}
      role="region"
      aria-label="One-Tap Voice Assistant"
    >
      {/* Background ambient glow aura */}
      <div
        className={`absolute -right-10 -bottom-10 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          orbState === 'listening'
            ? 'bg-emerald-500/20'
            : orbState === 'thinking'
            ? 'bg-purple-500/20'
            : orbState === 'speaking'
            ? 'bg-cyan-500/20'
            : 'bg-blue-600/10'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left Side: Orb + Spoken State Info */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            onClick={orbState === 'listening' ? handleCancelListening : handleStartListening}
            className="cursor-pointer shrink-0 transition-transform active:scale-95"
            title={orbState === 'listening' ? 'Click to cancel listening' : 'One-Tap Talk to EchoCare'}
          >
            <AiOrb size={isSimpleMode ? 'lg' : 'md'} state={orbState} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-400">
                Alexa-Style Voice Assistant
              </span>
              <span className="text-slate-500">·</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  orbState === 'listening'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse'
                    : orbState === 'thinking'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : orbState === 'speaking'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {orbState === 'listening' && "I'm listening..."}
                {orbState === 'thinking' && 'Thinking...'}
                {orbState === 'speaking' && 'Speaking...'}
                {orbState === 'success' && 'Done!'}
                {orbState === 'error' && 'Error'}
                {orbState === 'idle' && 'Ready — Tap to Speak'}
              </span>
            </div>

            {/* State Announcement text */}
            <h3 className={`${isSimpleMode ? 'text-lg sm:text-xl font-bold text-white' : 'text-base font-bold text-white'}`}>
              {orbState === 'listening' ? (
                <span className="text-emerald-300">
                  {interimText ? `"${interimText}..."` : "I'm listening to your voice..."}
                </span>
              ) : orbState === 'thinking' ? (
                <span className="text-purple-300">EchoCare is reasoning and validating care records...</span>
              ) : orbState === 'speaking' ? (
                <span className="text-cyan-200 line-clamp-2">"{spokenResponse}"</span>
              ) : (
                <span>"EchoCare, what do I need to do today?"</span>
              )}
            </h3>

            {/* Subtitle / Help instructions */}
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>Speak naturally to create reminders, check tasks, or ask for vitals.</span>
            </p>

            {/* Live Waveform when listening or speaking */}
            {(orbState === 'listening' || orbState === 'speaking') && (
              <div className="mt-2.5">
                <VoiceWaveform state={orbState} isMicActive={orbState === 'listening'} />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Main Big One-Tap Mic Button & Quick Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto shrink-0">
          {/* Prominent One-Tap Microphone Button */}
          {orbState === 'listening' ? (
            <button
              onClick={handleCancelListening}
              className={`flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950 ring-4 ring-rose-500/30 transition-all ${
                isSimpleMode ? 'px-6 py-4 text-base' : 'px-5 py-3 text-sm'
              }`}
              title="Stop listening"
            >
              <MicOff className="w-5 h-5 animate-pulse" />
              <span>Stop Listening</span>
            </button>
          ) : (
            <button
              onClick={handleStartListening}
              className={`flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-xl shadow-cyan-950/60 border border-cyan-400/40 hover:scale-105 transition-all ${
                isSimpleMode ? 'px-7 py-4 text-base' : 'px-5 py-3 text-sm'
              }`}
              title="Tap to speak with EchoCare"
            >
              <div className="relative">
                <Mic className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-200 animate-ping" />
              </div>
              <span>Tap to Speak</span>
            </button>
          )}

          {/* Stop / Interrupt button when speaking */}
          {orbState === 'speaking' && (
            <button
              onClick={stopAll}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-semibold transition-colors"
              title="Interrupt speech (Stop)"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Repeat button */}
          <button
            onClick={handleRepeatLast}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Repeat last spoken answer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Repeat</span>
          </button>

          {/* Type Instead Toggle */}
          <button
            onClick={() => setIsTypingMode(!isTypingMode)}
            className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-colors ${
              isTypingMode
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Type request instead"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Type instead</span>
          </button>

          {/* Voice Cheat Sheet Button */}
          <button
            onClick={onOpenCheatSheet}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors"
            title="Open Voice Command Cheat Sheet"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cheat Sheet</span>
          </button>
        </div>
      </div>

      {/* Error alert notice if microphone permission failed */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handleStartListening}
            className="underline font-semibold text-rose-300 hover:text-white shrink-0"
          >
            Retry Mic
          </button>
        </div>
      )}

      {/* Spoken Response Result Banner */}
      {spokenResponse && !errorMessage && orbState !== 'listening' && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#09101d] border border-cyan-900/50 text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-cyan-300 block mb-0.5">EchoCare Spoken Reply:</span>
              <p className="text-slate-200 text-xs sm:text-sm">"{spokenResponse}"</p>
              {displayText && displayText !== spokenResponse && (
                <p className="text-[11px] text-slate-400 mt-1 whitespace-pre-wrap">{displayText}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRepeatLast}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Type Instead Input */}
      {isTypingMode && (
        <form onSubmit={handleTextSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your care request (e.g., Remind me to call Mom at six, What tasks are due today?)..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTypingMode(false)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
            title="Close text input"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Contextual Spoken Prompt Pills */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-400 font-semibold shrink-0">Try Saying:</span>
        <button
          onClick={() => processSpokenQuery('EchoCare, what do I need to do today?')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
        >
          "What do I need to do today?"
        </button>
        <button
          onClick={() => processSpokenQuery('Remind me to call the caregiver at six')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
        >
          "Remind me to call the caregiver at six"
        </button>
        <button
          onClick={() => processSpokenQuery("What was Eleanor's blood pressure today?")}
          className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
        >
          "What were her vitals today?"
        </button>
        <button
          onClick={() => processSpokenQuery('Prepare a caregiver handover for Nurse David')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
        >
          "Prepare shift handover"
        </button>
      </div>
    </div>
  );
};
