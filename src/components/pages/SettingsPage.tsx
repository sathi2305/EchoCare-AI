import React, { useState } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Bot,
  Volume2,
  Languages,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Server,
  HeartPulse,
  Save,
  Sun,
  Moon,
  Trash2,
  Cpu,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { CareProfile, UserSettings } from '../../types';
import { api } from '../../services/api';
import { audioManager } from '../../utils/audio';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';
import { conversationStorage } from '../../services/conversationStorage';

interface SettingsPageProps {
  profile: CareProfile | null;
  settings: UserSettings | null;
  onRefreshAll: () => void;
  onResetDemo: () => void;
  isSimpleMode?: boolean;
  onToggleSimpleMode?: (enabled: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  settings,
  onRefreshAll,
  onResetDemo,
  isSimpleMode = false,
  onToggleSimpleMode
}) => {
  const { language, setLanguage, currentLangInfo, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState<CareProfile>(
    profile || {
      id: 'profile-eleanor-vance',
      fullName: 'Eleanor Vance',
      preferredName: 'Eleanor',
      age: 78,
      relationship: 'Mother',
      roomNumber: 'Suite 2B',
      conditions: ['Type 2 Diabetes', 'Essential Hypertension'],
      allergies: ['Penicillin'],
      bloodPressureGoal: '< 130/80 mmHg',
      bloodSugarGoal: '90 - 130 mg/dL',
      primaryPhysician: 'Dr. Robert Chen, MD',
      physicianPhone: '(555) 234-8901',
      emergencyContact: 'Sarah Jenkins (Daughter)',
      emergencyPhone: '(555) 892-4411',
      pharmacy: 'CVS Care Pharmacy - Pine St.',
      caregivers: []
    }
  );

  const [localSettings, setLocalSettings] = useState<UserSettings>(
    settings || {
      language: 'en',
      theme: 'dark',
      voiceEnabled: true,
      soundVolume: 0.8,
      requireConfirmations: true,
      autoHandoverEnabled: true,
      aiProvider: 'deterministic',
      geminiModel: 'Qwen2.5-0.5B-LoRA',
      simpleMode: isSimpleMode
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile(formData);
      await api.updateSettings(localSettings);
      setSavedSuccess(true);
      audioManager.playConfirmSound();
      setTimeout(() => setSavedSuccess(false), 2500);
      onRefreshAll();
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    }
  };

  const handleClearConversations = () => {
    if (confirm('Are you sure you want to delete all stored conversation history?')) {
      conversationStorage.clearAll();
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 light:border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>EchoCare AI Settings & Preferences</span>
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Appearance, multilingual voice parameters, AI clinical safeguards, and privacy controls
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all hover:scale-[1.02]"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Settings and care profile updated successfully!</span>
        </div>
      )}

      {historyCleared && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>All conversation transcripts have been safely cleared.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Appearance & Theme */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 light:border-slate-200">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white light:text-slate-900">Appearance & Display</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 light:text-slate-700 font-medium mb-1.5">Color Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    theme === 'dark'
                      ? 'bg-cyan-950/80 border-cyan-500 text-white font-semibold ring-1 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4 text-cyan-400" />
                  <span>Dark AI Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    theme === 'light'
                      ? 'bg-slate-100 border-cyan-600 text-slate-900 font-semibold ring-1 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Studio</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 light:text-slate-700 font-medium mb-1.5">Easy Mode for Seniors (Simple Mode)</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <span className="text-slate-300 light:text-slate-700 text-xs">Enlarge buttons, higher contrast, spoken confirmations</span>
                <input
                  type="checkbox"
                  checked={localSettings.simpleMode || isSimpleMode}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, simpleMode: e.target.checked });
                    if (onToggleSimpleMode) onToggleSimpleMode(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Multilingual Voice & Speech */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 light:border-slate-200">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white light:text-slate-900">Voice Assistant & Languages</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 light:text-slate-700 font-medium mb-1.5">Primary Voice Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} — {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 light:text-slate-700 font-medium mb-1.5">Spoken Audio Playback</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
                <span className="text-slate-300 light:text-slate-700 text-xs">Read responses aloud automatically</span>
                <input
                  type="checkbox"
                  checked={localSettings.voiceEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, voiceEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-xs">
            <div>
              <p className="font-semibold text-white light:text-slate-900">Wake-Word Detection ("EchoCare" / "Hey Echo")</p>
              <p className="text-slate-400 text-[11px]">Allow voice assistant to activate when speaking the wake word</p>
            </div>
            <input
              type="checkbox"
              checked={wakeWordEnabled}
              onChange={(e) => setWakeWordEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Section 3: Care Recipient Profile */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 light:border-slate-200">
            <HeartPulse className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white light:text-slate-900">Care Recipient Clinical Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Room / Suite</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Blood Pressure Goal</label>
              <input
                type="text"
                value={formData.bloodPressureGoal}
                onChange={(e) => setFormData({ ...formData, bloodPressureGoal: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Blood Glucose Goal</label>
              <input
                type="text"
                value={formData.bloodSugarGoal}
                onChange={(e) => setFormData({ ...formData, bloodSugarGoal: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Primary Physician</label>
              <input
                type="text"
                value={formData.primaryPhysician}
                onChange={(e) => setFormData({ ...formData, primaryPhysician: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Physician Phone (Refusal Escalation)</label>
              <input
                type="text"
                value={formData.physicianPhone}
                onChange={(e) => setFormData({ ...formData, physicianPhone: e.target.value })}
                className="w-full bg-slate-900 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl px-3 py-2 text-white light:text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Privacy & Stored Data Management */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 light:border-slate-200">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white light:text-slate-900">Privacy, Retention & Data Clearing</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
              <div>
                <p className="font-semibold text-white light:text-slate-900">Clear Stored Conversation History</p>
                <p className="text-slate-400 text-[11px]">Permanently removes local session transcripts and speech turns</p>
              </div>
              <button
                type="button"
                onClick={handleClearConversations}
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800 light:border-slate-200">
              <div>
                <p className="font-semibold text-white light:text-slate-900">Reset Demonstration Benchmark Records</p>
                <p className="text-slate-400 text-[11px]">Restore initial tasks, medications, reminders, and activities</p>
              </div>
              <button
                type="button"
                onClick={onResetDemo}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
