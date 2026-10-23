import React from 'react';
import {
  CheckCircle2,
  Clock,
  Bell,
  HeartPulse,
  Activity,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck,
  Volume2,
  ShieldCheck,
  Check,
  ChevronRight,
  MessageSquare,
  Globe
} from 'lucide-react';
import { CareTask, Reminder, ActivityEvent, CareProfile, HandoverReport } from '../../types';
import { OneTapVoiceBar } from '../voice/OneTapVoiceBar';
import { audioManager } from '../../utils/audio';
import { useLanguage } from '../../utils/i18n';
import { conversationStorage } from '../../services/conversationStorage';
import { DailyCareGoals } from '../dashboard/DailyCareGoals';
import { DailyWellnessCheck } from '../dashboard/DailyWellnessCheck';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface OverviewPageProps {
  profile: CareProfile | null;
  tasks: CareTask[];
  reminders: Reminder[];
  activities: ActivityEvent[];
  recentHandover: HandoverReport | null;
  onOpenAssistant: () => void;
  onQuickCompleteTask: (taskId: string) => void;
  onNavigateTab: (tab: any) => void;
  onRefreshData?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  profile,
  tasks,
  reminders,
  activities,
  recentHandover,
  onOpenAssistant,
  onQuickCompleteTask,
  onNavigateTab,
  onRefreshData
}) => {
  const { t, currentLangInfo } = useLanguage();
  const today = '2026-10-20';
  const todayTasks = tasks.filter(t => t.dueDate === today);
  const completedToday = todayTasks.filter(t => t.status === 'completed');
  const pendingToday = todayTasks.filter(t => t.status === 'pending');
  const activeReminders = reminders.filter(r => r.isActive);
  const completionRate = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

  // Recent conversations from storage
  const recentSessions = conversationStorage.getSessions().slice(0, 3);

  // Chart data for daily care timeline by hour
  const timelineData = [
    { hour: '08:00', label: '8 AM', tasks: 2, completed: 2, name: 'Glucose & Morning Meds' },
    { hour: '11:00', label: '11 AM', tasks: 1, completed: 1, name: 'Mobility Walk' },
    { hour: '12:30', label: '12:30 PM', tasks: 1, completed: 1, name: 'Lunch & Hydration' },
    { hour: '15:30', label: '3:30 PM', tasks: 1, completed: 1, name: 'Blood Pressure' },
    { hour: '19:30', label: '7:30 PM', tasks: 1, completed: 0, name: 'Evening Medication' },
    { hour: '21:00', label: '9 PM', tasks: 1, completed: 0, name: 'Night Humidifier' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Non-emergency Medical Disclaimer Notice */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 light:text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-200 light:text-slate-800">EchoCare AI Assistant:</strong> Proactive home care coordinator. Clinical safety guardrails active with Dr. Robert Chen at (555) 234-8901.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-cyan-400">
            {t('status_proactive_online')}
          </span>
        </div>
      </div>

      {/* Prominent One-Tap Voice Assistant Hero Bar */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white light:text-slate-900">
              {t('assistant_title')}
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-500">
              {t('assistant_subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Speaking in:</span>
            <span className="font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800">
              {currentLangInfo.name} ({currentLangInfo.nativeName.split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Real One-Tap Alexa-Style Voice Bar */}
        <OneTapVoiceBar
          onDataChanged={() => {
            if (onRefreshData) onRefreshData();
          }}
          onOpenCheatSheet={() => onNavigateTab('voice-languages')}
        />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('tasks_due_today')}</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white light:text-slate-900 tabular-nums">{todayTasks.length}</span>
            <span className="text-xs text-slate-400">{t('scheduled')}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {completedToday.length} {t('completed')} · {pendingToday.length} {t('pending')}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('adherence_rate')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 tabular-nums">{completionRate}%</span>
            <span className="text-xs text-slate-400">{t('on_target')}</span>
          </div>
          <div className="w-full bg-slate-800 light:bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('active_reminders')}</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white light:text-slate-900 tabular-nums">{activeReminders.length}</span>
            <span className="text-xs text-slate-400">alerts active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Next alert: 19:30 (Evening Meds)
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Assistant Interactions</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white light:text-slate-900 tabular-nums">{activities.length}</span>
            <span className="text-xs text-slate-400">logged events</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            Last: Glucose recorded (112 mg/dL)
          </div>
        </div>
      </div>

      {/* Daily Wellness Check: Morning Mood & Physical Condition Score */}
      <DailyWellnessCheck
        profile={profile}
        activities={activities}
        onRefreshData={onRefreshData}
      />

      {/* Daily Care Goals: Hydration, Medication Adherence & Exercise with Circular Progress */}
      <DailyCareGoals
        tasks={tasks}
        onQuickCompleteTask={onQuickCompleteTask}
        onNavigateTab={onNavigateTab}
      />

      {/* Main Grid: Care Timeline & Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Care Schedule & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline Chart Card */}
          <div className="p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white light:text-slate-900">Daily Care Schedule & Adherence</h3>
                <p className="text-xs text-slate-400">Completed vs scheduled activities across today</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                  Scheduled
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Completed
                </span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="tasks" fill="#0284c7" radius={[4, 4, 0, 0]} name="Scheduled" />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Tasks List Card */}
          <div className="p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white light:text-slate-900">Today's Care Tasks</h3>
                <p className="text-xs text-slate-400">{completedToday.length} of {todayTasks.length} tasks recorded</p>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>{t('view_all')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {todayTasks.map(task => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isCompleted
                        ? 'bg-slate-900/40 light:bg-slate-50 border-slate-800/60 light:border-slate-200 opacity-80'
                        : 'bg-slate-900/90 light:bg-white border-slate-800 light:border-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => !isCompleted && onQuickCompleteTask(task.id)}
                        disabled={isCompleted}
                        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'border border-slate-600 hover:border-cyan-400 text-transparent hover:text-cyan-400'
                        }`}
                        title={isCompleted ? 'Completed' : 'Click to mark complete'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white light:text-slate-900 truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {task.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {task.description}
                        </p>
                        {task.notes && (
                          <p className="mt-1 text-[11px] text-cyan-300 font-mono">
                            Observation: {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1 text-xs text-slate-300 light:text-slate-700 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.dueTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {task.assignedTo.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Conversations, Reminders & Care Team */}
        <div className="space-y-6">
          {/* Recent Spoken Conversations Snippet */}
          <div className="p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white light:text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Recent Conversations</span>
              </h3>
              <button
                onClick={() => onNavigateTab('conversations')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentSessions.map(sess => (
                <div
                  key={sess.id}
                  onClick={() => onNavigateTab('conversations')}
                  className="p-3 rounded-xl bg-slate-900/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 hover:border-cyan-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-200 light:text-slate-800 truncate">
                      {sess.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {sess.languageLabel.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    "{sess.lastMessageSnippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Home Reminders Card */}
          <div className="p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white light:text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Active Home Reminders</span>
              </h3>
              <button
                onClick={() => audioManager.playReminderChime()}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                title="Test audio chime"
              >
                <Volume2 className="w-3 h-3" />
                <span>Test chime</span>
              </button>
            </div>

            <div className="space-y-2">
              {activeReminders.slice(0, 4).map(rem => (
                <div
                  key={rem.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-slate-200 light:text-slate-800 truncate">{rem.title}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{rem.category} · {rem.frequency}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-cyan-300 light:text-cyan-700 shrink-0">
                    {rem.time}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('reminders')}
              className="mt-3 w-full py-2 text-center text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              {t('manage_reminders')} →
            </button>
          </div>

          {/* Care Team on Duty Card */}
          <div className="p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200">
            <h3 className="text-sm font-semibold text-white light:text-slate-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Care Team on Duty</span>
            </h3>

            <div className="space-y-3">
              {profile?.caregivers.map(cg => (
                <div key={cg.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {cg.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 light:text-slate-800 truncate">{cg.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{cg.role}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono shrink-0">
                    {cg.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Handover Snippet Card */}
          {recentHandover && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0d1627] to-[#0d1322] light:bg-cyan-50/50 border border-cyan-900/40 light:border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Latest Shift Handover
                </span>
                <span className="text-[10px] text-slate-400 font-mono">15:15 Today</span>
              </div>
              <h4 className="text-xs font-semibold text-white light:text-slate-900">{recentHandover.shiftTime}</h4>
              <p className="mt-1 text-xs text-slate-300 light:text-slate-700 leading-relaxed line-clamp-3">
                "{recentHandover.clinicalNotes}"
              </p>
              <button
                onClick={() => onNavigateTab('handover')}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>Read complete handover</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
