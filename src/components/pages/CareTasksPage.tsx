import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Filter,
  Search,
  AlertCircle,
  Calendar,
  Check,
  X,
  FileText,
  Activity,
  HeartPulse,
  Pill,
  Apple,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { CareTask, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { api } from '../../services/api';

interface CareTasksPageProps {
  tasks: CareTask[];
  onRefreshTasks: () => void;
  onOpenAssistant: () => void;
}

type SortOption = 'priority_desc' | 'priority_asc' | 'time_asc' | 'time_desc' | 'title_asc';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

export const PriorityIndicator: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-sm shadow-rose-950/40"
          title="Priority Level: Urgent / Critical"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Urgent</span>
          </span>
          {/* Signal Level Indicator: 4 bars */}
          <span className="flex items-end gap-0.5 ml-0.5 h-3" aria-hidden="true">
            <span className="w-0.5 h-1.5 bg-rose-400 rounded-full" />
            <span className="w-0.5 h-2 bg-rose-400 rounded-full" />
            <span className="w-0.5 h-2.5 bg-rose-400 rounded-full" />
            <span className="w-0.5 h-3 bg-rose-400 rounded-full" />
          </span>
        </span>
      );
    case 'high':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-950/40"
          title="Priority Level: High"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>High</span>
          </span>
          {/* Signal Level Indicator: 3 bars */}
          <span className="flex items-end gap-0.5 ml-0.5 h-3" aria-hidden="true">
            <span className="w-0.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="w-0.5 h-2 bg-amber-400 rounded-full" />
            <span className="w-0.5 h-3 bg-amber-400 rounded-full" />
            <span className="w-0.5 h-3 bg-slate-700/80 rounded-full" />
          </span>
        </span>
      );
    case 'medium':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase bg-sky-500/15 border border-sky-500/30 text-sky-300 shadow-sm"
          title="Priority Level: Medium"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Medium</span>
          </span>
          {/* Signal Level Indicator: 2 bars */}
          <span className="flex items-end gap-0.5 ml-0.5 h-3" aria-hidden="true">
            <span className="w-0.5 h-1.5 bg-sky-400 rounded-full" />
            <span className="w-0.5 h-2.5 bg-sky-400 rounded-full" />
            <span className="w-0.5 h-2.5 bg-slate-700/80 rounded-full" />
            <span className="w-0.5 h-3 bg-slate-700/80 rounded-full" />
          </span>
        </span>
      );
    case 'low':
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase bg-slate-800/90 border border-slate-700 text-slate-300 shadow-sm"
          title="Priority Level: Low"
        >
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Low</span>
          </span>
          {/* Signal Level Indicator: 1 bar */}
          <span className="flex items-end gap-0.5 ml-0.5 h-3" aria-hidden="true">
            <span className="w-0.5 h-1.5 bg-slate-400 rounded-full" />
            <span className="w-0.5 h-2 bg-slate-700/80 rounded-full" />
            <span className="w-0.5 h-2.5 bg-slate-700/80 rounded-full" />
            <span className="w-0.5 h-3 bg-slate-700/80 rounded-full" />
          </span>
        </span>
      );
  }
};

