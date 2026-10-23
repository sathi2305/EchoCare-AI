import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Search,
  Sparkles,
  Play,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Clock,
  Layers,
  Languages,
  Info
} from 'lucide-react';

export interface CommandItem {
  phrase: string;
  description: string;
  tool: string;
  context: 'overview' | 'tasks' | 'reminders' | 'handover' | 'history' | 'assistant' | 'tamil' | 'hindi';
  isMultiTurn?: boolean;
}

const COMMAND_CATALOG: CommandItem[] = [
  // Overview / Daily Vitals
  {
    phrase: 'EchoCare, what do I need to do today?',
    description: 'Retrieves today\'s care schedule, completed count, and pending routine items.',
    tool: 'get_daily_summary()',
    context: 'overview'
  },
  {
    phrase: 'What were Eleanor\'s blood pressure readings today?',
    description: 'Fetches verified clinical resting blood pressure and pulse from the vitals log.',
    tool: 'get_daily_summary()',
    context: 'overview'
  },
  {
    phrase: 'What was her morning fasting blood glucose?',
    description: 'Retrieves morning fingerstick glucose measurement and target range verification.',
    tool: 'get_daily_summary()',
    context: 'overview'
  },
  {
    phrase: 'Who is the primary caregiver on duty?',
    description: 'Reads authorized family caregiver and visiting nurse contact numbers.',
    tool: 'profile.caregivers',
    context: 'overview'
  },

  // Care Tasks
  {
    phrase: 'What care tasks are due today?',
    description: 'Lists all pending and upcoming care activities with scheduled times.',
    tool: 'list_care_tasks(status="pending")',
    context: 'tasks'
  },
  {
    phrase: 'Schedule a care task for mobility walk tomorrow at 11 AM',
    description: 'Creates a new physical therapy task and assigns it to the on-duty caregiver.',
    tool: 'create_care_task()',
    context: 'tasks'
  },
  {
    phrase: 'What tasks are completed today?',
    description: 'Queries verified completed clinical tasks and caregiver observation notes.',
    tool: 'list_care_tasks(status="completed")',
    context: 'tasks'
  },
  {
    phrase: 'Cancel evening medication task',
    description: 'Initiates a consequential cancellation requiring explicit caregiver confirmation.',
    tool: 'cancel_care_task()',
    context: 'tasks',
    isMultiTurn: true
  },

  // Reminders
  {
    phrase: 'Remind me to call the caregiver at six PM',
    description: 'Parses reminder title and time, asks for confirmation, and schedules an audio chime.',
    tool: 'create_reminder()',
    context: 'reminders',
    isMultiTurn: true
  },
  {
    phrase: 'Create a reminder to check blood sugar',
    description: 'Triggers multi-turn clarification. EchoCare will ask "What time would you like this reminder for?".',
    tool: 'create_reminder() [slot-filling]',
    context: 'reminders',
    isMultiTurn: true
  },
  {
    phrase: 'What was the reminder I just created?',
    description: 'Queries short-term conversational session memory and retrieves the newly saved reminder.',
    tool: 'session.recentlyCreatedReminderId',
    context: 'reminders'
  },
  {
    phrase: 'List all active reminders',
    description: 'Queries all active home auditory and visual reminder chimes.',
    tool: 'list_reminders(activeOnly=true)',
    context: 'reminders'
  },

  // Shift Handover
  {
    phrase: 'Prepare a caregiver handover for Nurse David',
    description: 'Compiles a truthful shift handover report from verified completed tasks and vitals.',
    tool: 'generate_handover()',
    context: 'handover'
  },
  {
    phrase: 'Summarize today\'s completed activities for shift report',
    description: 'Synthesizes clinical shift observations into a structured handover.',
    tool: 'generate_handover()',
    context: 'handover'
  },

  // History & Audit
  {
    phrase: 'Show recent activity history',
    description: 'Queries the immutable audit event timeline with timestamps, actors, and tools.',
    tool: 'get_activity_history(limit=5)',
    context: 'history'
  },
  {
    phrase: 'Who completed the afternoon blood pressure check?',
    description: 'Looks up the audit log and task record to report the exact caregiver and timestamp.',
    tool: 'get_activity_history()',
    context: 'history'
  },

  // Assistant & Multi-Turn Controls
  {
    phrase: 'Yes, save it',
    description: 'Confirms pending reminder or task scheduling during multi-turn slot flow.',
    tool: 'execute_pending_slot()',
    context: 'assistant',
    isMultiTurn: true
  },
  {
    phrase: 'No, cancel',
    description: 'Declines proposed action and resets slot memory safely without saving.',
    tool: 'cancel_pending_slot()',
    context: 'assistant',
    isMultiTurn: true
  },
  {
    phrase: 'Reset conversation memory',
    description: 'Clears active session memory and slots for a fresh conversational dialogue.',
    tool: 'clearVoiceSession()',
    context: 'assistant'
  },

  // Tamil Commands (தமிழ் கட்டளைகள்)
  {
    phrase: 'இன்றைய பராமரிப்புப் பணிகள் என்னென்ன?',
    description: 'இன்றைய திட்டமிடப்பட்ட பணிகள் மற்றும் மருந்து விவரங்களை பட்டியலிடும்.',
    tool: 'list_care_tasks()',
    context: 'tamil'
  },
  {
    phrase: 'மாலை ஆறு மணிக்கு நினைவூட்டலை உருவாக்கவும்',
    description: 'மாலை ஆறு மணிக்கு பராமரிப்பாளரை அழைப்பதற்கான ஒலி நினைவூட்டலை அமைக்கும்.',
    tool: 'create_reminder()',
    context: 'tamil',
    isMultiTurn: true
  },
  {
    phrase: 'இன்றைய இரத்த அழுத்த விவரங்களை கூறு',
    description: 'எலினாரின் இன்றைய இரத்த அழுத்த அளவீடுகள் மற்றும் இதயத்துடிப்பை வழங்கும்.',
    tool: 'get_daily_summary()',
    context: 'tamil'
  },
  {
    phrase: 'Echo, innikku evening 6 manikku reminder set pannu',
    description: 'Colloquial Tanglish code-switching to schedule an evening medication reminder.',
    tool: 'create_reminder(time="18:00")',
    context: 'tamil',
    isMultiTurn: true
  },

  // Hindi Commands (हिन्दी கட்டளைகள்)
  {
    phrase: 'इकोकेयर, आज एलेनोर के कौन-से कार्य बाकी हैं?',
    description: 'एलेनोर के आज के सभी पेंडिंग कार्यों और दिनचर्या की सूची प्राप्त करें।',
    tool: 'list_care_tasks(status="pending")',
    context: 'hindi'
  },
  {
    phrase: 'Echo, aaj shaam 6 baje dawai ka reminder set karo',
    description: 'शाम 6:00 बजे दवाई लेने के लिए ऑडियो चाइम रिमाइंडर सेट करें।',
    tool: 'create_reminder(time="18:00")',
    context: 'hindi',
    isMultiTurn: true
  },
  {
    phrase: 'एलेनोर के आज के ब्लड प्रेशर की रीडिंग क्या थी?',
    description: 'आज के क्लिनिकल ब्लड प्रेशर और पल्स माप की पुष्टि करें।',
    tool: 'get_daily_summary()',
    context: 'hindi'
  },
  {
    phrase: 'Hindi me baat karo',
    description: 'सहायक की सक्रिय भाषा को बदलकर हिन्दी में संवाद शुरू करें।',
    tool: 'set_language("hi-IN")',
    context: 'hindi'
  }
];

