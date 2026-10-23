import fs from 'fs';
import path from 'path';
import { CareTask, Reminder, HandoverReport, ActivityEvent, CareProfile, UserSettings } from '../types';

export const INITIAL_PROFILE: CareProfile = {
  id: 'profile-eleanor-vance',
  fullName: 'Eleanor Vance',
  preferredName: 'Eleanor',
  age: 78,
  relationship: 'Mother',
  roomNumber: 'Suite 2B',
  conditions: ['Type 2 Diabetes', 'Essential Hypertension', 'Mild Osteoarthritis'],
  allergies: ['Penicillin', 'Sulfa drugs'],
  bloodPressureGoal: '< 130/80 mmHg',
  bloodSugarGoal: '90 - 130 mg/dL (fasting)',
  primaryPhysician: 'Dr. Robert Chen, MD',
  physicianPhone: '(555) 234-8901',
  emergencyContact: 'Sarah Jenkins (Daughter)',
  emergencyPhone: '(555) 892-4411',
  pharmacy: 'CVS Care Pharmacy - Pine St.',
  caregivers: [
    { id: 'cg-1', name: 'Sarah Jenkins', role: 'Primary Family Caregiver', phone: '(555) 892-4411', isPrimary: true },
    { id: 'cg-2', name: 'Nurse David Morales, RN', role: 'Visiting Nurse', phone: '(555) 341-9982' },
    { id: 'cg-3', name: 'Elena Rostova, PT', role: 'Physical Therapist', phone: '(555) 672-1102' }
  ]
};

export const INITIAL_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'midnight',
  voiceEnabled: true,
  soundVolume: 0.8,
  requireConfirmations: true,
  autoHandoverEnabled: true,
  aiProvider: 'gemini',
  geminiModel: 'gemini-2.5-flash',
  simpleMode: false
};

export const INITIAL_TASKS: CareTask[] = [
  {
    id: 'task-1',
    title: 'Morning Fasting Blood Glucose Check',
    description: 'Measure fingerstick blood sugar before breakfast. Target: 90-130 mg/dL. Record reading in log.',
    category: 'vital_signs',
    priority: 'high',
    status: 'completed',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '08:00',
    completedAt: '2026-10-20T08:05:00Z',
    completedBy: 'Sarah Jenkins',
    notes: 'Reading: 112 mg/dL. Within target range. Eleanor felt energetic.',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Morning Medication: Metformin 500mg & Lisinopril 10mg',
    description: 'Administer with oatmeal breakfast and a full glass of water. Verify pill box compartment 20-AM.',
    category: 'medication',
    priority: 'urgent',
    status: 'completed',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '08:30',
    completedAt: '2026-10-20T08:32:00Z',
    completedBy: 'Sarah Jenkins',
    notes: 'Taken on schedule with breakfast. No gastrointestinal distress.',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Lower Limb Mobility & Balance Routine',
    description: '15 minutes seated ankle pumps, assisted standing balance, and gentle hallway walk with walker.',
    category: 'physical_therapy',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Nurse David Morales, RN',
    dueDate: '2026-10-20',
    dueTime: '11:00',
    completedAt: '2026-10-20T11:25:00Z',
    completedBy: 'Nurse David Morales, RN',
    notes: 'Completed 2 full laps of the living hall. Good gait stability today, no dizziness reported.',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-4',
    title: 'Midday Hydration & Low-Sodium Lunch',
    description: 'Steamed salmon, brown rice, and steamed broccoli. Ensure at least 300ml electrolyte water intake.',
    category: 'nutrition',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '12:30',
    completedAt: '2026-10-20T12:45:00Z',
    completedBy: 'Sarah Jenkins',
    notes: 'Ate 90% of portion. Hydration goal met with 350ml lemon-infused water.',
    reminderLinked: false,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-5',
    title: 'Afternoon Blood Pressure & Heart Rate Reading',
    description: 'Seated resting measurement after 5 minutes of quiet resting. Left arm cuff.',
    category: 'vital_signs',
    priority: 'high',
    status: 'completed',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '15:30',
    completedAt: '2026-10-20T15:35:00Z',
    completedBy: 'Sarah Jenkins',
    notes: '124/76 mmHg, Pulse: 68 bpm. Excellent reading.',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-6',
    title: 'Evening Medication: Atorvastatin 20mg & Calcium + Vit D',
    description: 'Administer with evening snack or glass of milk. Verify pill box compartment 20-PM.',
    category: 'medication',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '19:30',
    notes: 'Awaiting evening meal.',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-7',
    title: 'Respiratory Humidifier Refill & Night Routine',
    description: 'Clean reservoir, refill with distilled water, set bedroom humidity to 45%. Set bedside water carafe.',
    category: 'hygiene',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-20',
    dueTime: '21:00',
    reminderLinked: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'task-8',
    title: 'Schedule Annual Ophthalmology Retinal Exam',
    description: 'Annual diabetic eye screening with Dr. Aris Thorne. Call (555) 772-0199.',
    category: 'appointment',
    priority: 'low',
    status: 'pending',
    assignedTo: 'Sarah Jenkins',
    dueDate: '2026-10-21',
    dueTime: '10:00',
    reminderLinked: false,
    createdAt: '2026-10-19T10:00:00Z'
  }
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    taskId: 'task-2',
    title: 'Morning Medication: Metformin & Lisinopril',
    category: 'medication',
    time: '08:30',
    frequency: 'daily',
    isActive: true,
    soundEnabled: true,
    recipientName: 'Eleanor Vance',
    lastTriggered: '2026-10-20T08:30:00Z',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'rem-2',
    taskId: 'task-3',
    title: 'Hallway Walk & Physical Therapy Mobility',
    category: 'physical_therapy',
    time: '11:00',
    frequency: 'daily',
    isActive: true,
    soundEnabled: true,
    recipientName: 'Eleanor Vance',
    lastTriggered: '2026-10-20T11:00:00Z',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'rem-3',
    taskId: 'task-5',
    title: 'Afternoon Blood Pressure Check',
    category: 'vital_signs',
    time: '15:30',
    frequency: 'daily',
    isActive: true,
    soundEnabled: true,
    recipientName: 'Eleanor Vance',
    lastTriggered: '2026-10-20T15:30:00Z',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'rem-4',
    taskId: 'task-6',
    title: 'Evening Medication: Atorvastatin & Calcium',
    category: 'medication',
    time: '19:30',
    frequency: 'daily',
    isActive: true,
    soundEnabled: true,
    recipientName: 'Eleanor Vance',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'rem-5',
    taskId: 'task-7',
    title: 'Bedroom Humidifier & Evening Hydration',
    category: 'hygiene',
    time: '21:00',
    frequency: 'daily',
    isActive: true,
    soundEnabled: true,
    recipientName: 'Eleanor Vance',
    createdAt: '2026-10-15T09:00:00Z'
  }
];

