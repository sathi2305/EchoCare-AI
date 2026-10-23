import React, { useState, useMemo } from 'react';
import {
  Smile,
  Heart,
  Activity,
  CheckCircle2,
  Sparkles,
  Clock,
  User,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sun,
  ShieldCheck,
  Info
} from 'lucide-react';
import { ActivityEvent, CareProfile } from '../../types';
import { api } from '../../services/api';
import { audioManager } from '../../utils/audio';

interface DailyWellnessCheckProps {
  profile: CareProfile | null;
  activities: ActivityEvent[];
  onRefreshData?: () => void;
  className?: string;
}

export type MoodType = 'cheerful' | 'calm' | 'neutral' | 'tired' | 'distressed';

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  sublabel: string;
  colorClass: string;
  bgSelectedClass: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'cheerful',
    emoji: '😊',
    label: 'Cheerful',
    sublabel: 'Alert & in good spirits',
    colorClass: 'text-emerald-400',
    bgSelectedClass: 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
  },
  {
    id: 'calm',
    emoji: '😌',
    label: 'Calm & Rested',
    sublabel: 'Peaceful, relaxed baseline',
    colorClass: 'text-sky-400',
    bgSelectedClass: 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
  },
  {
    id: 'neutral',
    emoji: '😐',
    label: 'Neutral',
    sublabel: 'Quiet, typical baseline',
    colorClass: 'text-slate-300',
    bgSelectedClass: 'bg-slate-800/80 border-slate-600 ring-1 ring-slate-600'
  },
  {
    id: 'tired',
    emoji: '🥱',
    label: 'Low Energy',
    sublabel: 'Drowsy or fatigued',
    colorClass: 'text-amber-400',
    bgSelectedClass: 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40'
  },
  {
    id: 'distressed',
    emoji: '😟',
    label: 'Uncomfortable',
    sublabel: 'Expressing pain or unease',
    colorClass: 'text-rose-400',
    bgSelectedClass: 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
  }
];

