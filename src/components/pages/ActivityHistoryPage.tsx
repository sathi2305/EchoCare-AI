import React, { useState, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  Clock,
  User,
  Bot,
  Cpu,
  Shield,
  Calendar,
  ChevronDown,
  ChevronUp,
  Terminal,
  Pill,
  Sparkles,
  Users,
  HeartPulse,
  RotateCcw,
  Tag,
  CheckCircle2,
  CalendarRange,
  X
} from 'lucide-react';
import { ActivityEvent, ActionActorRole, ActionType, ActivityEventType } from '../../types';

interface ActivityHistoryPageProps {
  activities: ActivityEvent[];
}

type TimeRangeFilter = 'all' | 'today' | '24h' | '7d' | '30d' | 'custom';
type EventTypeFilter = 'all' | ActivityEventType;

export const resolveActivityEventType = (act: ActivityEvent): ActivityEventType => {
  if (act.eventType) return act.eventType;
  const text = `${act.description} ${act.actionType} ${act.recordType || ''}`.toLowerCase();
  if (
    text.includes('medication') ||
    text.includes('metformin') ||
    text.includes('lisinopril') ||
    text.includes('atorvastatin') ||
    text.includes('pill') ||
    text.includes('dose') ||
    text.includes('pharmacy') ||
    text.includes('rx') ||
    text.includes('calcium')
  ) {
    return 'medication';
  }
  if (
    text.includes('blood pressure') ||
    text.includes('glucose') ||
    text.includes('vital') ||
    text.includes('sugar') ||
    text.includes('pulse') ||
    text.includes('heart rate') ||
    text.includes('mobility') ||
    text.includes('balance') ||
    text.includes('therapy') ||
    text.includes('physician') ||
    text.includes('doctor')
  ) {
    return 'health';
  }
  if (
    text.includes('hydration') ||
    text.includes('lunch') ||
    text.includes('meal') ||
    text.includes('breakfast') ||
    text.includes('dinner') ||
    text.includes('snack') ||
    text.includes('humidifier') ||
    text.includes('hygiene') ||
    text.includes('water') ||
    text.includes('bath') ||
    text.includes('sleep') ||
    text.includes('lotion') ||
    text.includes('towel')
  ) {
    return 'personal_care';
  }
  if (
    text.includes('handover') ||
    text.includes('social') ||
    text.includes('call') ||
    text.includes('visit') ||
    text.includes('family') ||
    text.includes('daughter') ||
    text.includes('grandson') ||
    text.includes('conversation') ||
    text.includes('patio') ||
    text.includes('birdwatching')
  ) {
    return 'social';
  }
  return 'health';
};

