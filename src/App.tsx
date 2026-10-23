import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './components/pages/OverviewPage';
import { AiAssistantPage } from './components/pages/AiAssistantPage';
import { ConversationsPage } from './components/pages/ConversationsPage';
import { CareTasksPage } from './components/pages/CareTasksPage';
import { RemindersPage } from './components/pages/RemindersPage';
import { HandoverPage } from './components/pages/HandoverPage';
import { ActivityHistoryPage } from './components/pages/ActivityHistoryPage';
import { McpInspectorPage } from './components/pages/McpInspectorPage';
import { ModelTrainingPage } from './components/pages/ModelTrainingPage';
import { VoiceLanguagesPage } from './components/pages/VoiceLanguagesPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { AlexaVoiceModal } from './components/voice/AlexaVoiceModal';
import { CareTask, Reminder, HandoverReport, ActivityEvent, CareProfile, UserSettings } from './types';
import { api } from './services/api';
import { Mic, Menu } from 'lucide-react';
import { audioManager } from './utils/audio';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './utils/i18n';

function AppContent() {
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('echocare_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('echocare_simple_mode') === 'true';
    }
    return false;
  });

  // Application Data States
  const [profile, setProfile] = useState<CareProfile | null>(null);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [handovers, setHandovers] = useState<HandoverReport[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('echocare_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleToggleSimpleMode = (enabled: boolean) => {
    setIsSimpleMode(enabled);
    localStorage.setItem('echocare_simple_mode', String(enabled));
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary();
      setProfile(summary.recipient);
      setTasks(summary.todayTasks);
      setReminders(summary.upcomingReminders);
      setActivities(summary.recentActivities);
      if (summary.recentHandover) {
        setHandovers([summary.recentHandover]);
      }

      // Fetch full collections in parallel
      const [allTasks, allReminders, allHandovers, allActivities, userSettings] = await Promise.all([
        api.getTasks(),
        api.getReminders(),
        api.getHandovers(),
        api.getActivities(),
        api.getSettings()
      ]);

      setTasks(allTasks);
      setReminders(allReminders);
      setHandovers(allHandovers);
      setActivities(allActivities);
      setSettings(userSettings);
    } catch (err: any) {
      console.warn('Backend loading warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCompleteTask = async (taskId: string) => {
    try {
      await api.completeTask(taskId, 'Sarah Jenkins', 'Completed via Quick Action');
      audioManager.playConfirmSound();
      loadAllData();
    } catch (err: any) {
      alert(`Could not complete task: ${err.message}`);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset all tasks, reminders, and activities to benchmark demo data?')) return;
    try {
      await api.resetDemoData();
      audioManager.playConfirmSound();
      await loadAllData();
      setCurrentTab('overview');
    } catch (err: any) {
      alert(`Error resetting demo: ${err.message}`);
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const activeRemindersCount = reminders.filter(r => r.isActive).length;

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans transition-colors ${
        theme === 'dark'
          ? 'bg-[#080c14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
          : 'bg-[#f8fafc] text-slate-850 selection:bg-cyan-200 selection:text-cyan-900'
      } ${isSimpleMode ? 'text-base' : 'text-sm'}`}
    >
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        profile={profile}
        pendingTasksCount={pendingCount}
        activeRemindersCount={activeRemindersCount}
        onResetDemo={handleResetDemo}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          profile={profile}
          pendingTasks={tasks.filter(t => t.status === 'pending')}
          onSearch={(q) => {
            setSearchFilter(q);
            if (q.trim() && currentTab === 'overview') {
              setCurrentTab('tasks');
            }
          }}
          onOpenAssistant={() => setCurrentTab('assistant')}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onQuickCompleteTask={handleQuickCompleteTask}
          onOpenVoiceSettings={() => setCurrentTab('voice-languages')}
        />

        {/* Viewport View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'overview' && (
            <OverviewPage
              profile={profile}
              tasks={tasks}
              reminders={reminders}
              activities={activities}
              recentHandover={handovers[0] || null}
              onOpenAssistant={() => setCurrentTab('assistant')}
              onQuickCompleteTask={handleQuickCompleteTask}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefreshData={loadAllData}
            />
          )}

          {currentTab === 'assistant' && (
            <AiAssistantPage
              onDataChanged={loadAllData}
              currentPageContext={currentTab}
              onNavigateToDashboard={() => setCurrentTab('overview')}
              onNavigateTab={(tab) => setCurrentTab(tab as any)}
            />
          )}

          {currentTab === 'conversations' && (
            <ConversationsPage
              onOpenConversationInAssistant={(sessId) => {
                setCurrentTab('assistant');
              }}
              onStartNewConversation={() => {
                setCurrentTab('assistant');
              }}
            />
          )}

          {currentTab === 'tasks' && (
            <CareTasksPage
              tasks={tasks}
              onRefreshTasks={loadAllData}
              onOpenAssistant={() => setCurrentTab('assistant')}
            />
          )}

          {currentTab === 'reminders' && (
            <RemindersPage
              reminders={reminders}
              onRefreshReminders={loadAllData}
              onOpenAssistant={() => setCurrentTab('assistant')}
            />
          )}

          {currentTab === 'handover' && (
            <HandoverPage
              handovers={handovers}
              tasks={tasks}
              onRefreshHandovers={loadAllData}
            />
          )}

          {currentTab === 'history' && (
            <ActivityHistoryPage
              activities={activities}
            />
          )}

          {currentTab === 'training' && (
            <ModelTrainingPage />
          )}

          {currentTab === 'voice-languages' && (
            <VoiceLanguagesPage />
          )}

          {currentTab === 'mcp' && (
            <McpInspectorPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              profile={profile}
              settings={settings}
              onRefreshAll={loadAllData}
              onResetDemo={handleResetDemo}
              isSimpleMode={isSimpleMode}
              onToggleSimpleMode={handleToggleSimpleMode}
            />
          )}
        </main>
      </div>

      {/* Floating Alexa-Style Voice Assistant Launcher */}
      <button
        onClick={() => setIsVoiceModalOpen(true)}
        className="fixed bottom-6 right-6 p-3.5 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 hover:scale-105 text-white shadow-xl shadow-cyan-950/70 border border-cyan-400/50 transition-all z-40 group flex items-center gap-2.5"
        title="Tap to speak with EchoCare Voice Assistant"
      >
        <div className="relative">
          <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
        </div>
        <span className="text-xs font-semibold pr-1.5 hidden sm:inline">Talk to EchoCare</span>
      </button>

      {/* Mobile Drawer Floating Toggle (when screen is narrow) */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="fixed bottom-6 left-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-white shadow-lg lg:hidden z-30"
        title="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Alexa-Style Voice Assistant HUD Modal */}
      <AlexaVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onDataChanged={loadAllData}
        onNavigateToDashboard={() => {
          setIsVoiceModalOpen(false);
          setCurrentTab('overview');
        }}
        onNavigateTab={(tab) => {
          setIsVoiceModalOpen(false);
          setCurrentTab(tab as any);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
