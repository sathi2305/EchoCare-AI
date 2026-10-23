import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  X,
  ChevronDown,
  RotateCcw,
  Check,
  AlertTriangle,
  Languages,
  Settings2,
  Sliders,
  Send,
  Radio,
  LayoutDashboard,
  CheckSquare,
  Bell,
  History,
  Navigation
} from 'lucide-react';
import { AiOrb } from '../common/AiOrb';
import { VoiceWaveform } from './VoiceWaveform';
import { speechToText, textToSpeech } from '../../utils/voiceClient';
import { audioManager } from '../../utils/audio';
import { api } from '../../services/api';
import { VoiceTurnResponse, VoiceSessionState, VoiceSettings } from '../../types';

interface AlexaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AlexaVoiceModal: React.FC<AlexaVoiceModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
  onNavigateToDashboard,
  onNavigateTab
}) => {
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [assistantSpoken, setAssistantSpoken] = useState('');
  const [assistantDetail, setAssistantDetail] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionState, setSessionState] = useState<VoiceSessionState | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([
    'Go to dashboard',
    'What do I need to do today?',
    'Remind me to call the caregiver at six PM',
    'What was her blood pressure today?'
  ]);
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    wakeWordEnabled: false,
    wakeWordPhrase: 'EchoCare',
    continuousListening: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    autoListenAfterReply: true,
    soundEffectsEnabled: true,
    language: 'en-US'
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const v = textToSpeech.getVoices();
      setAvailableVoices(v);
    }
  }, [isOpen]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
      speechToText.stopListening();
    } else {
      // Auto-start listening or present initial prompt
      if (!assistantSpoken) {
        setAssistantSpoken("Hello Sarah, EchoCare is listening. What can I help you coordinate for Eleanor?");
        setAssistantDetail("Tap the microphone or say a request like:\n• 'What care tasks do I have today?'\n• 'Remind me to call the caregiver at six PM'");
      }
    }
  }, [isOpen]);

  const stopAllAudio = () => {
    textToSpeech.stop();
    setOrbState('idle');
  };

  const handleStartListening = () => {
    stopAllAudio();
    setErrorMessage(null);
    setInterimTranscript('');

    if (voiceSettings.soundEffectsEnabled) {
      audioManager.playConfirmSound();
    }

    speechToText.setLanguage(voiceSettings.language);
    speechToText.startListening({
      onStart: () => {
        setOrbState('listening');
      },
      onInterimTranscript: (text) => {
        setInterimTranscript(text);
      },
      onFinalTranscript: (text) => {
        setTranscript(text);
        setInterimTranscript('');
        handleProcessSpeech(text);
      },
      onError: (err) => {
        setOrbState('idle');
        setErrorMessage(err);
      },
      onEnd: () => {
        if (orbState === 'listening') {
          setOrbState('idle');
        }
      },
      onWakeWordDetected: () => {
        audioManager.playConfirmSound();
      }
    });
  };

  const handleStopListening = () => {
    speechToText.stopListening();
    setOrbState('idle');
  };

  const handleProcessSpeech = async (spokenQuery: string) => {
    const text = spokenQuery.trim();
    if (!text) return;

    speechToText.stopListening();
    setOrbState('thinking');
    setErrorMessage(null);

    // Fast-path for voice navigation to dashboard
    const cleanLower = text.toLowerCase();
    if (
      cleanLower.includes('go to dashboard') ||
      cleanLower.includes('open dashboard') ||
      cleanLower.includes('show dashboard') ||
      cleanLower.includes('take me to dashboard') ||
      cleanLower === 'dashboard'
    ) {
      const reply = "Navigating to your Care Overview Dashboard now.";
      setAssistantSpoken(reply);
      setAssistantDetail("Directing you to Eleanor's daily care goals, tasks, and reminders overview.");
      setOrbState('speaking');
      textToSpeech.speak(reply, {
        language: voiceSettings.language,
        onEnd: () => {
          setOrbState('idle');
          onNavigateToDashboard?.();
        }
      });
      setTimeout(() => {
        onNavigateToDashboard?.();
      }, 700);
      return;
    }

    try {
      const turnRes: VoiceTurnResponse = await api.sendVoiceTurn({
        sessionId: sessionId || undefined,
        transcript: text,
        language: voiceSettings.language
      });

      setSessionId(turnRes.sessionId);
      setSessionState(turnRes.sessionState);
      setAssistantSpoken(turnRes.spokenText);
      setAssistantDetail(turnRes.displayText);
      if (turnRes.suggestedFollowUps && turnRes.suggestedFollowUps.length > 0) {
        setFollowUps(turnRes.suggestedFollowUps);
      }

      // If a tool was executed, notify parent to refresh tasks & reminders!
      if (turnRes.toolExecution) {
        onDataChanged();

        if (turnRes.toolExecution.tool === 'navigate_view') {
          const dest = turnRes.toolExecution.input?.destination;
          if (dest === 'overview' && onNavigateToDashboard) {
            setTimeout(() => onNavigateToDashboard(), 600);
          } else if (dest && onNavigateTab) {
            setTimeout(() => onNavigateTab(dest), 600);
          }
        }
      }

      // Speak assistant's response aloud
      setOrbState('speaking');
      textToSpeech.speak(turnRes.spokenText, {
        language: voiceSettings.language,
        rate: voiceSettings.speechRate,
        pitch: voiceSettings.speechPitch,
        volume: voiceSettings.speechVolume,
        voiceName: voiceSettings.selectedVoiceName,
        onStart: () => setOrbState('speaking'),
        onEnd: () => {
          setOrbState('idle');
          // If session is awaiting follow-up voice response (e.g. "Should I save it?"), auto-listen!
          if (turnRes.requiresVoiceResponse && voiceSettings.autoListenAfterReply) {
            setTimeout(() => {
              handleStartListening();
            }, 300);
          }
        },
        onError: () => setOrbState('idle')
      });
    } catch (err: any) {
      setOrbState('idle');
      setErrorMessage(err.message || 'Failed to process voice request');
      setAssistantSpoken("I'm sorry, I had trouble processing that request. Please try again.");
    }
  };

  const handleConfirmSlot = (isAffirmative: boolean) => {
    handleProcessSpeech(isAffirmative ? 'Yes, save it' : 'No, cancel');
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    setTranscript(msg);
    handleProcessSpeech(msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090e1a] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col">
        {/* Luminous Top Glow Stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Header Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0c1222]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-sm tracking-tight text-white">
              EchoCare <span className="text-cyan-400 font-normal">Voice Agent</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              (Alexa-Style HUD)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                showSettings
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Voice Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Voice Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient Navigation Bar for Alexa */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-slate-950 via-[#0d1629] to-slate-950 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Quick Navigation:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Primary "Go to Dashboard" button */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onNavigateToDashboard?.();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Go directly to Care Overview Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </button>

            {/* Care Tasks quick link */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onNavigateTab?.('tasks');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors"
              title="View Eleanor's Care Tasks"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Tasks</span>
            </button>

            {/* Reminders quick link */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onNavigateTab?.('reminders');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors"
              title="View Medication & Care Reminders"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Reminders</span>
            </button>

            {/* Audit History quick link */}
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onNavigateTab?.('history');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors"
              title="View Activity Audit Log"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* Settings Drawer (Collapsible) */}
        {showSettings && (
          <div className="px-6 py-4 bg-[#0a0f1e] border-b border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Voice Configuration</span>
              <span className="text-slate-400 text-[11px]">SpeechSynthesis & Web Speech</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Language</label>
                <select
                  value={voiceSettings.language}
                  onChange={(e: any) => setVoiceSettings({ ...voiceSettings, language: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assistant Speech Voice</label>
                <select
                  value={voiceSettings.selectedVoiceName || ''}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, selectedVoiceName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 truncate"
                >
                  <option value="">Default Natural Voice</option>
                  {availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoListen"
                  checked={voiceSettings.autoListenAfterReply}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, autoListenAfterReply: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                />
                <label htmlFor="autoListen" className="text-slate-300">
                  Auto-listen when follow-up confirmation is required
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Rate: {voiceSettings.speechRate}x</span>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={voiceSettings.speechRate}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, speechRate: parseFloat(e.target.value) })}
                  className="w-20 accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Central Ambient Experience */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          {/* Animated Glowing AI Orb */}
          <div className="py-2 cursor-pointer" onClick={orbState === 'listening' ? handleStopListening : handleStartListening}>
            <AiOrb size="lg" state={orbState} />
          </div>

          {/* State Text & Waveform */}
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                orbState === 'listening' ? 'text-emerald-400' :
                orbState === 'thinking' ? 'text-purple-400' :
                orbState === 'speaking' ? 'text-cyan-400' : 'text-slate-400'
              }`}>
                {orbState === 'listening' ? 'Listening to your voice...' :
                 orbState === 'thinking' ? 'EchoCare Reasoning & Validating...' :
                 orbState === 'speaking' ? 'EchoCare Speaking...' : 'EchoCare Ready — Tap Mic'}
              </span>
            </div>

            {/* Audio Waveform */}
            <div className="mt-2">
              <VoiceWaveform state={orbState} isMicActive={orbState === 'listening'} />
            </div>
          </div>

          {/* Live Transcript / Interim preview */}
          {(interimTranscript || transcript) && (
            <div className="w-full max-w-lg p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">You: </span>
              <span className="text-white font-medium">
                {interimTranscript ? `${interimTranscript}...` : transcript}
              </span>
            </div>
          )}

          {/* Error notice if microphone denied */}
          {errorMessage && (
            <div className="w-full max-w-lg p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs text-left">
              {errorMessage}
            </div>
          )}

          {/* Assistant Response Card */}
          {assistantSpoken && (
            <div className="w-full max-w-lg p-4 rounded-2xl bg-[#0f172a] border border-cyan-800/40 text-left space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  EchoCare Spoken Response
                </span>

                <div className="flex items-center gap-2">
                  {orbState === 'speaking' ? (
                    <button
                      onClick={stopAllAudio}
                      className="px-2 py-1 rounded-md bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 flex items-center gap-1 text-[11px]"
                      title="Interrupt / Stop speech"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => textToSpeech.speak(assistantSpoken, {
                        language: voiceSettings.language,
                        rate: voiceSettings.speechRate,
                        voiceName: voiceSettings.selectedVoiceName,
                        onStart: () => setOrbState('speaking'),
                        onEnd: () => setOrbState('idle')
                      })}
                      className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                      title="Replay spoken response"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                "{assistantSpoken}"
              </p>

              {/* Detail view */}
              {assistantDetail && assistantDetail !== assistantSpoken && (
                <div className="pt-2 text-xs text-slate-300 whitespace-pre-wrap font-sans border-t border-slate-800/60 max-h-36 overflow-y-auto">
                  {assistantDetail}
                </div>
              )}

              {/* Slot Confirmation Action Buttons (if awaiting confirmation) */}
              {sessionState?.activeSlot?.slotType?.includes('confirmation') && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2.5">
                  <button
                    onClick={() => handleConfirmSlot(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Yes, Save / Confirm</span>
                  </button>

                  <button
                    onClick={() => handleConfirmSlot(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>No, Cancel</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Follow-Up Chips */}
        <div className="px-6 py-2.5 bg-[#080d18] border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">Ask Next:</span>
          {followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(q);
                handleProcessSpeech(q);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 whitespace-nowrap transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Controls & Input Footer */}
        <div className="p-4 px-6 bg-[#0c1222] border-t border-slate-800 flex items-center gap-3">
          {/* Main Push / Tap to Talk Button */}
          <button
            onClick={orbState === 'listening' ? handleStopListening : handleStartListening}
            className={`p-3.5 rounded-2xl flex items-center gap-2 font-semibold text-xs shadow-xl transition-all ${
              orbState === 'listening'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-105'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105 shadow-cyan-950'
            }`}
          >
            {orbState === 'listening' ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Tap to Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Tap to Speak</span>
              </>
            )}
          </button>

          {/* Text Input Fallback */}
          <form onSubmit={handleTextSubmit} className="flex-1 relative flex items-center">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type your request here (e.g., Remind me to call the caregiver at six PM)..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="absolute right-2 p-1.5 text-slate-400 hover:text-cyan-400 disabled:opacity-30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Stop / Interrupt Audio Button */}
          {orbState === 'speaking' && (
            <button
              onClick={stopAllAudio}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
              title="Interrupt speech (Barge-in)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Interrupt</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
