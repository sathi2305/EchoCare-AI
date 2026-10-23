import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Filter,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { conversationStorage, ConversationSession } from '../../services/conversationStorage';
import { useLanguage } from '../../utils/i18n';

interface ConversationsPageProps {
  onOpenConversationInAssistant: (sessionId: string) => void;
  onStartNewConversation: () => void;
}

export const ConversationsPage: React.FC<ConversationsPageProps> = ({
  onOpenConversationInAssistant,
  onStartNewConversation
}) => {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ConversationSession | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const list = conversationStorage.getSessions();
    setSessions(list);
    if (list.length > 0 && !selectedSession) {
      setSelectedSession(list[0]);
    }
  };

  const handleDeleteConfirmed = () => {
    if (!sessionToDelete) return;
    conversationStorage.deleteSession(sessionToDelete.id);
    const updated = conversationStorage.getSessions();
    setSessions(updated);
    if (selectedSession?.id === sessionToDelete.id) {
      setSelectedSession(updated.length > 0 ? updated[0] : null);
    }
    setSessionToDelete(null);
  };

  const handleCopyTranscript = (session: ConversationSession) => {
    const text = session.messages
      .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedSessionId(session.id);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang =
      selectedLanguageFilter === 'all' || session.language === selectedLanguageFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header zone with title & quick action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span>Conversations & Care Dialogs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, review, and resume past multilingual spoken conversations with EchoCare.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onStartNewConversation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within past conversations by question, medication, or topic..."
            className="w-full bg-[#0d1322] border border-slate-800 focus:border-cyan-500/70 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0d1322] border border-slate-800 rounded-xl shrink-0 text-xs">
          {[
            { id: 'all', label: 'All Languages' },
            { id: 'en', label: 'English' },
            { id: 'ta', label: 'தமிழ்' },
            { id: 'hi', label: 'हिन्दी' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedLanguageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedLanguageFilter === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Split: Session List (Left) and Session Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredSessions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0d1322] border border-slate-800 text-center text-xs text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No conversations found</p>
              <p className="mt-1 text-slate-500">Try a different search query or start a new conversation.</p>
              <button
                onClick={onStartNewConversation}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-cyan-900/40 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/60 inline-flex items-center gap-1.5 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Talking</span>
              </button>
            </div>
          ) : (
            filteredSessions.map(session => {
              const isSelected = selectedSession?.id === session.id;
              const dateStr = new Date(session.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/30 border-cyan-600/70 shadow-lg shadow-cyan-950/50'
                      : 'bg-[#0d1322] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold text-white truncate flex-1">
                      {session.title}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 font-mono shrink-0">
                      {session.languageLabel || session.language.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    "{session.lastMessageSnippet}"
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {dateStr}
                    </span>
                    <span>{session.turnCount} turns</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedSession ? (
            <div className="p-5 rounded-2xl bg-[#0d1322] border border-slate-800 flex flex-col h-full min-h-[500px]">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                      Session Transcript
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedSession.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {selectedSession.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyTranscript(selectedSession)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                    title="Copy full transcript to clipboard"
                  >
                    {copiedSessionId === selectedSession.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onOpenConversationInAssistant(selectedSession.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 text-xs font-semibold transition-colors"
                    title="Open in AI Voice Assistant workspace"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Assistant</span>
                  </button>

                  <button
                    onClick={() => setSessionToDelete(selectedSession)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Transcript Bubbles */}
              <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[480px] pr-2">
                {selectedSession.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-1">
                      <span>{msg.sender === 'user' ? 'Sarah (Caregiver)' : 'EchoCare AI'}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Tool Execution Card if attached */}
                      {msg.toolExecution && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-[#090e1a] border border-cyan-900/60 text-[11px] font-mono text-cyan-300">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Executed Tool: {msg.toolExecution.tool}</span>
                          </div>
                          <div className="text-slate-400">
                            Result: {JSON.stringify(msg.toolExecution.output)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0d1322] border border-slate-800 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">Select a conversation</p>
              <p className="text-slate-500 mt-1">Choose a conversation from the left to view the transcript.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0e1424] border border-rose-900/70 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Conversation?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete "{sessionToDelete.title}"? This conversation history cannot be recovered.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