export const INITIAL_HANDOVERS: HandoverReport[] = [
  {
    id: 'handover-1',
    shiftDate: '2026-10-20',
    shiftTime: 'Morning Shift (07:00 - 15:00)',
    outgoingCaregiver: 'Nurse David Morales, RN',
    incomingCaregiver: 'Sarah Jenkins (Primary)',
    completedTasksCount: 4,
    pendingTasksCount: 3,
    vitalObservations: 'Fasting glucose was 112 mg/dL. Morning BP 124/76 mmHg. No edema observed in lower extremities. Appetite excellent.',
    clinicalNotes: 'Eleanor completed two full hallway walking laps using her walker with good posture. She expressed desire to sit in the garden patio later this afternoon. All morning pills verified taken.',
    pendingItems: [
      'Evening Atorvastatin 20mg at 19:30 with milk',
      'Refill humidifier reservoir before 21:00',
      'Confirm tomorrow morning appointment call for Dr. Thorne'
    ],
    emergencyChecklistCompleted: true,
    createdAt: '2026-10-20T15:15:00Z'
  }
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    timestamp: '2026-10-23T09:45:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'health',
    description: 'Completed task: Morning Fasting Blood Glucose Check (Result: 108 mg/dL)',
    recordId: 'task-1',
    recordType: 'task',
    metadata: { reading: '108 mg/dL', target: '90-130 mg/dL', status: 'optimal' }
  },
  {
    id: 'act-2',
    timestamp: '2026-10-23T09:15:30Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'medication',
    description: 'Completed task: Morning Medication: Metformin 500mg & Lisinopril 10mg verified taken with breakfast',
    recordId: 'task-2',
    recordType: 'task',
    metadata: { pills: ['Metformin 500mg', 'Lisinopril 10mg'], breakfastTaken: true }
  },
  {
    id: 'act-3',
    timestamp: '2026-10-23T08:30:00Z',
    actor: 'EchoCare Agent',
    actorRole: 'assistant',
    actionType: 'reminder_created',
    eventType: 'personal_care',
    description: 'Scheduled proactive Hydration & Electrolyte prompt for 11:30 AM',
    recordType: 'reminder',
    metadata: { targetVolume: '350ml', schedule: '11:30' }
  },
  {
    id: 'act-4',
    timestamp: '2026-10-22T17:15:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'social',
    description: 'Family Check-in: Connected Eleanor on a 25-minute video call with grandson Lucas in Chicago',
    recordType: 'task',
    metadata: { platform: 'Tablet Video Portal', durationMinutes: 25, mood: 'cheerful' }
  },
  {
    id: 'act-5',
    timestamp: '2026-10-22T15:30:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'health',
    description: 'Completed task: Afternoon Blood Pressure Check (Result: 124/76 mmHg, Pulse: 68 bpm)',
    recordId: 'task-5',
    recordType: 'task',
    metadata: { systolic: 124, diastolic: 76, pulse: 68 }
  },
  {
    id: 'act-6',
    timestamp: '2026-10-22T12:45:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'personal_care',
    description: 'Completed task: Midday Hydration & Low-Sodium Lunch (Lemon chicken, brown rice, 400ml water)',
    recordId: 'task-4',
    recordType: 'task',
    metadata: { foodIntakePercent: 95, fluidConsumedMl: 400 }
  },
  {
    id: 'act-7',
    timestamp: '2026-10-21T15:15:30Z',
    actor: 'EchoCare Agent',
    actorRole: 'assistant',
    actionType: 'handover_generated',
    eventType: 'social',
    description: 'Compiled Caregiver Handover report for Day Shift (Nurse David -> Sarah Jenkins)',
    recordId: 'handover-1',
    recordType: 'handover',
    metadata: { outgoing: 'Nurse David Morales, RN', incoming: 'Sarah Jenkins' }
  },
  {
    id: 'act-8',
    timestamp: '2026-10-21T11:25:00Z',
    actor: 'Nurse David Morales, RN',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'health',
    description: 'Completed task: Lower Limb Mobility & Balance Routine (2 laps living hall with walker)',
    recordId: 'task-3',
    recordType: 'task',
    metadata: { laps: 2, gaitStability: 'stable', painReported: false }
  },
  {
    id: 'act-9',
    timestamp: '2026-10-20T19:30:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'medication',
    description: 'Administered Evening Medication: Atorvastatin 20mg & Calcium with warm skim milk',
    recordId: 'task-6',
    recordType: 'task',
    metadata: { pills: ['Atorvastatin 20mg', 'Calcium + Vit D'] }
  },
  {
    id: 'act-10',
    timestamp: '2026-10-20T18:00:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'social',
    description: 'Social accompaniment: 20-minute patio garden flower viewing and birdwatching conversation',
    recordType: 'task',
    metadata: { location: 'Garden Patio', weather: 'pleasant, 72F' }
  },
  {
    id: 'act-11',
    timestamp: '2026-10-18T14:00:00Z',
    actor: 'EchoCare System',
    actorRole: 'system',
    actionType: 'tool_executed',
    eventType: 'health',
    description: 'Executed tool "sync_physician_care_plan" and validated medication dosages with CVS Care Pharmacy',
    recordType: 'system',
    metadata: { physician: 'Dr. Robert Chen, MD', status: 'verified' }
  },
  {
    id: 'act-12',
    timestamp: '2026-10-15T09:00:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_completed',
    eventType: 'personal_care',
    description: 'Assisted Eleanor with gentle hair brushing, warm facial towel routine, and lavender lotion',
    recordType: 'task',
    metadata: { category: 'hygiene', skinIntegrity: 'healthy' }
  }
];

