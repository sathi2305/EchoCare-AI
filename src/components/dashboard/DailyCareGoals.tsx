import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Pill, 
  Activity, 
  Plus, 
  RotateCcw, 
  Check, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Award,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { CareTask } from '../../types';
import { audioManager } from '../../utils/audio';

interface DailyCareGoalsProps {
  tasks: CareTask[];
  onQuickCompleteTask?: (taskId: string) => void;
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  gradientId: string;
  startColor: string;
  endColor: string;
  trackColor?: string;
  delay?: number;
  centerContent?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  gradientId,
  startColor,
  endColor,
  trackColor = '#1e293b',
  delay = 0.1,
  centerContent
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div 
      className="relative flex items-center justify-center shrink-0" 
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
          {/* Subtle ambient glow filter */}
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow Arc (Soft background halo) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth + 4}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ strokeDashoffset, opacity: 0.2 }}
          transition={{
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1],
            delay: delay
          }}
          strokeLinecap="round"
          className="pointer-events-none"
        />

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />

        {/* Framer Motion Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1], // Smooth organic deceleration
            delay: delay
          }}
          strokeLinecap="round"
        />
      </svg>

      {/* Center Readout with Smooth Scale & Opacity Transition */}
      {centerContent && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`center-${clampedPercentage}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            {centerContent}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export const DailyCareGoals: React.FC<DailyCareGoalsProps> = ({
  tasks,
  onQuickCompleteTask,
  onNavigateTab,
  className = ''
}) => {
  const STORAGE_KEY = 'echocare_daily_goals_v1';

  // State initialized with persisted or default care values
  const [hydrationCurrent, setHydrationCurrent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.hydrationCurrent === 'number') return parsed.hydrationCurrent;
      }
    } catch {}
    return 1500; // 1,500 mL default (6 glasses)
  });

  const [hydrationTarget] = useState<number>(2000); // 2,000 mL target (8 glasses)

  const [exerciseCurrent, setExerciseCurrent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.exerciseCurrent === 'number') return parsed.exerciseCurrent;
      }
    } catch {}
    return 20; // 20 mins default mobility walk
  });

  const [exerciseTarget] = useState<number>(30); // 30 mins target

  const [showGoalDetails, setShowGoalDetails] = useState<boolean>(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Persist hydration and exercise to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        hydrationCurrent,
        exerciseCurrent,
        updatedAt: new Date().toISOString()
      }));
    } catch {}
  }, [hydrationCurrent, exerciseCurrent]);

  // Dynamic Medication Calculation based on actual tasks
  const today = '2026-10-20';
  const medicationTasks = tasks.filter(t => t.category === 'medication' && (t.dueDate === today || !t.dueDate));
  
  // Fallback medication count if no tasks exist in current list
  const totalMedicationDoses = medicationTasks.length > 0 ? medicationTasks.length : 3;
  const completedMedicationDoses = medicationTasks.length > 0 
    ? medicationTasks.filter(t => t.status === 'completed').length 
    : 2; // Morning & Afternoon taken, Evening pending

  const nextPendingMedTask = medicationTasks.find(t => t.status === 'pending');

  // Dynamic Percentage Calculations
  const hydrationPct = Math.min(100, Math.round((hydrationCurrent / hydrationTarget) * 100));
  const medicationPct = Math.min(100, Math.round((completedMedicationDoses / totalMedicationDoses) * 100));
  const exercisePct = Math.min(100, Math.round((exerciseCurrent / exerciseTarget) * 100));

  // Weighted Overall Composite Care Score
  // Medication has 40% weight, Hydration 30%, Exercise 30%
  const compositeScore = Math.round((medicationPct * 0.4) + (hydrationPct * 0.3) + (exercisePct * 0.3));

  // Handlers for interactive progress updates
  const handleAddHydration = (amount: number) => {
    const updated = Math.min(3000, hydrationCurrent + amount);
    setHydrationCurrent(updated);
    setLastActionMessage(`+${amount} mL logged. Total: ${updated} mL`);
    if (updated >= hydrationTarget && hydrationCurrent < hydrationTarget) {
      audioManager.playReminderChime();
    }
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  const handleResetHydration = () => {
    setHydrationCurrent(0);
    setLastActionMessage('Hydration counter reset to 0 mL');
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  const handleAddExercise = (mins: number) => {
    const updated = Math.min(120, exerciseCurrent + mins);
    setExerciseCurrent(updated);
    setLastActionMessage(`+${mins} min mobility logged. Total: ${updated} min`);
    if (updated >= exerciseTarget && exerciseCurrent < exerciseTarget) {
      audioManager.playReminderChime();
    }
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  const handleResetExercise = () => {
    setExerciseCurrent(0);
    setLastActionMessage('Exercise counter reset to 0 min');
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  const handleMarkMedication = () => {
    if (nextPendingMedTask && onQuickCompleteTask) {
      onQuickCompleteTask(nextPendingMedTask.id);
      audioManager.playReminderChime();
      setLastActionMessage(`Marked "${nextPendingMedTask.title}" as completed`);
    } else if (onNavigateTab) {
      onNavigateTab('tasks');
    }
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  // Status rating evaluation
  const getScoreStatus = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Optimal Care Adherence',
        color: 'text-emerald-400',
        glow: 'from-emerald-500/20 to-teal-500/5',
        description: 'All primary care targets are on track for today'
      };
    }
    if (score >= 65) {
      return {
        label: 'On Track · Afternoon Target',
        color: 'text-cyan-400',
        glow: 'from-cyan-500/20 to-blue-500/5',
        description: 'Evening medication and hydration pending completion'
      };
    }
    return {
      label: 'Attention Recommended',
      color: 'text-amber-400',
      glow: 'from-amber-500/20 to-rose-500/5',
      description: 'Care goals require follow-up before evening handover'
    };
  };

  const statusInfo = getScoreStatus(compositeScore);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`p-5 rounded-2xl bg-[#0d1322] light:bg-white border border-slate-800 light:border-slate-200 transition-all ${className}`}
    >
      {/* Header with Title and Overall Composite Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white light:text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Daily Care Goals</span>
            </h3>
            <span className="text-slate-500 light:text-slate-400 text-xs">·</span>
            <span className="text-xs text-slate-400 light:text-slate-500">Eleanor Vance</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Real-time adherence tracker for hydration, medications, and physical therapy
          </p>
        </div>

        {/* Master Score Summary Badge */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {lastActionMessage && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                className="text-[11px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50"
              >
                {lastActionMessage}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 bg-slate-900/90 light:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-800 light:border-slate-300">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Care Index</span>
              <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <motion.div 
              key={compositeScore}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center font-mono font-bold text-white text-sm tabular-nums border border-slate-700/60"
            >
              {compositeScore}%
            </motion.div>
          </div>
        </div>
      </div>

      {/* Grid of 3 Main Circular Goal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Hydration Goal */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-4 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-slate-800/90 light:border-slate-200 flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-slate-200 light:text-slate-800 font-medium text-xs">
                <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Hydration</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="tabular-nums font-mono text-slate-300 light:text-slate-700 font-semibold">{hydrationCurrent}</span>
                <span>/</span>
                <span className="tabular-nums font-mono">{hydrationTarget} mL</span>
                <span aria-hidden="true">·</span>
                <span>{Math.round(hydrationCurrent / 250)} of 8 glasses</span>
              </div>
            </div>
          </div>

          {/* Framer Motion Circular Progress Display */}
          <div className="flex items-center justify-center py-2">
            <CircularProgress
              percentage={hydrationPct}
              size={110}
              strokeWidth={9}
              gradientId="grad-hydration"
              startColor="#06b6d4"
              endColor="#3b82f6"
              delay={0.15}
              centerContent={
                <>
                  <span className="text-xl font-bold font-mono text-white light:text-slate-900 tabular-nums">
                    {hydrationPct}%
                  </span>
                  <span className="text-[10px] text-cyan-400 font-medium">
                    {hydrationCurrent >= hydrationTarget ? 'Goal Reached' : `${hydrationTarget - hydrationCurrent} mL left`}
                  </span>
                </>
              }
            />
          </div>

          {/* Interactive Quick-Log Controls */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 light:border-slate-200 flex items-center justify-between gap-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddHydration(250)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              title="Add 1 glass of water (250 mL)"
            >
              <Plus className="w-3 h-3" />
              <span>+250 mL</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddHydration(500)}
              className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors"
              title="Add 1 water bottle (500 mL)"
            >
              +500 mL
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleResetHydration}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              title="Reset hydration counter"
              aria-label="Reset hydration counter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>

        {/* 2. Medication Adherence Goal */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="p-4 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-slate-800/90 light:border-slate-200 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-slate-200 light:text-slate-800 font-medium text-xs">
                <Pill className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Medication Adherence</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="tabular-nums font-mono text-slate-300 light:text-slate-700 font-semibold">{completedMedicationDoses}</span>
                <span>/</span>
                <span className="tabular-nums font-mono">{totalMedicationDoses} Doses</span>
                <span aria-hidden="true">·</span>
                <span>{completedMedicationDoses === totalMedicationDoses ? '100% on schedule' : '1 evening dose due'}</span>
              </div>
            </div>
          </div>

          {/* Framer Motion Circular Progress Display */}
          <div className="flex items-center justify-center py-2">
            <CircularProgress
              percentage={medicationPct}
              size={110}
              strokeWidth={9}
              gradientId="grad-medication"
              startColor="#10b981"
              endColor="#059669"
              delay={0.25}
              centerContent={
                <>
                  <span className="text-xl font-bold font-mono text-white light:text-slate-900 tabular-nums">
                    {medicationPct}%
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {completedMedicationDoses === totalMedicationDoses ? 'All Taken' : 'Next: 19:30'}
                  </span>
                </>
              }
            />
          </div>

          {/* Interactive Medication Log Action */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 light:border-slate-200 flex items-center justify-between gap-1">
            {nextPendingMedTask ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleMarkMedication}
                className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                title={`Mark ${nextPendingMedTask.title} complete`}
              >
                <Check className="w-3.5 h-3.5" />
                <span className="truncate">Log Next: {nextPendingMedTask.dueTime} Meds</span>
              </motion.button>
            ) : (
              <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/20 text-emerald-400/80 text-xs text-center flex items-center justify-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>All Scheduled Meds Completed</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 3. Exercise & Mobility Goal */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="p-4 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-slate-800/90 light:border-slate-200 flex flex-col justify-between hover:border-violet-500/40 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-slate-200 light:text-slate-800 font-medium text-xs">
                <Activity className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Mobility & Exercise</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="tabular-nums font-mono text-slate-300 light:text-slate-700 font-semibold">{exerciseCurrent}</span>
                <span>/</span>
                <span className="tabular-nums font-mono">{exerciseTarget} min</span>
                <span aria-hidden="true">·</span>
                <span>Gentle mobility goal</span>
              </div>
            </div>
          </div>

          {/* Framer Motion Circular Progress Display */}
          <div className="flex items-center justify-center py-2">
            <CircularProgress
              percentage={exercisePct}
              size={110}
              strokeWidth={9}
              gradientId="grad-exercise"
              startColor="#a855f7"
              endColor="#6366f1"
              delay={0.35}
              centerContent={
                <>
                  <span className="text-xl font-bold font-mono text-white light:text-slate-900 tabular-nums">
                    {exercisePct}%
                  </span>
                  <span className="text-[10px] text-violet-400 font-medium">
                    {exerciseCurrent >= exerciseTarget ? 'Goal Achieved' : `${exerciseTarget - exerciseCurrent} min left`}
                  </span>
                </>
              }
            />
          </div>

          {/* Interactive Exercise Controls */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 light:border-slate-200 flex items-center justify-between gap-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddExercise(10)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 border border-violet-800/60 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              title="Log 10-minute assisted walking session"
            >
              <Plus className="w-3 h-3" />
              <span>+10 min Walk</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddExercise(5)}
              className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition-colors"
              title="Log 5-minute chair stretching"
            >
              +5 min Stretch
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleResetExercise}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              title="Reset exercise counter"
              aria-label="Reset exercise counter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Expandable Protocol Reference & Care Tips */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 light:border-slate-200">
        <button
          onClick={() => setShowGoalDetails(!showGoalDetails)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-300 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clinical Care Protocol & Goal Rationale</span>
          </span>
          {showGoalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showGoalDetails && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 rounded-xl bg-slate-900/50 light:bg-slate-100 border border-slate-800/70 text-xs text-slate-400 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="font-semibold text-slate-200 block mb-0.5">Hydration Target (2,000 mL)</span>
                    <p className="text-[11px] leading-relaxed">
                      Maintains renal function and prevents orthostatic hypotension. Spaced across 8 daytime cups.
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block mb-0.5">Medication Regimen</span>
                    <p className="text-[11px] leading-relaxed">
                      Lisinopril 10mg (morning), Metformin 500mg (lunch), Atorvastatin 20mg (19:30 evening).
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 block mb-0.5">Mobility Goal (30 min)</span>
                    <p className="text-[11px] leading-relaxed">
                      Low-impact indoor walking and seated ankle pumps to maintain joint flexibility and circulation.
                    </p>
                  </div>
                </div>
                <div className="pt-2 text-[10px] text-slate-500 font-mono">
                  Care Plan Reference: Dr. Robert Chen (Primary Geriatrician) · Updated for October 2026
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
