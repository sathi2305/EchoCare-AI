import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Terminal,
  Languages,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sliders,
  HelpCircle,
  LayoutDashboard,
  CheckSquare,
  Bell,
  History,
  Navigation
} from 'lucide-react';
import { ChatMessage, AgentConfirmation, VoiceSessionState } from '../../types';
import { AiOrb } from '../common/AiOrb';
import { VoiceWaveform } from '../voice/VoiceWaveform';
import { VoiceCommandCheatSheetModal } from '../voice/VoiceCommandCheatSheetModal';
import { api } from '../../services/api';
import { audioManager } from '../../utils/audio';
import { speechToText, textToSpeech } from '../../utils/voiceClient';

interface AiAssistantPageProps {
  onDataChanged: () => void;
  currentPageContext?: string;
  onNavigateToDashboard?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  onDataChanged,
  currentPageContext = 'assistant',
  onNavigateToDashboard,
  onNavigateTab
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Hello Sarah, I'm EchoCare. I'm ready to help you coordinate Eleanor's care schedule, schedule medication reminders, check vitals, or prepare shift handovers. What would you like to do?",
      timestamp: '15:30'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<'idle' | 'thinking' | 'speaking' | 'listening'>('idle');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [language, setLanguage] = useState<'en-US' | 'ta-IN' | 'hi-IN'>('en-US');
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionState, setSessionState] = useState<VoiceSessionState | null>(null);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Go to dashboard',
    'What do I need to do today?',
    'Remind me to call the caregiver at six PM',
    'What was the reminder I just created?',
    'What were Eleanor\'s blood pressure readings today?',
    'Prepare a caregiver handover for Nurse David'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimText]);

  // Clean stop audio on unmount
  useEffect(() => {
    return () => {
      textToSpeech.stop();
      speechToText.stopListening();
    };
  }, []);

  const stopSpeaking = () => {
    textToSpeech.stop();
    setOrbState('idle');
  };

  const handleStartVoice = () => {
    stopSpeaking();
    setInterimText('');
    audioManager.playConfirmSound();

    speechToText.setLanguage(language);
    speechToText.startListening({
      onStart: () => {
        setOrbState('listening');
      },
      onInterimTranscript: (interim) => {
        setInterimText(interim);
      },
      onFinalTranscript: (final) => {
        setInterimText('');
        setInputText(final);
        handleSend(final);
      },
      onError: (err) => {
        setOrbState('idle');
        console.warn('Speech recognition error:', err);
      },
      onEnd: () => {
        if (orbState === 'listening') {
          setOrbState('idle');
        }
      }
    });
  };

  const handleStopVoice = () => {
    speechToText.stopListening();
    setOrbState('idle');
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    speechToText.stopListening();
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setInterimText('');

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
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
      setOrbState('speaking');
      if (speechEnabled) {
        textToSpeech.speak(reply, {
          language,
          rate: 1.0,
          onEnd: () => {
            setOrbState('idle');
            onNavigateToDashboard?.();
          }
        });
      }
      setTimeout(() => {
        onNavigateToDashboard?.();
      }, 700);
      return;
    }

    setIsLoading(true);
    setOrbState('thinking');

    try {
      // Use multi-turn voice turn endpoint to preserve context and slots
      const turnRes = await api.sendVoiceTurn({
        sessionId: sessionId || undefined,
        transcript: text,
        language
      });

      setSessionId(turnRes.sessionId);
      setSessionState(turnRes.sessionState);

      if (turnRes.suggestedFollowUps && turnRes.suggestedFollowUps.length > 0) {
        setSuggestedPrompts(turnRes.suggestedFollowUps);
      }

      audioManager.playConfirmSound();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: turnRes.displayText || turnRes.spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: turnRes.toolExecution,
        confirmation: turnRes.confirmation
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If a tool executed, refresh backend data
      if (turnRes.toolExecution) {
        onDataChanged();
      }

      // Voice output
      if (speechEnabled) {
        setOrbState('speaking');
        textToSpeech.speak(turnRes.spokenText, {
          language,
          rate: 1.0,
          onStart: () => setOrbState('speaking'),
          onEnd: () => {
            setOrbState('idle');
            // Auto listen if awaiting response
            if (turnRes.requiresVoiceResponse) {
              setTimeout(handleStartVoice, 300);
            }
          },
          onError: () => setOrbState('idle')
        });
      } else {
        setOrbState('idle');
      }
    } catch (err: any) {
      setOrbState('idle');
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `I encountered an issue: ${err.message || 'Server error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSlot = (isAffirmative: boolean) => {
    handleSend(isAffirmative ? 'Yes, save it' : 'No, cancel');
  };

  const handleClearSession = async () => {
    if (sessionId) {
      await api.clearVoiceSession(sessionId);
      setSessionId('');
      setSessionState(null);
    }
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: "Session memory reset. How can I help you coordinate Eleanor's care now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col max-w-5xl mx-auto rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden">
      {/* Assistant Header & Orb Status Bar */}
      <div className="p-4 px-6 bg-[#0c1222] border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <AiOrb size="sm" state={orbState} onClick={orbState === 'listening' ? handleStopVoice : handleStartVoice} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">EchoCare Voice Assistant</h2>
              <span className={`text-[10px] font-mono font-semibold uppercase ${
                orbState === 'listening' ? 'text-emerald-400' :
                orbState === 'thinking' ? 'text-purple-400' :
                orbState === 'speaking' ? 'text-cyan-400' : 'text-slate-400'
              }`}>
                {orbState === 'listening' ? 'Listening...' :
                 orbState === 'thinking' ? 'Reasoning...' :
                 orbState === 'speaking' ? 'Speaking...' : 'Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Alexa-Style Dialogue · Contextual Memory · Factual Records
            </p>
          </div>
        </div>

        {/* Voice and Language Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Waveform */}
          <div className="hidden sm:block px-2">
            <VoiceWaveform state={orbState} isMicActive={orbState === 'listening'} />
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-slate-300">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={language}
              onChange={(e: any) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en-US" className="bg-slate-900">English (US)</option>
              <option value="ta-IN" className="bg-slate-900">Tamil (தமிழ்)</option>
              <option value="hi-IN" className="bg-slate-900">Hindi (हिन्दी)</option>
            </select>
          </div>

          {/* Speech output toggle */}
          <button
            onClick={() => {
              if (speechEnabled) stopSpeaking();
              setSpeechEnabled(!speechEnabled);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              speechEnabled
                ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={speechEnabled ? 'Mute spoken audio' : 'Enable spoken voice'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice Command Cheat Sheet Button */}
          <button
            onClick={() => setIsCheatSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-800 text-cyan-300 hover:text-white hover:border-cyan-600 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            title="Open Voice Command Cheat Sheet"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Voice Cheat Sheet</span>
          </button>

          {/* Reset session memory */}
          <button
            onClick={handleClearSession}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset conversational memory"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ambient Navigation Bar for Alexa Assistant */}
      <div className="px-6 py-2.5 bg-gradient-to-r from-slate-950 via-[#0d1629] to-slate-950 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Quick Navigation:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Primary "Go to Dashboard" button */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onNavigateToDashboard?.();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Go directly to Care Overview Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </button>

          {/* Care Tasks quick link */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
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
              stopSpeaking();
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
              stopSpeaking();
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

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const hasTool = !!msg.toolExecution;
          const isToolExpanded = expandedToolMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                    : 'bg-[#0f172a] border border-slate-800/90 text-slate-200 rounded-bl-sm'
                }`}
              >
                {/* Spoken Audio Replay */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/60 text-[11px] text-slate-400">
                    <span className="text-cyan-400 font-semibold font-mono">EchoCare Voice</span>
                    <button
                      onClick={() => textToSpeech.speak(msg.text, { language })}
                      className="hover:text-cyan-300 flex items-center gap-1"
                      title="Play voice"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay Voice</span>
                    </button>
                  </div>
                )}

                {/* Text Body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Tool Execution Record Card */}
                {hasTool && msg.toolExecution && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setExpandedToolMsgId(isToolExpanded ? null : msg.id)}
                      className="w-full flex items-center justify-between text-left text-xs text-cyan-400 hover:text-cyan-300 font-mono py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Tool: {msg.toolExecution.tool}() · {msg.toolExecution.status}
                      </span>
                      {isToolExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isToolExpanded && (
                      <div className="mt-2 p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-2 overflow-x-auto">
                        <div>
                          <span className="text-slate-400">Input Arguments:</span>
                          <pre className="text-cyan-300">{JSON.stringify(msg.toolExecution.input, null, 2)}</pre>
                        </div>
                        {msg.toolExecution.output && (
                          <div>
                            <span className="text-slate-400">Output Result:</span>
                            <pre className="text-emerald-300">{JSON.stringify(msg.toolExecution.output, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Slot Confirmation Action Buttons (e.g., Should I save it?) */}
                {sessionState?.activeSlot?.slotType?.includes('confirmation') && !isUser && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmSlot(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Yes, Save / Confirm</span>
                    </button>
                    <button
                      onClick={() => handleConfirmSlot(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>No, Cancel</span>
                    </button>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`mt-1.5 text-[10px] text-right ${isUser ? 'text-cyan-100/70' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Interim Speech Stream (As user speaks) */}
        {interimText && (
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-2xl p-3 bg-cyan-950/60 border border-cyan-800/80 text-cyan-200 text-xs italic animate-pulse">
              {interimText}...
            </div>
          </div>
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-center gap-2 p-4 max-w-[220px] rounded-2xl bg-[#0f172a] border border-slate-800 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Consulting care records...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2.5 bg-[#0a0f1c] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-slate-400 shrink-0 font-medium">Suggestions:</span>
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}

        <button
          onClick={() => setIsCheatSheetOpen(true)}
          className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 shrink-0 transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap"
          title="Browse all voice commands by context"
        >
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Cheat Sheet</span>
        </button>
      </div>

      {/* Text & Speech Input Bar */}
      <div className="p-4 bg-[#0a0f1c] border-t border-slate-800 flex items-center gap-3">
        {/* Push-to-Talk Mic Button */}
        <button
          onClick={orbState === 'listening' ? handleStopVoice : handleStartVoice}
          className={`p-3 rounded-xl border transition-all ${
            orbState === 'listening'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50 scale-105'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
          title={orbState === 'listening' ? 'Stop listening' : 'Start voice input (SpeechRecognition)'}
        >
          {orbState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Input Text Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={orbState === 'listening' ? 'Listening to your speech...' : 'Ask EchoCare about tasks, meds, reminders, or request a handover...'}
            disabled={isLoading}
            className="w-full bg-[#0d1322] border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Stop / Interrupt Button (Barge-in) */}
        {orbState === 'speaking' && (
          <button
            onClick={stopSpeaking}
            className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-colors text-xs flex items-center gap-1.5"
            title="Interrupt spoken response"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-medium transition-all shadow-md shadow-cyan-950"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Command Cheat Sheet Modal */}
      <VoiceCommandCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        activeContext={currentPageContext}
        onSelectCommand={(cmd) => {
          setInputText(cmd);
          handleSend(cmd);
        }}
      />
    </div>
  );
};