export const CareTasksPage: React.FC<CareTasksPageProps> = ({
  tasks,
  onRefreshTasks,
  onOpenAssistant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<CareTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [cancellingTask, setCancellingTask] = useState<CareTask | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Form states for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('medication');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignedTo, setNewAssignedTo] = useState('Sarah Jenkins');
  const [newDueDate, setNewDueDate] = useState('2026-10-20');
  const [newDueTime, setNewDueTime] = useState('16:00');
  const [newReminderLinked, setNewReminderLinked] = useState(true);

  // Counts by priority
  const priorityCounts = useMemo(() => {
    return {
      all: tasks.length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.assignedTo.toLowerCase().includes(q) ||
          task.priority.toLowerCase().includes(q) ||
          task.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, selectedCategory, selectedStatus, selectedPriority, searchQuery]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'priority_desc') {
        const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        if (diff !== 0) return diff;
        return a.dueTime.localeCompare(b.dueTime);
      }
      if (sortBy === 'priority_asc') {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (diff !== 0) return diff;
        return a.dueTime.localeCompare(b.dueTime);
      }
      if (sortBy === 'time_asc') {
        const timeDiff = a.dueTime.localeCompare(b.dueTime);
        if (timeDiff !== 0) return timeDiff;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      if (sortBy === 'time_desc') {
        const timeDiff = b.dueTime.localeCompare(a.dueTime);
        if (timeDiff !== 0) return timeDiff;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredTasks, sortBy]);

  const categories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'medication', label: 'Medications' },
    { id: 'vital_signs', label: 'Vital Signs' },
    { id: 'physical_therapy', label: 'Mobility & PT' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'hygiene', label: 'Hygiene & Comfort' },
    { id: 'appointment', label: 'Appointments' }
  ];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createTask({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        assignedTo: newAssignedTo,
        dueDate: newDueDate,
        dueTime: newDueTime,
        reminderLinked: newReminderLinked
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      onRefreshTasks();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completingTask) return;
    try {
      await api.completeTask(completingTask.id, 'Sarah Jenkins', completionNotes);
      setCompletingTask(null);
      setCompletionNotes('');
      onRefreshTasks();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingTask) return;
    try {
      await api.cancelTask(cancellingTask.id, cancellationReason || 'Caregiver cancelled');
      setCancellingTask(null);
      setCancellationReason('');
      onRefreshTasks();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedPriority !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSearchQuery('');
    setSortBy('priority_desc');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Care Tasks Coordination</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
              {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Daily clinical routines, medications, and physical therapy schedule with priority levels and custom sorting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Assistant to Schedule</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Care Task</span>
          </button>
        </div>
      </div>

      {/* Priority Level Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Urgent & Critical */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'urgent' ? 'all' : 'urgent')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedPriority === 'urgent'
              ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Urgent Priority</p>
              <p className="text-base font-bold text-white">{priorityCounts.urgent}</p>
            </div>
          </div>
          {selectedPriority === 'urgent' && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          )}
        </button>

        {/* High Priority */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'high' ? 'all' : 'high')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedPriority === 'high'
              ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">High Priority</p>
              <p className="text-base font-bold text-white">{priorityCounts.high}</p>
            </div>
          </div>
          {selectedPriority === 'high' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Medium Priority */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'medium' ? 'all' : 'medium')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedPriority === 'medium'
              ? 'bg-sky-950/30 border-sky-500/50 ring-1 ring-sky-500/30'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Medium Priority</p>
              <p className="text-base font-bold text-white">{priorityCounts.medium}</p>
            </div>
          </div>
          {selectedPriority === 'medium' && (
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          )}
        </button>

        {/* Low Priority */}
        <button
          type="button"
          onClick={() => setSelectedPriority(selectedPriority === 'low' ? 'all' : 'low')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
            selectedPriority === 'low'
              ? 'bg-slate-800/60 border-slate-600 ring-1 ring-slate-600'
              : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Low Priority</p>
              <p className="text-base font-bold text-white">{priorityCounts.low}</p>
            </div>
          </div>
          {selectedPriority === 'low' && (
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Filter, Sort, and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full p-1 bg-slate-900 rounded-xl">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Controls Row: Priority Filter, Sort Dropdown, Status Filter, Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* PRIORITY SORT DROPDOWN */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500/50">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label htmlFor="task-sort-by" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Sort:
              </label>
              <select
                id="task-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="priority_desc" className="bg-slate-900 text-slate-200">Priority: Highest First</option>
                <option value="priority_asc" className="bg-slate-900 text-slate-200">Priority: Lowest First</option>
                <option value="time_asc" className="bg-slate-900 text-slate-200">Schedule: Earliest First</option>
                <option value="time_desc" className="bg-slate-900 text-slate-200">Schedule: Latest First</option>
                <option value="title_asc" className="bg-slate-900 text-slate-200">Task Title: A → Z</option>
              </select>
            </div>

            {/* PRIORITY FILTER DROPDOWN */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500/50">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label htmlFor="task-priority-filter" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Priority:
              </label>
              <select
                id="task-priority-filter"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Priorities ({tasks.length})</option>
                <option value="urgent" className="bg-slate-900 text-slate-200">🚨 Urgent ({priorityCounts.urgent})</option>
                <option value="high" className="bg-slate-900 text-slate-200">⚠️ High ({priorityCounts.high})</option>
                <option value="medium" className="bg-slate-900 text-slate-200">⚡ Medium ({priorityCounts.medium})</option>
                <option value="low" className="bg-slate-900 text-slate-200">⏱️ Low ({priorityCounts.low})</option>
              </select>
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter tasks by status"
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Statuses</option>
                <option value="pending" className="bg-slate-900 text-slate-200">Pending</option>
                <option value="completed" className="bg-slate-900 text-slate-200">Completed</option>
                <option value="cancelled" className="bg-slate-900 text-slate-200">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, instruction, caregiver, priority..."
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
            
            {selectedPriority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Priority: {selectedPriority.toUpperCase()}
                <button
                  type="button"
                  onClick={() => setSelectedPriority('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove priority filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Category: {selectedCategory.replace('_', ' ')}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 text-[11px]">
                Status: {selectedStatus}
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove status filter"
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
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Tasks Grid / List */}
      {sortedTasks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0d1322] border border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No care tasks found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your priority, category, or status filters, or create a new care task using the button above.
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isCancelled = task.status === 'cancelled';

            // Left border accent reflecting priority level
            const priorityBorderAccent = {
              urgent: 'border-l-4 border-l-rose-500',
              high: 'border-l-4 border-l-amber-500',
              medium: 'border-l-4 border-l-sky-500',
              low: 'border-l-4 border-l-slate-600'
            }[task.priority];

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${priorityBorderAccent} ${
                  isCompleted
                    ? 'bg-[#0b101c]/60 border-slate-800/60 opacity-85'
                    : isCancelled
                    ? 'bg-[#0b101c]/40 border-slate-800/40 opacity-60'
                    : 'bg-[#0d1322] border-slate-800 hover:border-slate-700 shadow-lg shadow-black/20'
                }`}
              >
                <div>
                  {/* Top line metadata: Priority Visual Indicator & Category & Schedule */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-3">
                    <div className="flex items-center gap-2">
                      {/* Rich Priority Visual Indicator */}
                      <PriorityIndicator priority={task.priority} />

                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                        {task.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{task.dueTime}</span>
                      <span className="text-slate-400 text-[11px]">({task.dueDate})</span>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className={`text-sm font-semibold ${isCompleted ? 'text-slate-300 line-through' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Notes / Clinical Observations */}
                  {task.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                      <span className="text-cyan-400 font-semibold font-mono">Recorded Observation: </span>
                      <span className="text-slate-300">{task.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer details & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.assignedTo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isCancelled && (
                      <>
                        <button
                          onClick={() => setCompletingTask(task)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => setCancellingTask(task)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Cancel task"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}

                    {isCancelled && (
                      <span className="text-rose-400 font-medium flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-semibold text-white">Create New Care Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Evening Blood Pressure Check or Hydration Routine"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Instructions / Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide clinical steps or guidance for the assigned caregiver..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="medication">Medication</option>
                    <option value="vital_signs">Vital Signs</option>
                    <option value="physical_therapy">Physical Therapy</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="hygiene">Hygiene & Comfort</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority Level *</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="urgent">🚨 Urgent / Critical</option>
                    <option value="high">⚠️ High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">⏱️ Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Caregiver</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="Nurse David Morales, RN">Nurse David</option>
                    <option value="Elena Rostova, PT">Elena PT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reminderLink"
                  checked={newReminderLinked}
                  onChange={(e) => setNewReminderLinked(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="reminderLink" className="text-slate-300">
                  Automatically create linked active chime reminder
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-950"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">
              Complete Task: {completingTask.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add any relevant observations, vital sign values, or clinical notes.
            </p>

            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g., Reading: 124/76 mmHg. Eleanor felt well and took medication with water."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mb-4"
            />

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setCompletingTask(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Task Modal */}
      {cancellingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-semibold text-rose-400 mb-1">
              Cancel Care Task: {cancellingTask.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Please specify the clinical or caregiving rationale for cancelling this scheduled task.
            </p>

            <input
              type="text"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g., Rescheduled by physician or duplicate record"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 mb-4"
            />

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setCancellingTask(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-300"
              >
                Close
              </button>
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Cancel Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