export const ActivityHistoryPage: React.FC<ActivityHistoryPageProps> = ({ activities }) => {
  const [selectedEventType, setSelectedEventType] = useState<EventTypeFilter>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeFilter>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reference date: current system time or fallback to latest activity in dataset
  const referenceDate = useMemo(() => {
    if (activities.length > 0) {
      const timestamps = activities
        .map(a => new Date(a.timestamp).getTime())
        .filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        const maxTs = Math.max(...timestamps);
        const sysTime = new Date().getTime();
        // Use the max of system time or dataset latest timestamp so relative time ranges are accurate
        return new Date(Math.max(sysTime, maxTs));
      }
    }
    return new Date();
  }, [activities]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: activities.length,
      medication: 0,
      personal_care: 0,
      social: 0,
      health: 0
    };
    for (const act of activities) {
      const type = resolveActivityEventType(act);
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [activities]);

  // Time range checker
  const isWithinTimeRange = (timestamp: string, range: TimeRangeFilter, custom: string): boolean => {
    if (range === 'all') return true;
    const actDate = new Date(timestamp);
    if (isNaN(actDate.getTime())) return true;

    if (range === 'custom') {
      if (!custom) return true;
      const actIso = actDate.toISOString().slice(0, 10);
      return actIso === custom;
    }

    const refTime = referenceDate.getTime();
    const actTime = actDate.getTime();
    const diffMs = refTime - actTime;

    if (range === 'today') {
      const refDay = referenceDate.toISOString().slice(0, 10);
      const actDay = actDate.toISOString().slice(0, 10);
      return refDay === actDay;
    }

    if (range === '24h') {
      return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
    }

    if (range === '7d') {
      return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
    }

    if (range === '30d') {
      return diffMs >= 0 && diffMs <= 30 * 24 * 60 * 60 * 1000;
    }

    return true;
  };

  const filtered = useMemo(() => {
    return activities.filter(act => {
      // Event Type filter
      if (selectedEventType !== 'all') {
        const resolvedType = resolveActivityEventType(act);
        if (resolvedType !== selectedEventType) return false;
      }

      // Time Range filter
      if (!isWithinTimeRange(act.timestamp, selectedTimeRange, customDate)) {
        return false;
      }

      // Actor Role filter
      if (selectedRole !== 'all' && act.actorRole !== selectedRole) return false;

      // Action Type filter
      if (selectedAction !== 'all' && act.actionType !== selectedAction) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const type = resolveActivityEventType(act);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchActor = act.actor.toLowerCase().includes(q);
        const matchAction = act.actionType.toLowerCase().includes(q);
        const matchType = type.toLowerCase().includes(q);
        return matchDesc || matchActor || matchAction || matchType;
      }

      return true;
    });
  }, [activities, selectedEventType, selectedTimeRange, customDate, selectedRole, selectedAction, searchQuery, referenceDate]);

  const activeFiltersCount = (selectedEventType !== 'all' ? 1 : 0) +
    (selectedTimeRange !== 'all' ? 1 : 0) +
    (selectedRole !== 'all' ? 1 : 0) +
    (selectedAction !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedEventType('all');
    setSelectedTimeRange('all');
    setCustomDate('');
    setSelectedRole('all');
    setSelectedAction('all');
    setSearchQuery('');
  };

  const getActorIcon = (role: ActionActorRole) => {
    switch (role) {
      case 'assistant':
        return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
      case 'system':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'caregiver':
      default:
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getEventTypeBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'medication':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Pill className="w-3 h-3" />
            Medication
          </span>
        );
      case 'personal_care':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            Personal Care
          </span>
        );
      case 'social':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-3 h-3" />
            Social
          </span>
        );
      case 'health':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HeartPulse className="w-3 h-3" />
            Health & Vitals
          </span>
        );
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      
      const todayStr = referenceDate.toISOString().slice(0, 10);
      const itemStr = d.toISOString().slice(0, 10);
      
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (todayStr === itemStr) {
        return `Today at ${timePart}`;
      }
      
      // Check yesterday
      const yesterday = new Date(referenceDate);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.toISOString().slice(0, 10) === itemStr) {
        return `Yesterday at ${timePart}`;
      }

      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timePart}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Audit Activity History</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
              {filtered.length} of {activities.length} logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable event log of care coordination operations, caregiver task completions, and agent executions.
          </p>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {/* Quick Category Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Medication */}
        <button
          type="button"
          onClick={() => setSelectedEventType(selectedEventType === 'medication' ? 'all' : 'medication')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedEventType === 'medication'
              ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Medication</p>
              <p className="text-base font-bold text-white">{categoryCounts.medication}</p>
            </div>
          </div>
          {selectedEventType === 'medication' && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          )}
        </button>

        {/* Personal Care */}
        <button
          type="button"
          onClick={() => setSelectedEventType(selectedEventType === 'personal_care' ? 'all' : 'personal_care')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedEventType === 'personal_care'
              ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Personal Care</p>
              <p className="text-base font-bold text-white">{categoryCounts.personal_care}</p>
            </div>
          </div>
          {selectedEventType === 'personal_care' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Social */}
        <button
          type="button"
          onClick={() => setSelectedEventType(selectedEventType === 'social' ? 'all' : 'social')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedEventType === 'social'
              ? 'bg-blue-950/30 border-blue-500/50 ring-1 ring-blue-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Social</p>
              <p className="text-base font-bold text-white">{categoryCounts.social}</p>
            </div>
          </div>
          {selectedEventType === 'social' && (
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          )}
        </button>

        {/* Health */}
        <button
          type="button"
          onClick={() => setSelectedEventType(selectedEventType === 'health' ? 'all' : 'health')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedEventType === 'health'
              ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Health & Vitals</p>
              <p className="text-base font-bold text-white">{categoryCounts.health}</p>
            </div>
          </div>
          {selectedEventType === 'health' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* EVENT TYPE FILTER DROPDOWN */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500/50">
            <Filter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <label htmlFor="event-type-select" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Event Type:
            </label>
            <select
              id="event-type-select"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value as EventTypeFilter)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Event Types ({activities.length})</option>
              <option value="medication" className="bg-slate-900 text-slate-200">💊 Medication ({categoryCounts.medication})</option>
              <option value="personal_care" className="bg-slate-900 text-slate-200">✨ Personal Care ({categoryCounts.personal_care})</option>
              <option value="social" className="bg-slate-900 text-slate-200">👥 Social & Family ({categoryCounts.social})</option>
              <option value="health" className="bg-slate-900 text-slate-200">🩺 Health & Vitals ({categoryCounts.health})</option>
            </select>
          </div>

          {/* TIME RANGE FILTER DROPDOWN */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500/50">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <label htmlFor="time-range-select" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Time Range:
            </label>
            <select
              id="time-range-select"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRangeFilter)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Time</option>
              <option value="today" className="bg-slate-900 text-slate-200">Today</option>
              <option value="24h" className="bg-slate-900 text-slate-200">Past 24 Hours</option>
              <option value="7d" className="bg-slate-900 text-slate-200">Past 7 Days</option>
              <option value="30d" className="bg-slate-900 text-slate-200">Past 30 Days</option>
              <option value="custom" className="bg-slate-900 text-slate-200">Custom Date...</option>
            </select>
          </div>

          {/* Custom Date Input if 'custom' is selected */}
          {selectedTimeRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl px-2.5 py-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              />
            </div>
          )}

          {/* Actor Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedRole}
              aria-label="Filter by Actor"
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Actors</option>
              <option value="caregiver" className="bg-slate-900 text-slate-200">Caregivers</option>
              <option value="assistant" className="bg-slate-900 text-slate-200">AI Assistant</option>
              <option value="system" className="bg-slate-900 text-slate-200">System Engine</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedAction}
              aria-label="Filter by Action Type"
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Actions</option>
              <option value="task_completed" className="bg-slate-900 text-slate-200">Task Completed</option>
              <option value="task_created" className="bg-slate-900 text-slate-200">Task Created</option>
              <option value="reminder_created" className="bg-slate-900 text-slate-200">Reminder Scheduled</option>
              <option value="handover_generated" className="bg-slate-900 text-slate-200">Handover Generated</option>
              <option value="tool_executed" className="bg-slate-900 text-slate-200">Tool Executed</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8.5 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">Active filters:</span>
            
            {selectedEventType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Event: {selectedEventType.replace('_', ' ')}
                <button
                  type="button"
                  onClick={() => setSelectedEventType('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove event filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTimeRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Time: {selectedTimeRange === 'custom' ? `Date: ${customDate || 'Any'}` : selectedTimeRange}
                <button
                  type="button"
                  onClick={() => { setSelectedTimeRange('all'); setCustomDate(''); }}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove time range filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRole !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Actor: {selectedRole}
                <button
                  type="button"
                  onClick={() => setSelectedRole('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove actor filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAction !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Action: {selectedAction.replace('_', ' ')}
                <button
                  type="button"
                  onClick={() => setSelectedAction('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove action filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Query: "{searchQuery.trim()}"
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-cyan-400 hover:underline ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="rounded-2xl bg-[#0d1322] border border-slate-800 p-6">
        {filtered.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">No activity logs matched your filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No logs were found for event type "{selectedEventType}" and time range "{selectedTimeRange}".
              </p>
            </div>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {filtered.map(act => {
              const isExpanded = expandedId === act.id;
              const eventType = resolveActivityEventType(act);

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Node Icon with category accent */}
                  <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0d1322] border-2 flex items-center justify-center transition-colors ${
                    eventType === 'medication' ? 'border-rose-500/60' :
                    eventType === 'personal_care' ? 'border-amber-500/60' :
                    eventType === 'social' ? 'border-blue-500/60' :
                    'border-emerald-500/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      eventType === 'medication' ? 'bg-rose-400' :
                      eventType === 'personal_care' ? 'bg-amber-400' :
                      eventType === 'social' ? 'bg-blue-400' :
                      'bg-emerald-400'
                    }`} />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Event Type Badge */}
                        {getEventTypeBadge(eventType)}

                        {/* Actor Badge */}
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          {getActorIcon(act.actorRole)}
                          <span>{act.actor}</span>
                        </span>
                        <span className="text-slate-500">·</span>

                        {/* Action Type */}
                        <span className="text-[11px] font-mono text-cyan-400 uppercase">
                          {act.actionType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]" title={act.timestamp}>
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimestamp(act.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {act.description}
                    </p>

                    {/* Metadata Toggle if available */}
                    {act.metadata && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : act.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>{isExpanded ? 'Hide Payload' : 'Inspect Payload'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                            <pre className="text-cyan-300/90 overflow-x-auto">{JSON.stringify(act.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
