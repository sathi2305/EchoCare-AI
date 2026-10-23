import React from 'react';
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  CheckSquare,
  Bell,
  ClipboardList,
  History,
  Terminal,
  Settings,
  HeartPulse,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Languages,
  X
} from 'lucide-react';
import { CareProfile } from '../../types';
import { useLanguage } from '../../utils/i18n';

export type NavTab = 
  | 'overview' 
  | 'assistant' 
  | 'conversations'
  | 'tasks' 
  | 'reminders' 
  | 'handover' 
  | 'history' 
  | 'training'
  | 'voice-languages'
  | 'mcp'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: CareProfile | null;
  pendingTasksCount: number;
  activeRemindersCount: number;
  onResetDemo: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  pendingTasksCount,
  activeRemindersCount,
  onResetDemo,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'overview' as NavTab,
      labelKey: 'nav_overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'assistant' as NavTab,
      labelKey: 'nav_assistant',
      icon: Bot,
      badge: 'Alexa'
    },
    {
      id: 'conversations' as NavTab,
      labelKey: 'nav_conversations',
      icon: MessageSquare,
      badge: null
    },
    {
      id: 'tasks' as NavTab,
      labelKey: 'nav_tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : null
    },
    {
      id: 'reminders' as NavTab,
      labelKey: 'nav_reminders',
      icon: Bell,
      badge: activeRemindersCount > 0 ? String(activeRemindersCount) : null
    },
    {
      id: 'handover' as NavTab,
      labelKey: 'nav_handover',
      icon: ClipboardList,
      badge: null
    },
    {
      id: 'history' as NavTab,
      labelKey: 'nav_history',
      icon: History,
      badge: null
    },
    {
      id: 'training' as NavTab,
      labelKey: 'nav_training',
      icon: Cpu,
      badge: 'LoRA'
    },
    {
      id: 'voice-languages' as NavTab,
      labelKey: 'nav_voice',
      icon: Languages,
      badge: '6 Langs'
    },
    {
      id: 'mcp' as NavTab,
      labelKey: 'MCP Inspector',
      icon: Terminal,
      badge: null,
      customLabel: 'MCP Tools'
    },
    {
      id: 'settings' as NavTab,
      labelKey: 'nav_settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:relative inset-y-0 left-0 flex flex-col bg-[#090d16] light:bg-slate-900 border-r border-slate-800/80 light:border-slate-800 transition-all duration-300 z-50 shrink-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${isMobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-4 sm:px-5 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
                    EchoCare<span className="text-cyan-400 font-semibold">AI</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Multilingual Voice Coordinator
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {/* Collapse toggle (desktop only) */}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors hidden lg:flex"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Close button on mobile */}
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 font-mono">
              Care & Intelligence
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const label = item.customLabel || t(item.labelKey);

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/50 text-cyan-300 border border-cyan-800/60 shadow-sm shadow-cyan-950/60 ring-1 ring-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
                title={isCollapsed ? label : undefined}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tabular-nums ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Care Recipient Profile & Demo Reset Footer */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-800/60 space-y-2 bg-[#060a12]/80 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
              <img
                src="/src/assets/images/avatar_senior_eleanor_1792634136570.jpg"
                alt="Eleanor Vance"
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-purple-500/40 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {profile?.fullName || 'Eleanor Vance'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Age {profile?.age || 78} · {profile?.relationship || 'Mother'}
                </p>
              </div>
            </div>

            <button
              onClick={onResetDemo}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-cyan-300 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800 rounded-lg transition-colors"
              title="Reset database to benchmark demonstration data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reset_demo')}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800 flex flex-col items-center gap-2 shrink-0">
            <img
              src="/src/assets/images/avatar_senior_eleanor_1792634136570.jpg"
              alt="Eleanor Vance"
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-purple-500/40"
              title="Eleanor Vance (Care Recipient)"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onResetDemo}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              title="Reset Demo Records"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
