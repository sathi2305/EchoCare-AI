export type TaskCategory = 
  | 'medication' 
  | 'vital_signs' 
  | 'physical_therapy' 
  | 'nutrition' 
  | 'hygiene' 
  | 'household' 
  | 'appointment';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CareTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  reminderLinked?: boolean;
  createdAt: string;
}

export type ReminderFrequency = 'once' | 'daily' | 'twice_daily' | 'weekly' | 'custom';

export interface Reminder {
  id: string;
  taskId?: string;
  title: string;
  category: TaskCategory;
  time: string; // HH:mm
  frequency: ReminderFrequency;
  isActive: boolean;
  soundEnabled: boolean;
  recipientName: string;
  lastTriggered?: string;
  createdAt: string;
}

export interface HandoverReport {
  id: string;
  shiftDate: string;
  shiftTime: string;
  outgoingCaregiver: string;
  incomingCaregiver: string;
  completedTasksCount: number;
  pendingTasksCount: number;
  vitalObservations: string;
  clinicalNotes: string;
  pendingItems: string[];
  emergencyChecklistCompleted: boolean;
  createdAt: string;
}

export type ActionActorRole = 'assistant' | 'caregiver' | 'system' | 'family';

export type ActionType = 
  | 'task_created' 
  | 'task_completed' 
  | 'task_updated' 
  | 'task_cancelled' 
  | 'reminder_created' 
  | 'reminder_toggled' 
  | 'handover_generated' 
  | 'tool_executed' 
  | 'alert_raised'
  | 'profile_updated';

export type ActivityEventType = 'medication' | 'personal_care' | 'social' | 'health';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: ActionActorRole;
  actionType: ActionType;
  description: string;
  eventType?: ActivityEventType;
  recordId?: string;
  recordType?: 'task' | 'reminder' | 'handover' | 'system';
  metadata?: Record<string, any>;
}

export interface CareProfile {
  id: string;
  fullName: string;
  preferredName: string;
  age: number;
  relationship: string;
  roomNumber: string;
  conditions: string[];
  allergies: string[];
  bloodPressureGoal: string;
  bloodSugarGoal: string;
  primaryPhysician: string;
  physicianPhone: string;
  emergencyContact: string;
  emergencyPhone: string;
  pharmacy: string;
  caregivers: Array<{
    id: string;
    name: string;
    role: string;
    phone: string;
    isPrimary?: boolean;
  }>;
}

export interface AgentConfirmation {
  id: string;
  toolName: string;
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface ToolExecutionRecord {
  tool: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'running' | 'success' | 'failed';
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolExecution?: ToolExecutionRecord;
  confirmation?: AgentConfirmation;
}

export interface DashboardMetrics {
  totalTasksToday: number;
  completedTasksToday: number;
  pendingTasksToday: number;
  overdueTasksCount: number;
  activeRemindersCount: number;
  completionRatePercent: number;
  nextScheduledTask?: CareTask;
  activeCaregiver: string;
}

export interface UserSettings {
  language: 'en' | 'ta' | 'hi';
  theme: 'dark' | 'midnight';
  voiceEnabled: boolean;
  soundVolume: number;
  requireConfirmations: boolean;
  autoHandoverEnabled: boolean;
  aiProvider: 'gemini' | 'deterministic';
  geminiModel: string;
  simpleMode?: boolean;
}

export interface VoiceSessionSlot {
  slotType: 'none' | 'reminder_time' | 'reminder_ampm' | 'reminder_confirmation' | 'task_confirmation' | 'task_title' | 'cancel_confirmation' | 'clarification';
  pendingData: Record<string, any>;
  promptText: string;
}

export interface VoiceSessionState {
  sessionId: string;
  activeSlot: VoiceSessionSlot;
  sessionLanguage?: string;
  lastDiscussedTaskId?: string;
  lastDiscussedReminderId?: string;
  recentlyCreatedReminderId?: string;
  recentlyCreatedTaskId?: string;
  lastSpokenText?: string;
  turnCount: number;
  updatedAt: string;
}

export interface VoiceTurnRequest {
  sessionId?: string;
  transcript: string;
  language?: string;
  confirmedAction?: AgentConfirmation;
}

export interface VoiceTurnResponse {
  sessionId: string;
  spokenText: string;
  displayText: string;
  toolExecution?: ToolExecutionRecord;
  confirmation?: AgentConfirmation;
  sessionState: VoiceSessionState;
  suggestedFollowUps?: string[];
  requiresVoiceResponse?: boolean;
}

export interface VoiceSettings {
  wakeWordEnabled: boolean;
  wakeWordPhrase: string;
  continuousListening: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  selectedVoiceName?: string;
  autoListenAfterReply: boolean;
  soundEffectsEnabled: boolean;
  language: 'en-US' | 'ta-IN' | 'hi-IN';
  simpleMode?: boolean;
  responseLength?: 'concise' | 'detailed';
}

