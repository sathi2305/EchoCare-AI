import { CareTask, Reminder, HandoverReport, ActivityEvent, CareProfile, UserSettings, ChatMessage, AgentConfirmation } from '../types';

const BASE_URL = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; mode: string; service: string }>('/api/health'),

  // Dashboard
  getDashboardSummary: () => fetchJson<{
    recipient: CareProfile;
    metrics: {
      totalTasksToday: number;
      completedTasksToday: number;
      pendingTasksToday: number;
      overdueTasksCount: number;
      activeRemindersCount: number;
      completionRatePercent: number;
      activeCaregiver: string;
    };
    todayTasks: CareTask[];
    upcomingReminders: Reminder[];
    recentActivities: ActivityEvent[];
    recentHandover: HandoverReport | null;
  }>('/api/dashboard/summary'),

  // Tasks
  getTasks: (params?: { status?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return fetchJson<CareTask[]>(`/api/tasks?${query.toString()}`);
  },

  createTask: (task: Partial<CareTask>) => fetchJson<CareTask>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  }),

  completeTask: (id: string, completedBy?: string, notes?: string) => fetchJson<CareTask>(`/api/tasks/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ completedBy, notes })
  }),

  cancelTask: (id: string, reason: string) => fetchJson<CareTask>(`/api/tasks/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  }),

  deleteTask: (id: string) => fetchJson<{ message: string }>(`/api/tasks/${id}`, {
    method: 'DELETE'
  }),

  // Reminders
  getReminders: () => fetchJson<Reminder[]>('/api/reminders'),

  createReminder: (reminder: Partial<Reminder>) => fetchJson<Reminder>('/api/reminders', {
    method: 'POST',
    body: JSON.stringify(reminder)
  }),

  toggleReminder: (id: string) => fetchJson<Reminder>(`/api/reminders/${id}/toggle`, {
    method: 'PATCH'
  }),

  deleteReminder: (id: string) => fetchJson<{ message: string }>(`/api/reminders/${id}`, {
    method: 'DELETE'
  }),

  // Handovers
  getHandovers: () => fetchJson<HandoverReport[]>('/api/handovers'),

  generateHandover: (data: { outgoingCaregiver?: string; incomingCaregiver?: string; shiftTitle?: string }) => 
    fetchJson<HandoverReport>('/api/handovers/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  saveHandover: (handover: Partial<HandoverReport>) => fetchJson<HandoverReport>('/api/handovers', {
    method: 'POST',
    body: JSON.stringify(handover)
  }),

  // Activities
  getActivities: () => fetchJson<ActivityEvent[]>('/api/activities'),
  recordActivity: (event: Partial<ActivityEvent>) => fetchJson<ActivityEvent>('/api/activities', {
    method: 'POST',
    body: JSON.stringify(event)
  }),

  // Profile & Settings
  getProfile: () => fetchJson<CareProfile>('/api/profile'),
  updateProfile: (profile: Partial<CareProfile>) => fetchJson<CareProfile>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),

  getSettings: () => fetchJson<UserSettings>('/api/settings'),
  updateSettings: (settings: Partial<UserSettings>) => fetchJson<UserSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  // Reset Demo
  resetDemoData: () => fetchJson<{ message: string }>('/api/demo/reset', {
    method: 'POST'
  }),

  // AI Agent Chat
  sendAgentMessage: (message?: string, confirmedAction?: AgentConfirmation) => fetchJson<ChatMessage>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, confirmedAction })
  }),

  // Voice Assistant Endpoints (Alexa-Style Multi-Turn)
  sendVoiceTurn: (req: { sessionId?: string; transcript: string; language?: string; confirmedAction?: any }) => 
    fetchJson<import('../types').VoiceTurnResponse>('/api/voice/turn', {
      method: 'POST',
      body: JSON.stringify(req)
    }),

  getVoiceSession: (id?: string) => 
    fetchJson<import('../types').VoiceSessionState>(`/api/voice/session${id ? `/${id}` : ''}`),

  clearVoiceSession: (id: string) => 
    fetchJson<{ message: string }>(`/api/voice/session/${id}`, {
      method: 'DELETE'
    }),

  // MCP Tools
  getMcpTools: () => fetchJson<{ protocolVersion: string; tools: any[] }>('/api/mcp/tools'),
  invokeMcpTool: (name: string, args: Record<string, any>) => fetchJson<{ jsonrpc: string; result?: any; error?: any }>('/api/mcp/invoke', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args }
    })
  }),

  // Custom LLM Model & Fine-Tuning
  getModelHealth: () => fetchJson<{ status: string; baseModel: string; activeEngine: string; isAdapterLoaded: boolean; adapterMetadata: any; device: string }>('/api/model/health'),
  getModelConfig: () => fetchJson<any>('/api/model/config'),
  updateModelConfig: (cfg: any) => fetchJson<any>('/api/model/config', {
    method: 'POST',
    body: JSON.stringify(cfg)
  }),
  getModelEvaluation: () => fetchJson<any>('/api/model/evaluation'),
  getModelDatasetSummary: () => fetchJson<any>('/api/model/dataset-summary'),
  getModelLossHistory: () => fetchJson<any>('/api/model/loss-history'),
  runModelInference: (messages: Array<{ role: string; content: string }>) => fetchJson<any>('/api/model/inference', {
    method: 'POST',
    body: JSON.stringify({ messages })
  })
};