class MemoryStore {
  tasks: CareTask[] = JSON.parse(JSON.stringify(INITIAL_TASKS));
  reminders: Reminder[] = JSON.parse(JSON.stringify(INITIAL_REMINDERS));
  handovers: HandoverReport[] = JSON.parse(JSON.stringify(INITIAL_HANDOVERS));
  activities: ActivityEvent[] = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
  profile: CareProfile = JSON.parse(JSON.stringify(INITIAL_PROFILE));
  settings: UserSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

  reset() {
    this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
    this.reminders = JSON.parse(JSON.stringify(INITIAL_REMINDERS));
    this.handovers = JSON.parse(JSON.stringify(INITIAL_HANDOVERS));
    this.activities = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
    this.profile = JSON.parse(JSON.stringify(INITIAL_PROFILE));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

    this.recordActivity({
      actor: 'Sarah Jenkins',
      actorRole: 'caregiver',
      actionType: 'profile_updated',
      description: 'Reset application database to initial benchmark demonstration records',
      recordType: 'system'
    });
  }

  recordActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    let eventType = event.eventType;
    if (!eventType) {
      const text = `${event.description} ${event.actionType} ${event.recordType || ''}`.toLowerCase();
      if (text.includes('medication') || text.includes('metformin') || text.includes('lisinopril') || text.includes('atorvastatin') || text.includes('pill') || text.includes('dose') || text.includes('pharmacy') || text.includes('rx')) {
        eventType = 'medication';
      } else if (text.includes('blood pressure') || text.includes('glucose') || text.includes('vital') || text.includes('sugar') || text.includes('pulse') || text.includes('mobility') || text.includes('therapy') || text.includes('physician') || text.includes('doctor')) {
        eventType = 'health';
      } else if (text.includes('hydration') || text.includes('lunch') || text.includes('meal') || text.includes('breakfast') || text.includes('dinner') || text.includes('humidifier') || text.includes('hygiene') || text.includes('water') || text.includes('bath') || text.includes('sleep')) {
        eventType = 'personal_care';
      } else if (text.includes('handover') || text.includes('social') || text.includes('call') || text.includes('visit') || text.includes('family') || text.includes('daughter') || text.includes('grandson') || text.includes('conversation')) {
        eventType = 'social';
      } else {
        eventType = 'health';
      }
    }

    const fullEvent: ActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      ...event
    };
    this.activities.unshift(fullEvent);
    if (this.activities.length > 200) {
      this.activities.pop();
    }
    return fullEvent;
  }
}

export const dataStore = new MemoryStore();