const PHYSICAL_SCORES = [
  { score: 1, label: 'Poor', detail: 'Significant pain or low mobility', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  { score: 2, label: 'Fair', detail: 'Noticeable stiffness or low stamina', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  { score: 3, label: 'Moderate', detail: 'Typical baseline, manageable', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { score: 4, label: 'Good', detail: 'Steady balance, comfortable', color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
  { score: 5, label: 'Excellent', detail: 'High vitality, strong posture', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
];

const QUICK_OBSERVATIONS = [
  'Restful sleep (7+ hrs)',
  'Steady gait with walker',
  'Healthy appetite',
  'Zero joint pain',
  'Mild morning stiffness',
  'Skin intact & clear',
  'Hydration goal on track'
];

export const DailyWellnessCheck: React.FC<DailyWellnessCheckProps> = ({
  profile,
  activities,
  onRefreshData,
  className = ''
}) => {
  const recipientName = profile?.preferredName || profile?.fullName || 'Eleanor Vance';

  // Find if a check has been logged today
  const existingCheck = useMemo(() => {
    return activities.find(act => {
      const isWellnessType = act.metadata?.type === 'daily_wellness_check' || 
        act.description.toLowerCase().includes('daily wellness check');
      if (!isWellnessType) return false;

      // Check if logged within the current calendar day or last 24h
      const actDate = new Date(act.timestamp);
      const now = new Date();
      const isToday = actDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      const isRecent = (now.getTime() - actDate.getTime()) < 24 * 60 * 60 * 1000;
      return isToday || isRecent;
    });
  }, [activities]);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType>('cheerful');
  const [physicalScore, setPhysicalScore] = useState<number>(4);
  const [selectedObservations, setSelectedObservations] = useState<string[]>([
    'Restful sleep (7+ hrs)',
    'Steady gait with walker'
  ]);
  const [caregiverNotes, setCaregiverNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const toggleObservation = (tag: string) => {
    if (selectedObservations.includes(tag)) {
      setSelectedObservations(selectedObservations.filter(t => t !== tag));
    } else {
      setSelectedObservations([...selectedObservations, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const moodObj = MOOD_OPTIONS.find(m => m.id === selectedMood);
      const scoreObj = PHYSICAL_SCORES.find(s => s.score === physicalScore);

      const description = `Daily Wellness Check: ${recipientName} mood is ${moodObj?.label || selectedMood} (${moodObj?.emoji}), Physical condition rated ${physicalScore}/5 (${scoreObj?.label})${caregiverNotes.trim() ? ` — "${caregiverNotes.trim()}"` : ''}`;

      await api.recordActivity({
        actor: 'Sarah Jenkins',
        actorRole: 'caregiver',
        actionType: 'task_completed',
        eventType: 'health',
        description,
        recordType: 'task',
        metadata: {
          type: 'daily_wellness_check',
          recipientName,
          caregiver: 'Sarah Jenkins',
          mood: selectedMood,
          moodEmoji: moodObj?.emoji,
          moodLabel: moodObj?.label,
          physicalScore,
          physicalScoreMax: 5,
          physicalCondition: scoreObj?.label,
          observations: selectedObservations,
          notes: caregiverNotes.trim(),
          loggedAt: new Date().toISOString()
        }
      });

      audioManager.playConfirmSound();
      setFeedbackSuccess(true);
      setIsEditing(false);
      setCaregiverNotes('');

      if (onRefreshData) {
        onRefreshData();
      }

      setTimeout(() => {
        setFeedbackSuccess(false);
      }, 4000);
    } catch (err: any) {
      alert(`Could not log wellness check: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged and not in editing mode, show the verified logged status
  if (existingCheck && !isEditing) {
    const meta = existingCheck.metadata || {};
    const recordedMood = MOOD_OPTIONS.find(m => m.id === meta.mood) || MOOD_OPTIONS[0];
    const scoreVal = meta.physicalScore || 4;
    const recordedScore = PHYSICAL_SCORES.find(s => s.score === scoreVal) || PHYSICAL_SCORES[3];

    return (
      <div className={`p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Morning Wellness Check Logged</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <Check className="w-3 h-3" />
                  Recorded for Today
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Morning baseline vitals & emotional wellness check for {recipientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-400 hover:text-white transition-colors"
          >
            Update Check
          </button>
        </div>

        {/* Recorded Summary Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Mood Display */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={recordedMood.label}>{recordedMood.emoji}</span>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Morning Mood</span>
              <span className="text-sm font-bold text-white">{meta.moodLabel || recordedMood.label}</span>
            </div>
          </div>

          {/* Physical Condition Display */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-sm">
              {scoreVal}/5
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Physical Condition</span>
              <span className="text-sm font-bold text-white">{meta.physicalCondition || recordedScore.label}</span>
            </div>
          </div>

          {/* Logger & Time */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Assessed By</span>
              <span className="text-xs font-semibold text-slate-200">{meta.caregiver || existingCheck.actor}</span>
            </div>
          </div>
        </div>

        {/* Observations Tags */}
        {meta.observations && meta.observations.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Observed:</span>
            {meta.observations.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {meta.notes && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <span className="text-cyan-400 font-mono font-semibold">Caregiver Clinical Note: </span>
            <span className="text-slate-300 leading-relaxed font-sans">{meta.notes}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-b from-[#0d1629] via-[#0d1322] to-[#0a0f1e] border border-cyan-500/30 shadow-xl shadow-cyan-950/20 relative overflow-hidden ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Daily Wellness Check</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Sparkles className="w-3 h-3" />
                Morning Routine Prompt
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick 30-second morning assessment for {recipientName} to keep family and attending caregivers synced.
            </p>
          </div>
        </div>

        {existingCheck && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {feedbackSuccess && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Daily Wellness Check logged successfully and recorded to audit history!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* 1. MOOD SELECTOR */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Morning Mood & Emotional Tone
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? mood.bgSelectedClass
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl mb-1" role="img" aria-label={mood.label}>
                    {mood.emoji}
                  </span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {mood.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {mood.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. PHYSICAL CONDITION SCORE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Physical Condition Score (1 to 5)
            </label>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Score: {physicalScore}/5 ({PHYSICAL_SCORES.find(s => s.score === physicalScore)?.label})
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {PHYSICAL_SCORES.map((s) => {
              const isSelected = physicalScore === s.score;
              return (
                <button
                  key={s.score}
                  type="button"
                  onClick={() => setPhysicalScore(s.score)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? `${s.color} ring-2 ring-cyan-500/50 scale-[1.02]`
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base font-bold text-white tabular-nums">{s.score}</div>
                  <div className="text-[11px] font-semibold mt-0.5">{s.label}</div>
                  <div className="text-[9px] text-slate-400 hidden sm:block truncate mt-0.5">{s.detail}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. QUICK OBSERVATION CHIPS */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            3. Key Observations & Clinical Milestones (Tap to select)
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_OBSERVATIONS.map((tag) => {
              const isChecked = selectedObservations.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleObservation(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isChecked ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <span className="w-3.5 h-3.5" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. OPTIONAL CAREGIVER NOTES */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            4. Observations or Handover Notes (Optional)
          </label>
          <input
            type="text"
            value={caregiverNotes}
            onChange={(e) => setCaregiverNotes(e.target.value)}
            placeholder={`e.g., Slept soundly without waking, ate 90% of oatmeal, ready for hallway walking...`}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recorded as an immutable health activity event</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Logging...' : 'Save Daily Wellness Check'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
