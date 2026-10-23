import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Clock,
  Sparkles,
  Mic,
  X,
  Sun,
  Moon,
  Globe,
  Cpu,
  CheckCircle,
  Activity
} from 'lucide-react';
import { CareProfile, CareTask } from '../../types';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

interface HeaderProps {
  profile: CareProfile | null;
  pendingTasks: CareTask[];
  onSearch: (query: string) => void;
  onOpenAssistant: () => void;
  onOpenVoiceModal: () => void;
  onQuickCompleteTask: (taskId: string) => void;
  onOpenVoiceSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  pendingTasks,
  onSearch,
  onOpenAssistant,
  onOpenVoiceModal,
  onQuickCompleteTask,
  onOpenVoiceSettings
}) => {
  const { language, setLanguage, currentLangInfo, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [modelHealth, setModelHealth] = useState<{ status: string; baseModel: string; isAdapterLoaded: boolean } | null>(null);

  // Time and dynamic greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening');

  useEffect(() => {
    // Check model health from real backend
    api.getModelHealth()
      .then(res => setModelHealth(res))
      .catch(() => setModelHealth(null));
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const urgentPending = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

  return (
    <header className="h-18 px-4 sm:px-6 bg-[#080c14]/90 dark:bg-[#080c14]/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors">
      {/* Zone 1: Brand / Contextual Greeting */}
      <div className="flex items-center gap-3 shrink-0">
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
            <span>{greeting}, Sarah</span>
            <span className="hidden md:inline-block text-xs text-cyan-400 font-normal">
              · {t('primary_caregiver')}
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 light:text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
            {t('coordinating_for')} {profile?.fullName || 'Eleanor Vance'} · Home Suite
          </p>
        </div>
      </div>

      {/* Zone 2: Universal Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')}
            className="w-full bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 focus:border-cyan-500/70 rounded-xl pl-9.5 pr-8 py-2 text-xs text-slate-200 light:text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Verified System Status, Language, Theme, Voice, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Model Status Tag */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-[11px] font-mono text-slate-300 light:text-slate-700"
          title={`LLM Engine: ${modelHealth?.baseModel || 'Qwen2.5-0.5B'} with LoRA Adapter`}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>{modelHealth?.isAdapterLoaded ? 'Qwen2.5 LoRA' : 'LLM Engine'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-xs text-slate-200 light:text-slate-800 hover:border-slate-700 transition-colors"
            title="Switch Language"
          >
            <span>{currentLangInfo.flag}</span>
            <span className="font-medium hidden sm:inline">{currentLangInfo.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-800/80 light:border-slate-100 mb-1">
                Select Language
              </div>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    language === lang.code
                      ? 'bg-cyan-950/70 light:bg-cyan-50 text-cyan-300 light:text-cyan-800 font-semibold'
                      : 'text-slate-300 light:text-slate-700 hover:bg-slate-800/50 light:hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{lang.nativeName.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Alexa-Style Voice Assistant Launcher Button */}
        <button
          onClick={onOpenVoiceModal}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all hover:scale-[1.03]"
          title="Open Alexa-Style Voice Assistant"
        >
          <div className="relative">
            <Mic className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
          </div>
          <span className="hidden sm:inline">{t('voice_assistant_btn')}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-700 hover:text-white transition-colors"
            title="Care Alerts and Pending Items"
          >
            <Bell className="w-4 h-4" />
            {urgentPending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 flex items-center justify-center tabular-nums">
                {urgentPending.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white light:text-slate-900">Priority Reminders</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {urgentPending.length} pending
                </span>
              </div>

              {urgentPending.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 light:text-slate-600">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  All scheduled priority care tasks are up to date!
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {urgentPending.map(task => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-slate-900/90 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                            {task.priority}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.dueTime}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 light:text-slate-800 truncate">{task.title}</p>
                      </div>
                      <button
                        onClick={() => {
                          onQuickCompleteTask(task.id);
                          setShowNotifications(false);
                        }}
                        className="text-[10px] px-2 py-1 bg-cyan-950 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 hover:bg-cyan-900 border border-cyan-800 light:border-cyan-300 rounded-lg shrink-0"
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Avatar with Image */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-300 hover:border-slate-700 transition-colors"
          >
            <img
              src="/src/assets/images/avatar_caregiver_sarah_1792634137255.jpg"
              alt="Sarah Jenkins, Primary Caregiver"
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-500/40"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-semibold text-slate-200 light:text-slate-800 hidden sm:inline">Sarah J.</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
                <img
                  src="/src/assets/images/avatar_caregiver_sarah_1792634137255.jpg"
                  alt="Sarah Jenkins"
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/50"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm font-semibold text-white light:text-slate-900">Sarah Jenkins</p>
                  <p className="text-xs text-slate-400 light:text-slate-500">{t('primary_caregiver')}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-300 light:text-slate-700">
                  <span className="text-slate-400 light:text-slate-500">Care Recipient:</span>
                  <span className="font-medium text-white light:text-slate-900">{profile?.fullName}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300 light:text-slate-700">
                  <span className="text-slate-400 light:text-slate-500">Active Shift:</span>
                  <span className="font-medium text-cyan-400">Day Shift Primary</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300 light:text-slate-700">
                  <span className="text-slate-400 light:text-slate-500">Voice Language:</span>
                  <span className="font-semibold text-slate-200 light:text-slate-800">{currentLangInfo.name}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 light:border-slate-200">
                <p className="text-[10px] text-slate-500 font-mono">
                  EchoCare AI · Custom Qwen2.5-0.5B LoRA
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
