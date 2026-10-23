import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Volume2,
  Clock,
  CheckCircle,
  X,
  Power,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Reminder, TaskCategory, ReminderFrequency } from '../../types';
import { api } from '../../services/api';
import { audioManager } from '../../utils/audio';

interface RemindersPageProps {
  reminders: Reminder[];
  onRefreshReminders: () => void;
  onOpenAssistant: () => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({
  reminders,
  onRefreshReminders,
  onOpenAssistant
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('medication');
  const [newTime, setNewTime] = useState('18:00');
  const [newFrequency, setNewFrequency] = useState<ReminderFrequency>('daily');
  const [newSoundEnabled, setNewSoundEnabled] = useState(true);

  const handleToggle = async (id: string) => {
    try {
      await api.toggleReminder(id);
      audioManager.playConfirmSound();
      onRefreshReminders();
    } catch (err: any) {
      alert(`Error toggling reminder: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this reminder schedule?')) return;
    try {
      await api.deleteReminder(id);
      onRefreshReminders();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createReminder({
        title: newTitle,
        category: newCategory,
        time: newTime,
        frequency: newFrequency,
        soundEnabled: newSoundEnabled
      });

      audioManager.playReminderChime();
      setIsCreateModalOpen(false);
      setNewTitle('');
      onRefreshReminders();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Home Reminders & Alerts</h2>
          <p className="text-xs text-slate-400">
            Scheduled auditory chimes and visual cues configured for Eleanor Vance's home environment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => audioManager.playReminderChime()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            title="Preview standard gentle chime"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Sound Chime</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* Reminders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.map(rem => (
          <div
            key={rem.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              rem.isActive
                ? 'bg-[#0d1322] border-slate-800 hover:border-slate-700 shadow-lg shadow-black/20'
                : 'bg-[#0b101c]/50 border-slate-800/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  {rem.category.replace('_', ' ')}
                </span>

                <button
                  onClick={() => handleToggle(rem.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                    rem.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                  title={rem.isActive ? 'Click to pause' : 'Click to enable'}
                >
                  <Power className="w-2.5 h-2.5" />
                  <span>{rem.isActive ? 'Active' : 'Paused'}</span>
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {rem.time}
                </span>
                <span className="text-xs text-slate-400 capitalize">· {rem.frequency.replace('_', ' ')}</span>
              </div>

              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                {rem.title}
              </h3>
              <p className="text-xs text-slate-400">
                Recipient: {rem.recipientName}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                {rem.soundEnabled ? 'Chime sound enabled' : 'Silent visual alert'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => audioManager.playReminderChime()}
                  className="p-1.5 hover:text-cyan-300"
                  title="Play chime"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 hover:text-rose-400"
                  title="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Reminder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-white">Create Home Reminder</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Reminder Label *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Afternoon Blood Pressure & Medication"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Recurrence</label>
                  <select
                    value={newFrequency}
                    onChange={(e: any) => setNewFrequency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
              </div>

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
                  <option value="nutrition">Nutrition & Water</option>
                  <option value="hygiene">Hygiene & Comfort</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="soundChime"
                  checked={newSoundEnabled}
                  onChange={(e) => setNewSoundEnabled(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="soundChime" className="text-slate-300">
                  Play melodic audio chime alert on trigger
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