interface VoiceCommandCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext?: string;
  onSelectCommand: (command: string) => void;
}

export const VoiceCommandCheatSheetModal: React.FC<VoiceCommandCheatSheetModalProps> = ({
  isOpen,
  onClose,
  activeContext = 'all',
  onSelectCommand
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>(activeContext || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Commands' },
    { id: 'overview', label: 'Overview & Vitals' },
    { id: 'tasks', label: 'Care Tasks' },
    { id: 'reminders', label: 'Reminders & Alerts' },
    { id: 'handover', label: 'Shift Handover' },
    { id: 'history', label: 'Activity Audit' },
    { id: 'assistant', label: 'Multi-Turn Flow' },
    { id: 'tamil', label: 'Tamil (தமிழ்)' },
    { id: 'hindi', label: 'Hindi (हिन्दी)' }
  ];

  const filteredCommands = COMMAND_CATALOG.filter(item => {
    if (selectedFilter !== 'all' && item.context !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.phrase.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tool.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#090e1a] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Luminous Top Glow Stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0c1222]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-950">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Voice Command Cheat Sheet</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md font-mono">
                  Alexa-Style Voice Brain
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spoken phrasing catalog tailored dynamically to EchoCare AI care workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Close Cheat Sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-4 px-6 border-b border-slate-800/80 bg-[#080d18] space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voice commands, tools, or care tasks..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedFilter === cat.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Commands List View */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No voice commands found matching "{searchQuery}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800/80 hover:border-cyan-700/60 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors font-sans">
                      "{cmd.phrase}"
                    </p>
                    {cmd.isMultiTurn && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-mono">
                        Multi-Turn
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cmd.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-cyan-400/80">
                    <Terminal className="w-3 h-3 text-slate-500" />
                    <span>Invokes: {cmd.tool}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
                  <button
                    onClick={() => {
                      onSelectCommand(cmd.phrase);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/70 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Try Command</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Dialogue Guidance Tip */}
        <div className="p-4 px-6 bg-[#0a0f1d] border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Tip:</strong> EchoCare supports conversational slot-filling. Say <em>"Remind me to call Eleanor's doctor"</em> without a time, and EchoCare will follow up asking <em>"What time?"</em>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 shrink-0">
            {filteredCommands.length} commands available
          </span>
        </div>
      </div>
    </div>
  );
};
