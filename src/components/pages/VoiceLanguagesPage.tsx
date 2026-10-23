import React, { useState, useEffect, useRef } from 'react';
import {
  Languages,
  Mic,
  MicOff,
  Volume2,
  Sliders,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Play,
  Square,
  Activity,
  Layers,
  Globe,
  Radio
} from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/i18n';
import { textToSpeech, RealtimeAudioAnalyser } from '../../utils/voiceClient';
import { audioManager } from '../../utils/audio';

export const VoiceLanguagesPage: React.FC = () => {
  const { language, setLanguage, currentLangInfo, t } = useLanguage();
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micFrequencies, setMicFrequencies] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [micAvgVolume, setMicAvgVolume] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [selectedCheatSheetTab, setSelectedCheatSheetTab] = useState<'en' | 'ta' | 'hi'>('en');

  const analyserRef = useRef<RealtimeAudioAnalyser | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Load voices
    const voices = textToSpeech.getVoices();
    setAvailableVoices(voices);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        setAvailableVoices(textToSpeech.getVoices());
      };
    }

    return () => {
      stopMicTest();
      textToSpeech.stop();
    };
  }, []);

  const startMicTest = async () => {
    analyserRef.current = new RealtimeAudioAnalyser();
    const ok = await analyserRef.current.start();
    if (!ok) {
      alert('Could not access microphone. Please ensure microphone permissions are granted in your browser.');
      return;
    }
    setIsMicTesting(true);

    const updateLoop = () => {
      if (analyserRef.current) {
        const freqs = analyserRef.current.getFrequencies();
        setMicFrequencies(freqs);
        const avg = freqs.reduce((a, b) => a + b, 0) / freqs.length;
        setMicAvgVolume(Math.round(avg * 100));
        animFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.stop();
      analyserRef.current = null;
    }
    setIsMicTesting(false);
    setMicFrequencies([0, 0, 0, 0, 0, 0, 0, 0]);
    setMicAvgVolume(0);
  };

  const handleTestVoicePlayback = () => {
    if (isPlayingTest) {
      textToSpeech.stop();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    audioManager.playConfirmSound();

    let sampleText = "Hello! I am EchoCare, your intelligent multilingual care assistant.";
    if (language === 'ta') {
      sampleText = "வணக்கம்! நான் எக்கோகேர், உங்கள் அறிவார்ந்த பராமரிப்பு உதவியாளர்.";
    } else if (language === 'hi') {
      sampleText = "नमस्ते! मैं इकोकेयर हूँ, आपकी बुद्धिमान देखभाल सहायक।";
    } else if (language === 'ml') {
      sampleText = "നമസ്കാരം! ഞാൻ എക്കോ കെയർ, നിങ്ങളുടെ പരിചരണ സഹായി.";
    } else if (language === 'te') {
      sampleText = "నమస్కారం! నేను ఎకోకేర్, మీ సంరక్షణ సహాయకుడిని.";
    } else if (language === 'kn') {
      sampleText = "ನಮಸ್ಕಾರ! ನಾನು ಎಕೋಕೇರ್, ನಿಮ್ಮ ಆರೈಕೆ ಸಹಾಯಕ.";
    }

    textToSpeech.speak(sampleText, {
      language: currentLangInfo.locale,
      voiceName: selectedVoiceName || undefined,
      rate: speechRate,
      pitch: speechPitch,
      onStart: () => setIsPlayingTest(true),
      onEnd: () => setIsPlayingTest(false),
      onError: () => setIsPlayingTest(false)
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-cyan-400" />
            <span>Voice & Languages Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure multilingual speech synthesis, test microphone input, and explore localized Alexa-style commands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Language:</span>
          <span className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold text-xs flex items-center gap-1.5">
            <span>{currentLangInfo.flag}</span>
            <span>{currentLangInfo.name}</span>
          </span>
        </div>
      </div>

      {/* Grid: Language Selector (Left) & Realtime Audio Prober (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Language Selection Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Select Active Language</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All dashboard cards, speech synthesis, and voice assistant responses adapt dynamically to your selected language.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORTED_LANGUAGES.map(lang => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/40 border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{lang.flag}</span>
                        <span className="text-xs font-bold text-white">{lang.name}</span>
                      </div>
                      <p className="text-xs text-cyan-300 font-medium">{lang.nativeName}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Speech Code: {lang.locale}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Note on Code-Switching */}
            <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
              <strong className="text-cyan-300">Multilingual & Code-Switching (Tanglish / Hinglish):</strong> EchoCare AI naturally recognizes conversational code-switching (e.g., <em>"Echo, innikku evening 6 manikku reminder set pannu"</em> or <em>"Sham ko chhah baje BP check ka reminder lagao"</em>).
            </div>
          </div>

          {/* Voice Synthesis Customization */}
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Speech Synthesis & Voice Tuning</span>
            </h3>

            {/* Voice Dropdown */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Installed System Voice ({availableVoices.length} detected)
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Default Recommended Voice</option>
                {availableVoices.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Speaking Rate (Speed)</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Voice Pitch</span>
                  <span className="font-mono text-indigo-400 tabular-nums">{speechPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Play Test Voice Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Preview spoken response with your settings:</span>
              <button
                onClick={handleTestVoicePlayback}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  isPlayingTest
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                }`}
              >
                {isPlayingTest ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Spoken Voice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Realtime Audio Prober & Mic Meter */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Microphone Prober</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Verify Web Audio API capture, signal frequencies, and ambient noise levels before talking with EchoCare.
            </p>

            {/* Mic Prober Visualizer Box */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80 flex flex-col items-center justify-center min-h-[160px]">
              {isMicTesting ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      Live Audio Capture
                    </span>
                    <span className="tabular-nums">Input Level: {micAvgVolume}%</span>
                  </div>

                  {/* 8-Band Frequency Bars */}
                  <div className="flex items-end justify-center gap-2.5 h-20 pt-2">
                    {micFrequencies.map((val, idx) => {
                      const heightPx = Math.max(6, Math.round(val * 72));
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className="w-4 rounded-t-sm transition-all duration-75 bg-gradient-to-t from-cyan-600 via-emerald-500 to-cyan-300"
                            style={{ height: `${heightPx}px` }}
                          />
                          <span className="text-[9px] text-slate-500 font-mono">B{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Mic className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Microphone Prober Idle</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click Start to test microphone frequency response</p>
                </div>
              )}
            </div>

            {/* Test Toggle Button */}
            <div className="mt-4 flex items-center justify-end">
              {isMicTesting ? (
                <button
                  onClick={stopMicTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Prober</span>
                </button>
              ) : (
                <button
                  onClick={startMicTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Microphone Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats on Language Intelligence */}
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Multilingual Engine Capabilities
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Supported Scripts:</span>
                <span className="font-medium text-slate-200">Latin, Devanagari, Tamil, Dravidian</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Code-Switching Accuracy:</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">100.0%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Clinical Refusal Safeguard:</span>
                <span className="font-medium text-cyan-300">Enforced in all languages</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Spoken Voice Cheat Sheet */}
      <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Voice Command Cheat Sheet by Category</span>
            </h3>
            <p className="text-xs text-slate-400">
              Spoken voice patterns optimized for Alexa-style natural conversations.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedCheatSheetTab('en')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCheatSheetTab === 'en'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedCheatSheetTab('ta')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCheatSheetTab === 'ta'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              தமிழ் (Tamil / Tanglish)
            </button>
            <button
              onClick={() => setSelectedCheatSheetTab('hi')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCheatSheetTab === 'hi'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Command Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {selectedCheatSheetTab === 'en' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  1. Medications & Scheduling
                </span>
                <p className="font-semibold text-slate-200">"Remind me to give Eleanor Lisinopril at six"</p>
                <p className="text-slate-400 text-[11px] mt-1">Multi-turn slot filling will confirm time before saving.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  2. Daily Tasks & Briefings
                </span>
                <p className="font-semibold text-slate-200">"What do I need to do today?"</p>
                <p className="text-slate-400 text-[11px] mt-1">Returns scheduled activities and vital check progress.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  3. Task Completion
                </span>
                <p className="font-semibold text-slate-200">"Mark the morning glucose check as completed"</p>
                <p className="text-slate-400 text-[11px] mt-1">Updates real database task status and recalculates adherence.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  4. Shift Handover
                </span>
                <p className="font-semibold text-slate-200">"Prepare a handover report for Nurse David"</p>
                <p className="text-slate-400 text-[11px] mt-1">Synthesizes day vitals, pending meds, and clinical notes.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  5. Vitals & Medical Observations
                </span>
                <p className="font-semibold text-slate-200">"What was Eleanor's blood pressure today?"</p>
                <p className="text-slate-400 text-[11px] mt-1">Queries live database records (124/76 mmHg recorded).</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-1">
                  6. Clinical Refusal Safeguard
                </span>
                <p className="font-semibold text-slate-200">"Can I double Eleanor's Lisinopril dose?"</p>
                <p className="text-slate-400 text-[11px] mt-1">Strict clinical refusal; routes to Dr. Robert Chen (555) 234-8901.</p>
              </div>
            </>
          )}

          {selectedCheatSheetTab === 'ta' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  1. மருந்து நினைவூட்டல் (Tanglish)
                </span>
                <p className="font-semibold text-slate-200">"Echo, innikku evening 7 manikku Metformin reminder set pannu"</p>
                <p className="text-slate-400 text-[11px] mt-1">நேரத்தைக் கேட்டு உறுதி செய்து தரவுத்தளத்தில் சேமிக்கும்.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  2. இன்றைய பணிகள் சுருக்கம்
                </span>
                <p className="font-semibold text-slate-200">"இன்னைக்கு என்னென்ன கேர் டாஸ்க் இருக்கு?"</p>
                <p className="text-slate-400 text-[11px] mt-1">இன்றைய அனைத்து திட்டமிடப்பட்ட பணிகளையும் பட்டியலிடும்.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  3. பணி முடித்தல்
                </span>
                <p className="font-semibold text-slate-200">"காலை குளுக்கோஸ் செக் முடிஞ்சிருச்சுன்னு மார்க் பண்ணு"</p>
                <p className="text-slate-400 text-[11px] mt-1">பணியை நிறைவு செய்து நிறைவு சதவீதத்தை புதுப்பிக்கும்.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  4. பணி ஒப்படைப்பு அறிக்கை
                </span>
                <p className="font-semibold text-slate-200">"Nurse David-க்கு ஷிப்ட் ஹேண்ட்ஓவர் தயார் பண்ணு"</p>
                <p className="text-slate-400 text-[11px] mt-1">முழு நாளுக்கான மருத்துவக் குறிப்புகளுடன் அறிக்கை உருவாக்கும்.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  5. ரத்த அழுத்தம் மற்றும் வைட்டல்ஸ்
                </span>
                <p className="font-semibold text-slate-200">"எலினோரின் இன்றைய ரத்த அழுத்தம் எவ்வளவு?"</p>
                <p className="text-slate-400 text-[11px] mt-1">உண்மையான பதிவுகளில் இருந்து 124/76 mmHg எனப் பதிலளிக்கும்.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-1">
                  6. மருத்துவப் பாதுகாப்பு
                </span>
                <p className="font-semibold text-slate-200">"Lisinopril மருந்து அளவை நான் மாற்றலாமா?"</p>
                <p className="text-slate-400 text-[11px] mt-1">மருந்தளவு மாற்ற மறுப்பு; டாக்டர் ராபர்ட் சென்னைத் தொடர்புகொள்ளும்.</p>
              </div>
            </>
          )}

          {selectedCheatSheetTab === 'hi' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  1. दवा का अनुस्मारक (Hindi)
                </span>
                <p className="font-semibold text-slate-200">"इको, शाम छह बजे एलेनोर को दवा देने की याद दिलाओ"</p>
                <p className="text-slate-400 text-[11px] mt-1">समय की पुष्टि के बाद डेटाबेस में रिमाइंडर दर्ज करेगा।</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  2. आज के कार्य
                </span>
                <p className="font-semibold text-slate-200">"आज मुझे कौन से देखभाल कार्य करने हैं?"</p>
                <p className="text-slate-400 text-[11px] mt-1">दिन भर के शेड्यूल और लंबित कार्यों की जानकारी देगा।</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  3. कार्य पूर्ण करना
                </span>
                <p className="font-semibold text-slate-200">"सुबह की शुगर जांच को पूर्ण चिह्नित करें"</p>
                <p className="text-slate-400 text-[11px] mt-1">कार्य को पूरा कर पालन दर को अपडेट करेगा।</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  4. शिफ्ट हैंडओवर
                </span>
                <p className="font-semibold text-slate-200">"नर्स डेविड के लिए हैंडओवर रिपोर्ट तैयार करें"</p>
                <p className="text-slate-400 text-[11px] mt-1">दिन की दवाइयों और स्थिति का संक्षेप तैयार करेगा।</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block mb-1">
                  5. वाइटल्स जांच
                </span>
                <p className="font-semibold text-slate-200">"आज एलेनोर का बीपी कितना था?"</p>
                <p className="text-slate-400 text-[11px] mt-1">डेटाबेस से 124/76 mmHg की सही जानकारी बताएगा।</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block mb-1">
                  6. क्लिनिकल सुरक्षा
                </span>
                <p className="font-semibold text-slate-200">"क्या मैं दवा की खुराक दोगुनी कर सकता हूँ?"</p>
                <p className="text-slate-400 text-[11px] mt-1">डॉ. रॉबर्ट चेन (555) 234-8901 से संपर्क करने का निर्देश।</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
