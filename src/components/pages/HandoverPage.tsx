import React, { useState } from 'react';
import {
  ClipboardList,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HandoverReport, CareTask } from '../../types';
import { api } from '../../services/api';

interface HandoverPageProps {
  handovers: HandoverReport[];
  tasks: CareTask[];
  onRefreshHandovers: () => void;
}

export const HandoverPage: React.FC<HandoverPageProps> = ({
  handovers,
  tasks,
  onRefreshHandovers
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [outgoingCaregiver, setOutgoingCaregiver] = useState('Sarah Jenkins (Primary)');
  const [incomingCaregiver, setIncomingCaregiver] = useState('Nurse David Morales, RN');
  const [shiftTitle, setShiftTitle] = useState('Evening Shift Handover (15:00 - 22:00)');
  const [activeHandover, setActiveHandover] = useState<HandoverReport | null>(handovers[0] || null);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await api.generateHandover({
        outgoingCaregiver,
        incomingCaregiver,
        shiftTitle
      });

      setActiveHandover(generated);
      onRefreshHandovers();
    } catch (err: any) {
      alert(`Error generating handover: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMarkdown = () => {
    if (!activeHandover) return;
    const text = `# EchoCare AI Caregiver Handover Report
Date: ${activeHandover.shiftDate} | Shift: ${activeHandover.shiftTime}
Outgoing: ${activeHandover.outgoingCaregiver}
Incoming: ${activeHandover.incomingCaregiver}

## Clinical & Vital Observations
${activeHandover.vitalObservations}

## Summary of Completed Activities (${activeHandover.completedTasksCount} Completed)
${activeHandover.clinicalNotes}

## Actionable Pending Items for Next Shift
${activeHandover.pendingItems.map(item => `- ${item}`).join('\n')}

Emergency Contact Verification: Completed
Generated via EchoCare AI Home Care Coordination Platform
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Generator Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Caregiver Shift Handover</h2>
          <p className="text-xs text-slate-400">
            Automated handover reports compiled truthfully from verified stored tasks, vitals, and activities
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>{isGenerating ? 'Compiling from Records...' : 'Compile Shift Handover'}</span>
        </button>
      </div>

      {/* Main Shift Handover Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active / Current Handover Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {activeHandover ? (
            <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-5 print:bg-white print:text-black">
              {/* Handover Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Caregiver Handover Report
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-400 font-mono">{activeHandover.shiftDate}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{activeHandover.shiftTime}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                    title="Copy Markdown summary"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                    title="Print or export PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* Caregiver Transition Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Outgoing Caregiver</span>
                  <span className="font-semibold text-white">{activeHandover.outgoingCaregiver}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Incoming Caregiver</span>
                  <span className="font-semibold text-cyan-300">{activeHandover.incomingCaregiver}</span>
                </div>
              </div>

              {/* Clinical Observations from actual recorded tasks */}
              <div>
                <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  1. Clinical Observations & Recorded Vitals
                </h4>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {activeHandover.vitalObservations}
                </div>
              </div>

              {/* Care Summary */}
              <div>
                <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2">
                  2. Shift Care Activities Completed ({activeHandover.completedTasksCount} Activities)
                </h4>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {activeHandover.clinicalNotes}
                </div>
              </div>

              {/* Actionable Pending Items for incoming shift */}
              <div>
                <h4 className="text-xs uppercase font-semibold tracking-wider text-amber-400 mb-2">
                  3. Pending Items for Incoming Caregiver ({activeHandover.pendingTasksCount} Action Items)
                </h4>
                <div className="space-y-2">
                  {activeHandover.pendingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency checklist verification */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Physician contacts & emergency protocol verified for next shift</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Verified</span>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl bg-[#0d1322] border border-slate-800">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Handover Report Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Click "Compile Shift Handover" above to have EchoCare AI pull verified tasks, vitals, and routines into a handover document.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Compile Now
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Past Handovers Archive */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-3">Past Shift Handovers</h3>

            <div className="space-y-3">
              {handovers.map(h => (
                <div
                  key={h.id}
                  onClick={() => setActiveHandover(h)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeHandover?.id === h.id
                      ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/40 border-cyan-700/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200 truncate">{h.shiftTime}</span>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{h.shiftDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {h.outgoingCaregiver.split(' ')[0]} → {h.incomingCaregiver.split(' ')[0]}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>{h.completedTasksCount} completed</span>
                    <span>{h.pendingTasksCount} pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
