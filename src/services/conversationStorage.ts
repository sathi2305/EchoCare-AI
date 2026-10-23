export interface ConversationMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  language?: string;
  toolExecution?: {
    tool: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    status: 'running' | 'success' | 'failed';
  };
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  languageLabel: string;
  messages: ConversationMessage[];
  turnCount: number;
  lastMessageSnippet: string;
}

const STORAGE_KEY = 'echocare_conversations';

const INITIAL_CONVERSATIONS: ConversationSession[] = [
  {
    id: 'session-demo-01',
    title: 'Daily Care Briefing & Vitals Review',
    createdAt: '2026-10-20T08:30:00.000Z',
    updatedAt: '2026-10-20T08:34:00.000Z',
    language: 'en',
    languageLabel: 'English',
    turnCount: 4,
    lastMessageSnippet: 'Morning blood glucose was 112 mg/dL and Lisinopril 10mg was logged by Nurse David.',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'EchoCare, good morning. What is the plan for Eleanor today?',
        timestamp: '08:30 AM',
        language: 'en'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Good morning, Sarah! Eleanor has 5 care activities scheduled today. Morning blood glucose was 112 mg/dL. Her 8:00 AM Lisinopril was completed. Next up is her 11:00 AM physical therapy mobility walk.',
        timestamp: '08:31 AM',
        language: 'en',
        toolExecution: {
          tool: 'get_daily_summary',
          input: { recipient: 'Eleanor Vance', date: '2026-10-20' },
          output: { completed: 2, pending: 3, glucose: '112 mg/dL' },
          status: 'success'
        }
      },
      {
        id: 'msg-3',
        sender: 'user',
        text: 'Did she take her Lisinopril with breakfast?',
        timestamp: '08:33 AM',
        language: 'en'
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        text: 'Yes, Nurse David recorded that Lisinopril was taken with oatmeal and water at 8:15 AM with no adverse symptoms.',
        timestamp: '08:34 AM',
        language: 'en'
      }
    ]
  },
  {
    id: 'session-demo-02',
    title: 'Evening Reminder Scheduling with Clarification',
    createdAt: '2026-10-20T14:15:00.000Z',
    updatedAt: '2026-10-20T14:18:00.000Z',
    language: 'en',
    languageLabel: 'English',
    turnCount: 4,
    lastMessageSnippet: 'All set! Your reminder to call Dr. Robert Chen is saved for 6:00 PM today.',
    messages: [
      {
        id: 'msg-201',
        sender: 'user',
        text: 'EchoCare, remind me to call Dr. Chen.',
        timestamp: '02:15 PM',
        language: 'en'
      },
      {
        id: 'msg-202',
        sender: 'assistant',
        text: 'Of course! What time should I remind you?',
        timestamp: '02:15 PM',
        language: 'en'
      },
      {
        id: 'msg-203',
        sender: 'user',
        text: 'Around six this evening.',
        timestamp: '02:16 PM',
        language: 'en'
      },
      {
        id: 'msg-204',
        sender: 'assistant',
        text: 'All set! Your reminder to call Dr. Robert Chen is saved for 6:00 PM today.',
        timestamp: '02:16 PM',
        language: 'en',
        toolExecution: {
          tool: 'create_reminder',
          input: { title: 'Call Dr. Robert Chen', time: '18:00', recipient: 'Sarah Jenkins' },
          output: { id: 'rem-call-chen', success: true },
          status: 'success'
        }
      }
    ]
  },
  {
    id: 'session-demo-03',
    title: 'தமிழ் & Tanglish: மாலை மருந்து நினைவூட்டல்',
    createdAt: '2026-10-20T16:00:00.000Z',
    updatedAt: '2026-10-20T16:04:00.000Z',
    language: 'ta',
    languageLabel: 'தமிழ் (Tanglish)',
    turnCount: 2,
    lastMessageSnippet: 'சரிங்க! மாலை 7:30 மணிக்கு Metformin மருந்து நினைவூட்டல் உருவாக்கப்பட்டது.',
    messages: [
      {
        id: 'msg-301',
        sender: 'user',
        text: 'Echo, innikku evening 7:30 manikku Eleanor-ku Metformin podanum, reminder set pannu.',
        timestamp: '04:00 PM',
        language: 'ta'
      },
      {
        id: 'msg-302',
        sender: 'assistant',
        text: 'சரிங்க! இன்று மாலை 7:30 மணிக்கு எலினோருக்கான Metformin 500mg மருந்து நினைவூட்டல் பதிவு செய்யப்பட்டது.',
        timestamp: '04:01 PM',
        language: 'ta',
        toolExecution: {
          tool: 'create_reminder',
          input: { title: 'Eleanor Metformin 500mg', time: '19:30', recipient: 'Eleanor Vance' },
          output: { id: 'rem-metformin-eve', success: true },
          status: 'success'
        }
      }
    ]
  }
];

export const conversationStorage = {
  getSessions(): ConversationSession[] {
    if (typeof window === 'undefined') return INITIAL_CONVERSATIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
        return INITIAL_CONVERSATIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse saved conversations, resetting:', e);
      return INITIAL_CONVERSATIONS;
    }
  },

  getSessionById(id: string): ConversationSession | null {
    const list = this.getSessions();
    return list.find(s => s.id === id) || null;
  },

  saveSession(session: ConversationSession) {
    const list = this.getSessions();
    const existingIndex = list.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      list[existingIndex] = session;
    } else {
      list.unshift(session);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  },

  deleteSession(id: string) {
    const list = this.getSessions().filter(s => s.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  },

  clearAll() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  },

  createNewSession(title: string, language: string = 'en'): ConversationSession {
    const newSession: ConversationSession = {
      id: `session-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language,
      languageLabel: language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English',
      messages: [],
      turnCount: 0,
      lastMessageSnippet: 'New conversation started'
    };
    this.saveSession(newSession);
    return newSession;
  }
};
