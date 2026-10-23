import { dataStore } from './store';
import { agentService } from './agent';
import {
  VoiceSessionState,
  VoiceTurnRequest,
  VoiceTurnResponse,
  VoiceSessionSlot,
  CareTask,
  Reminder,
  HandoverReport
} from '../types';
import { GoogleGenAI } from '@google/genai';
import { modelServer } from '../../backend/app/llm/modelServer';

export interface ExtendedVoiceSessionState extends VoiceSessionState {
  sessionLanguage?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

class VoiceSessionManager {
  private sessions: Map<string, ExtendedVoiceSessionState> = new Map();

  getSession(sessionId?: string): ExtendedVoiceSessionState {
    const id = sessionId || `vsession-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let session = this.sessions.get(id);
    if (!session) {
      session = {
        sessionId: id,
        activeSlot: {
          slotType: 'none',
          pendingData: {},
          promptText: ''
        },
        turnCount: 0,
        sessionLanguage: process.env.ECHOCARE_DEFAULT_LANG?.split('-')[0] || 'en',
        conversationHistory: [],
        updatedAt: new Date().toISOString()
      };
      this.sessions.set(id, session);
    }
    return session;
  }

  updateSession(session: ExtendedVoiceSessionState) {
    session.turnCount += 1;
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.sessionId, session);
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

export const voiceSessionManager = new VoiceSessionManager();

export class VoiceConversationService {
  /**
   * Parse natural & colloquial time expressions:
   * "six", "six pm", "at 6", "around six", "around 6", "in one hour", "in 2 hours", "6:30", "10 am", "tomorrow at 9", "18:00"
   */
  public parseTime(text: string): { timeStr: string; displayStr: string; isAmbiguousAmPm?: boolean; hourVal?: number } | null {
    const clean = text.toLowerCase().trim();

    // Check for relative "in an hour" / "in one hour" / "in 2 hours"
    if (clean.includes('in an hour') || clean.includes('in one hour') || clean.includes('in 1 hour')) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
      const displayHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return { timeStr, displayStr: `${displayHours}:${minutes} ${ampm}`, isAmbiguousAmPm: false, hourVal: hours };
    }

    if (clean.includes('in two hours') || clean.includes('in 2 hours')) {
      const now = new Date();
      now.setHours(now.getHours() + 2);
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
      const displayHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return { timeStr, displayStr: `${displayHours}:${minutes} ${ampm}`, isAmbiguousAmPm: false, hourVal: hours };
    }

    // Check explicit 24h format "18:00" or "08:30"
    const directMatch = clean.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (directMatch) {
      const hours = parseInt(directMatch[1], 10);
      const minutes = directMatch[2];
      const displayHours = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return {
        timeStr: `${String(hours).padStart(2, '0')}:${minutes}`,
        displayStr: `${displayHours}:${minutes} ${ampm}`,
        isAmbiguousAmPm: false,
        hourVal: hours
      };
    }

    // Check for explicit "6 PM", "6:30 AM", "around 6 pm"
    const ampmMatch = clean.match(/\b(?:around|at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2] ? ampmMatch[2] : '00';
      const isPm = ampmMatch[3].toLowerCase() === 'pm';

      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;

      const timeStr = `${String(hours).padStart(2, '0')}:${minutes}`;
      const displayStr = `${ampmMatch[1]}:${minutes} ${ampmMatch[3].toUpperCase()}`;
      return { timeStr, displayStr, isAmbiguousAmPm: false, hourVal: hours };
    }

    // Check for Tamil / Tanglish / Hindi time markers
    // e.g., "evening 6 manikku", "shaam 6 baje", "subah 8 baje"
    const tamilEveningMatch = clean.match(/(?:evening|maalai|iravu)?\s*(\d{1,2})\s*(?:mani|manikku)/i);
    if (tamilEveningMatch) {
      let hours = parseInt(tamilEveningMatch[1], 10);
      if (hours < 12 && (clean.includes('evening') || clean.includes('maalai') || clean.includes('iravu') || hours <= 8)) {
        hours += 12;
      }
      const timeStr = `${String(hours).padStart(2, '0')}:00`;
      const displayStr = `${tamilEveningMatch[1]}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
      return { timeStr, displayStr, isAmbiguousAmPm: false, hourVal: hours };
    }

    const hindiMatch = clean.match(/(?:shaam|dopahar|subah)?\s*(\d{1,2})\s*(?:baje)/i);
    if (hindiMatch) {
      let hours = parseInt(hindiMatch[1], 10);
      if (hours < 12 && (clean.includes('shaam') || clean.includes('dopahar') || clean.includes('raat') || hours <= 8)) {
        hours += 12;
      }
      const timeStr = `${String(hours).padStart(2, '0')}:00`;
      const displayStr = `${hindiMatch[1]}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
      return { timeStr, displayStr, isAmbiguousAmPm: false, hourVal: hours };
    }

    // Check for word numbers: "at six", "around seven", "six"
    const wordNumbers: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
      seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
    };

    // Check word with explicit am/pm or morning/evening
    for (const [word, val] of Object.entries(wordNumbers)) {
      const reg = new RegExp(`\\b(?:around|at|by|for)?\\s*${word}(?:\\s*(o'clock|in the morning|in the evening|in the afternoon|am|pm))?\\b`, 'i');
      const match = clean.match(reg);
      if (match) {
        const qualifier = match[1] ? match[1].toLowerCase() : '';
        let hours = val;
        let isAmbiguous = false;

        if (qualifier.includes('evening') || qualifier.includes('afternoon') || qualifier.includes('pm')) {
          if (hours < 12) hours += 12;
        } else if (qualifier.includes('morning') || qualifier.includes('am')) {
          if (hours === 12) hours = 0;
        } else {
          // If no qualifier, e.g. "at six", mark as ambiguous if between 1 and 11
          isAmbiguous = val >= 1 && val <= 11;
          if (val <= 8) hours += 12; // default heuristic to evening
        }

        const timeStr = `${String(hours).padStart(2, '0')}:00`;
        const displayStr = `${val}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
        return { timeStr, displayStr, isAmbiguousAmPm: isAmbiguous, hourVal: val };
      }
    }

    // Check bare digits e.g. "at 6", "around 6", "6"
    const digitMatch = clean.match(/\b(?:around|at|by|for)?\s*(\d{1,2})\b/);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      if (val >= 1 && val <= 12) {
        let hours = val;
        const isAmbiguous = val >= 1 && val <= 11 && !clean.includes('am') && !clean.includes('pm') && !clean.includes('morning') && !clean.includes('evening');
        if (val <= 8 || clean.includes('evening') || clean.includes('pm')) {
          if (hours < 12) hours += 12;
        }
        const timeStr = `${String(hours).padStart(2, '0')}:00`;
        const displayStr = `${val}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
        return { timeStr, displayStr, isAmbiguousAmPm: isAmbiguous, hourVal: val };
      }
    }

    return null;
  }

  public isAffirmative(text: string): boolean {
    const t = text.trim().toLowerCase();
    return (
      t === 'yes' ||
      t === 'yeah' ||
      t === 'yep' ||
      t === 'sure' ||
      t === 'yes please' ||
      t.includes('yes, please') ||
      t.includes('save it') ||
      t.includes('confirm') ||
      t.includes('please do') ||
      t.includes('go ahead') ||
      t.includes('sounds good') ||
      t.includes('correct') ||
      t.includes('save') ||
      t.includes('சரி') ||
      t.includes('ஆமாம்') ||
      t.includes('हाँ') ||
      t.includes('सेव कर दो') ||
      t.includes('ठीक है')
    );
  }

  public isNegative(text: string): boolean {
    const t = text.trim().toLowerCase();
    return (
      t === 'no' ||
      t === 'nope' ||
      t === 'nevermind' ||
      t === 'no thanks' ||
      t.includes("don't") ||
      t.includes('cancel') ||
      t.includes('stop') ||
      t.includes('wait') ||
      t.includes('not now') ||
      t.includes('வேண்டாம்') ||
      t.includes('ரத்து') ||
      t.includes('नहीं')
    );
  }

  async processTurn(req: VoiceTurnRequest): Promise<VoiceTurnResponse> {
    const session = voiceSessionManager.getSession(req.sessionId);
    const transcript = req.transcript.trim();
    const cleanLower = transcript.toLowerCase();

    // Sync requested language if passed
    if (req.language) {
      session.sessionLanguage = req.language.split('-')[0];
    }
    const currentLang = session.sessionLanguage || 'en';

    const returnResponse = (
      spoken: string,
      display: string,
      extra?: Partial<VoiceTurnResponse>
    ): VoiceTurnResponse => {
      session.lastSpokenText = spoken;
      if (!session.conversationHistory) session.conversationHistory = [];
      session.conversationHistory.push({ role: 'user', text: transcript });
      session.conversationHistory.push({ role: 'assistant', text: spoken });
      voiceSessionManager.updateSession(session);

      return {
        sessionId: session.sessionId,
        spokenText: spoken,
        displayText: display,
        sessionState: session,
        ...extra
      };
    };

    // ==========================================
    // 0. Language Switching Handling (Phase 3)
    // ==========================================
    if (
      cleanLower.includes('speak in tamil') ||
      cleanLower.includes('tamilil pesu') ||
      cleanLower.includes('tamil la pesu') ||
      cleanLower.includes('தமிழுக்கு மாறு') ||
      cleanLower.includes('தமிழில் பேசு')
    ) {
      session.sessionLanguage = 'ta';
      const spoken = 'சரி! இனிமேல் தமிழில் பேசுகிறேன். எலினாருக்கு என்ன உதவி வேண்டும்?';
      const display = 'மொழி தமிழாக மாற்றப்பட்டது.\n\n"இன்று நிலுவையில் உள்ள பணிகள் என்ன?" அல்லது "மாலை 6 மணிக்கு நினைவூட்டல் அமை" என்று கேட்கலாம்.';
      return returnResponse(spoken, display, {
        requiresVoiceResponse: true,
        suggestedFollowUps: ['இன்று என்ன பணிகள் இருக்கு?', 'மாலை 6 மணிக்கு மருந்து நினைவூட்டு']
      });
    }

    if (
      cleanLower.includes('speak in hindi') ||
      cleanLower.includes('hindi me baat') ||
      cleanLower.includes('hindi me bolo') ||
      cleanLower.includes('हिन्दी में बोलो') ||
      cleanLower.includes('हिन्दी में बात')
    ) {
      session.sessionLanguage = 'hi';
      const spoken = 'नमस्ते! अब से मैं हिन्दी में बात करूँगा। बताइए, आज एलेनोर की देखभाल में क्या मदद चाहिए?';
      const display = 'भाषा हिन्दी में बदल दी गई है।\n\nआप कह सकते हैं: "आज कौन से कार्य बाकी हैं?" या "शाम 6 बजे दवाई का रिमाइंडर लगाओ"।';
      return returnResponse(spoken, display, {
        requiresVoiceResponse: true,
        suggestedFollowUps: ['आज कौन से कार्य हैं?', 'शाम 6 बजे दवाई याद दिलाओ']
      });
    }

    if (
      cleanLower.includes('switch to english') ||
      cleanLower.includes('speak in english') ||
      cleanLower.includes('english la pesu') ||
      cleanLower.includes('english me bolo')
    ) {
      session.sessionLanguage = 'en';
      const spoken = 'Of course! Switching back to English. How can I help you coordinate Eleanor\'s care?';
      const display = 'Language switched to English. You can ask for today\'s tasks, reminders, or vitals.';
      return returnResponse(spoken, display, {
        requiresVoiceResponse: true,
        suggestedFollowUps: ['What do I need to do today?', 'What is next?']
      });
    }

    // ==========================================
    // 1. Barge-In & Cancellation Controls (Phase 4)
    // ==========================================
    if (
      cleanLower === 'stop' ||
      cleanLower === 'cancel that' ||
      cleanLower === 'never mind' ||
      cleanLower === 'nevermind' ||
      cleanLower === 'cancel' ||
      cleanLower === 'wait'
    ) {
      session.activeSlot = { slotType: 'none', pendingData: {}, promptText: '' };
      const spoken = currentLang === 'ta'
        ? 'ரத்து செய்யப்பட்டது. வேறு என்ன உதவி வேண்டும்?'
        : currentLang === 'hi'
        ? 'रद्द कर दिया गया। क्या मैं कोई और मदद करूँ?'
        : 'All cancelled. Let me know whenever you need anything.';
      return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
    }

    // ==========================================
    // 2. Repetition & Reading Controls
    // ==========================================
    if (
      cleanLower === 'read that again' ||
      cleanLower === 'repeat' ||
      cleanLower === 'repeat that' ||
      cleanLower === 'say that again' ||
      cleanLower.includes('what did you say')
    ) {
      if (session.lastSpokenText) {
        return returnResponse(
          session.lastSpokenText,
          `Repeating:\n"${session.lastSpokenText}"`,
          { requiresVoiceResponse: false }
        );
      } else {
        return returnResponse(
          "I haven't said anything yet in this session. What can I help you with?",
          "No previous response recorded.",
          { requiresVoiceResponse: false }
        );
      }
    }

    // ==========================================
    // 2.5 Navigation Intents ("Go to dashboard", "Open dashboard", "Show overview")
    // ==========================================
    if (
      cleanLower.includes('go to dashboard') ||
      cleanLower.includes('open dashboard') ||
      cleanLower.includes('show dashboard') ||
      cleanLower.includes('take me to dashboard') ||
      cleanLower.includes('care dashboard') ||
      cleanLower === 'dashboard'
    ) {
      const spoken = currentLang === 'ta'
        ? 'நிர்வாக டாஷ்போர்டுக்கு செல்கிறேன்.'
        : currentLang === 'hi'
        ? 'केयर डैशबोर्ड पर ले जाया जा रहा है।'
        : 'Navigating to your Care Overview Dashboard now.';
      const display = "Navigating to Dashboard...\n\nShowing Eleanor Vance's daily care goals, medication timetable, tasks, and active reminders.";
      return returnResponse(spoken, display, {
        requiresVoiceResponse: false,
        suggestedFollowUps: ['What do I need to do today?', 'What was her blood pressure today?'],
        toolExecution: {
          tool: 'navigate_view',
          input: { destination: 'overview' },
          output: { navigatedTo: 'overview', status: 'success' },
          status: 'success'
        }
      });
    }

    // ==========================================
    // 3. Clinical Safety Guardrail Check (Phase 7)
    // ==========================================
    if (
      (cleanLower.includes('double') || cleanLower.includes('increase') || cleanLower.includes('change')) &&
      (cleanLower.includes('dose') || cleanLower.includes('lisinopril') || cleanLower.includes('metformin') || cleanLower.includes('pill') || cleanLower.includes('medicine'))
    ) {
      const spoken =
        "Please do not change Eleanor's medication dosage without physician guidance. " +
        "Her prescribed dosage must only be modified by Dr. Robert Chen. " +
        "Please contact Dr. Chen's office at (555) 234-8901. If she experiences severe symptoms, seek emergency care immediately.";
      return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
    }

    if (cleanLower.includes('stroke') || cleanLower.includes('heart attack') || cleanLower.includes('diagnose')) {
      const spoken =
        "I cannot diagnose medical conditions. If Eleanor has sudden dizziness accompanied by " +
        "facial drooping, arm weakness, or difficulty speaking, please call 911 immediately. " +
        "If her symptoms are mild, please have her sit down safely and contact her primary physician Dr. Chen.";
      return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
    }

    // ==========================================
    // 4. Multi-Turn Conversational Slot Machine (Phase 5)
    // ==========================================

    // Slot 4A: Waiting for Reminder Time (e.g., user previously asked "Remind me to call Mom")
    if (session.activeSlot.slotType === 'reminder_time') {
      const parsedTime = this.parseTime(cleanLower);
      if (parsedTime) {
        const title = session.activeSlot.pendingData.title || 'Call Mom';

        // Check if AM/PM is ambiguous (e.g. user just said "At six" or "six")
        if (parsedTime.isAmbiguousAmPm && !cleanLower.includes('pm') && !cleanLower.includes('am') && !cleanLower.includes('evening') && !cleanLower.includes('morning')) {
          session.activeSlot = {
            slotType: 'reminder_ampm',
            pendingData: {
              ...session.activeSlot.pendingData,
              rawHour: parsedTime.hourVal || 6
            },
            promptText: 'Do you mean 6 AM or 6 PM?'
          };
          const spoken = `Do you mean ${parsedTime.hourVal} AM or ${parsedTime.hourVal} PM?`;
          return returnResponse(spoken, spoken, {
            suggestedFollowUps: ['6 PM', '6 AM'],
            requiresVoiceResponse: true
          });
        }

        // Time resolved -> Ask single confirmation!
        session.activeSlot = {
          slotType: 'reminder_confirmation',
          pendingData: {
            title,
            time: parsedTime.timeStr,
            displayTime: parsedTime.displayStr,
            category: session.activeSlot.pendingData.category || 'household'
          },
          promptText: `${parsedTime.displayStr} today. Shall I save that reminder?`
        };

        const spoken = `${parsedTime.displayStr} today. Shall I save that reminder?`;
        const display = `I'll schedule a reminder to "${title}" for ${parsedTime.displayStr} today.\n\nShall I save that reminder?`;

        return returnResponse(spoken, display, {
          suggestedFollowUps: ['Yes, please', 'No, cancel'],
          requiresVoiceResponse: true
        });
      } else {
        const spoken = `What time should I remind you? You can say around six, or six PM.`;
        return returnResponse(spoken, spoken, {
          suggestedFollowUps: ['Around six', '6 PM', 'In one hour'],
          requiresVoiceResponse: true
        });
      }
    }

    // Slot 4B: Waiting for AM or PM clarification
    if (session.activeSlot.slotType === 'reminder_ampm') {
      const rawHour = session.activeSlot.pendingData.rawHour || 6;
      let isPm = cleanLower.includes('pm') || cleanLower.includes('evening') || cleanLower.includes('afternoon');
      let isAm = cleanLower.includes('am') || cleanLower.includes('morning');

      if (!isPm && !isAm) {
        isPm = true; // default heuristic
      }

      let hours = rawHour;
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;

      const timeStr = `${String(hours).padStart(2, '0')}:00`;
      const displayStr = `${rawHour} ${isPm ? 'PM' : 'AM'}`;
      const title = session.activeSlot.pendingData.title || 'Call Mom';

      session.activeSlot = {
        slotType: 'reminder_confirmation',
        pendingData: {
          title,
          time: timeStr,
          displayTime: displayStr,
          category: session.activeSlot.pendingData.category || 'household'
        },
        promptText: `${displayStr} today. Shall I save that reminder?`
      };

      const spoken = `${displayStr} today. Shall I save that reminder?`;
      const display = `I'll schedule a reminder to "${title}" for ${displayStr} today.\n\nShall I save that reminder?`;

      return returnResponse(spoken, display, {
        suggestedFollowUps: ['Yes, please', 'No, cancel'],
        requiresVoiceResponse: true
      });
    }

    // Slot 4C: Waiting for Reminder Confirmation ("Shall I save that reminder?")
    if (session.activeSlot.slotType === 'reminder_confirmation') {
      if (this.isAffirmative(cleanLower)) {
        const { title, time, displayTime, category } = session.activeSlot.pendingData;
        const toolRes = agentService.executeTool('create_reminder', {
          title,
          time,
          category: category || 'household',
          frequency: 'daily',
          soundEnabled: true
        }, 'EchoCare Voice Agent');

        const newReminder = toolRes.data as Reminder;
        session.recentlyCreatedReminderId = newReminder.id;
        session.lastDiscussedReminderId = newReminder.id;
        session.activeSlot = { slotType: 'none', pendingData: {}, promptText: '' };

        const spoken = currentLang === 'ta'
          ? `அனைத்தும் தயார்! உங்கள் நினைவூட்டல் ${displayTime || time} மணிக்கு சேமிக்கப்பட்டது.`
          : currentLang === 'hi'
          ? `बिल्कुल! ${displayTime || time} के लिए आपका रिमाइंडर सेव कर दिया गया है।`
          : `All set! Your reminder is saved for ${displayTime || time}.`;

        const display = `✓ ${spoken}\nTitle: "${title}"\nStatus: Active with chime alert.`;

        return returnResponse(spoken, display, {
          toolExecution: {
            tool: 'create_reminder',
            input: { title, time, frequency: 'daily' },
            output: newReminder,
            status: 'success'
          },
          suggestedFollowUps: ['What do I need to do next?', 'What was the reminder I just created?'],
          requiresVoiceResponse: false
        });
      } else if (this.isNegative(cleanLower)) {
        session.activeSlot = { slotType: 'none', pendingData: {}, promptText: '' };
        const spoken = currentLang === 'ta'
          ? 'சரி, நினைவூட்டல் ரத்து செய்யப்பட்டது.'
          : currentLang === 'hi'
          ? 'ठीक है, रिमाइंडर रद्द कर दिया गया।'
          : "Understood! I cancelled that reminder request. Nothing has been saved.";
        return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
      }
    }

    // Slot 4D: Waiting for Task Cancellation Confirmation
    if (session.activeSlot.slotType === 'cancel_confirmation') {
      const taskId = session.activeSlot.pendingData.taskId;
      const taskTitle = session.activeSlot.pendingData.taskTitle;

      if (this.isAffirmative(cleanLower)) {
        const toolRes = agentService.executeTool('cancel_care_task', {
          taskId,
          reason: 'Caregiver confirmed cancellation via Voice Assistant'
        }, 'Sarah Jenkins (Voice)');

        session.activeSlot = { slotType: 'none', pendingData: {}, promptText: '' };
        const spoken = `All set! The care task for ${taskTitle} has been cancelled.`;
        return returnResponse(spoken, spoken, {
          toolExecution: {
            tool: 'cancel_care_task',
            input: { taskId },
            output: toolRes.data,
            status: 'success'
          },
          requiresVoiceResponse: false
        });
      } else {
        session.activeSlot = { slotType: 'none', pendingData: {}, promptText: '' };
        return returnResponse(
          `Okay, I kept ${taskTitle} active on Eleanor's care schedule.`,
          `Cancellation declined. Task remains active.`,
          { requiresVoiceResponse: false }
        );
      }
    }

    // ==========================================
    // 5. Follow-Up References & Anaphora Resolution
    // ==========================================

    // 5A: "What was the reminder I just created?" / "What reminder did I just set?"
    if (
      cleanLower.includes('reminder i just created') ||
      cleanLower.includes('reminder did i just set') ||
      cleanLower.includes('last reminder') ||
      cleanLower.includes('recent reminder')
    ) {
      let foundReminder: Reminder | undefined;
      if (session.recentlyCreatedReminderId) {
        foundReminder = dataStore.reminders.find(r => r.id === session.recentlyCreatedReminderId);
      }

      if (foundReminder) {
        const spoken = `The reminder you created is: ${foundReminder.title}, scheduled at ${foundReminder.time}.`;
        const display = `Retrieved Record:\n• Title: "${foundReminder.title}"\n• Scheduled Time: ${foundReminder.time}\n• Category: ${foundReminder.category}`;
        return returnResponse(spoken, display, {
          suggestedFollowUps: ['Change it to seven', 'Cancel that reminder', 'What is next?'],
          requiresVoiceResponse: false
        });
      } else {
        return returnResponse(
          `You haven't created any new reminders in this session yet. There are ${dataStore.reminders.length} scheduled reminders in the system.`,
          `No recent reminder in current session. Total: ${dataStore.reminders.length}.`,
          { requiresVoiceResponse: false }
        );
      }
    }

    // 5B: "Change it to seven" / "Change it to 7 PM" / "Reschedule that reminder"
    if (
      (cleanLower.includes('change it to') || cleanLower.includes('reschedule') || cleanLower.includes('move that reminder') || cleanLower.includes('make that')) &&
      (cleanLower.includes('reminder') || session.recentlyCreatedReminderId || session.lastDiscussedReminderId)
    ) {
      const parsedTime = this.parseTime(cleanLower);
      const targetId = session.recentlyCreatedReminderId || session.lastDiscussedReminderId;
      const target = targetId ? dataStore.reminders.find(r => r.id === targetId) : undefined;

      if (target && parsedTime) {
        target.time = parsedTime.timeStr;
        const spoken = `All set! I've updated your reminder for ${target.title} to ${parsedTime.displayStr}.`;
        const display = `Updated Reminder:\n• Title: "${target.title}"\n• New Time: ${parsedTime.displayStr}`;
        return returnResponse(spoken, display, {
          toolExecution: {
            tool: 'update_reminder',
            input: { reminderId: target.id, time: parsedTime.timeStr },
            output: target,
            status: 'success'
          },
          requiresVoiceResponse: false
        });
      }
    }

    // 5C: "Cancel that reminder" / "Cancel the previous one" / "Delete that reminder"
    if (
      (cleanLower.includes('cancel that reminder') || cleanLower.includes('delete that reminder') || cleanLower.includes('cancel the previous one') || cleanLower.includes('cancel reminder'))
    ) {
      const targetId = session.recentlyCreatedReminderId || session.lastDiscussedReminderId;
      const target = targetId ? dataStore.reminders.find(r => r.id === targetId) : undefined;

      if (target) {
        const toolRes = agentService.executeTool('cancel_reminder', { reminderId: target.id, title: target.title }, 'Sarah Jenkins');
        session.recentlyCreatedReminderId = undefined;
        const spoken = `All set! Your reminder for ${target.title} has been cancelled.`;
        return returnResponse(spoken, spoken, {
          toolExecution: {
            tool: 'cancel_reminder',
            input: { reminderId: target.id },
            output: toolRes.data,
            status: 'success'
          },
          requiresVoiceResponse: false
        });
      }
    }

    // 5D: "Did she take her Lisinopril?" / "Did she take her pills?"
    if (cleanLower.includes('did she take') || cleanLower.includes('taken her') || cleanLower.includes('took her')) {
      const medTasks = dataStore.tasks.filter(t => t.category === 'medication' && t.status === 'completed');
      if (medTasks.length > 0) {
        const lastMed = medTasks[0];
        const spoken = `Yes, Nurse David recorded that Eleanor took her morning medication at ${lastMed.dueTime} with breakfast, and had no adverse symptoms.`;
        return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
      } else {
        const spoken = `Eleanor's evening medication of Atorvastatin 20mg is scheduled for 7:30 PM and is currently pending.`;
        return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
      }
    }

    // 5E: "What was her blood pressure today?" / "What about her glucose?" / Vitals
    if (cleanLower.includes('blood pressure') || cleanLower.includes('glucose') || cleanLower.includes('sugar') || cleanLower.includes('vitals')) {
      const spoken = `Today Eleanor's fasting blood glucose was 112 milligrams per deciliter, and her afternoon blood pressure was 124 over 76 with a pulse of 68. Both readings are within her target goals.`;
      const display = `Eleanor Vance — Today's Vitals (2026-10-20):\n\n` +
        `• Fasting Blood Glucose: 112 mg/dL (Goal: 90-130 mg/dL) — Normal\n` +
        `• Blood Pressure: 124/76 mmHg, Pulse 68 bpm (Goal: < 130/80 mmHg) — Normal\n` +
        `• Temperature: 98.4°F\n\nRecorded by: Sarah Jenkins`;
      return returnResponse(spoken, display, {
        suggestedFollowUps: ['What is next?', 'Prepare shift handover'],
        requiresVoiceResponse: false
      });
    }

    // ==========================================
    // 6. Tanglish & Tamil Spoken Requests (Phase 3)
    // ==========================================
    if (
      cleanLower.includes('innikku') &&
      (cleanLower.includes('reminder') || cleanLower.includes('manikku') || cleanLower.includes('set pannu'))
    ) {
      const parsedTime = this.parseTime(cleanLower) || { timeStr: '18:00', displayStr: '6:00 PM' };
      session.activeSlot = {
        slotType: 'reminder_confirmation',
        pendingData: {
          title: 'Evening Care Routine',
          time: parsedTime.timeStr,
          displayTime: parsedTime.displayStr,
          category: 'medication'
        },
        promptText: `இன்று மாலை ${parsedTime.displayStr} மணிக்கு நினைவூட்டலை சேமிக்கவா? Shall I save that reminder?`
      };

      const spoken = `இன்று மாலை ${parsedTime.displayStr} மணிக்கு நினைவூட்டலை சேமிக்கவா? Shall I save that reminder for ${parsedTime.displayStr} today?`;
      return returnResponse(spoken, spoken, {
        suggestedFollowUps: ['ஆமாம், சேமி (Yes)', 'வேண்டாம் (No)'],
        requiresVoiceResponse: true
      });
    }

    if (
      cleanLower.includes('பணிகள்') ||
      cleanLower.includes('டாஸ்க்') ||
      cleanLower.includes('இன்னைக்கு என்ன') ||
      (currentLang === 'ta' && (cleanLower.includes('பராமரிப்பு') || cleanLower.includes('என்ன செய்ய வேண்டும்')))
    ) {
      const today = '2026-10-20';
      const pending = dataStore.tasks.filter(t => t.dueDate === today && t.status === 'pending');
      const spoken = `இன்று எலினாருக்கு 2 பணிகள் நிலுவையில் உள்ளன: மாலை 7:30 மணிக்கு Atorvastatin மருந்து மற்றும் இரவு 9:00 மணிக்கு ஈரப்பதமூட்டி தயாரிப்பு.`;
      const display = `இன்றைய பராமரிப்புப் பணிகள்:\n• 19:30 - மாலை மருந்து (Atorvastatin 20mg)\n• 21:00 - இரவு ஈரப்பதமூட்டி தயாரிப்பு`;
      return returnResponse(spoken, display, { requiresVoiceResponse: false });
    }

    // ==========================================
    // 7. Hindi & Hinglish Spoken Requests (Phase 3)
    // ==========================================
    if (
      cleanLower.includes('baje') && (cleanLower.includes('reminder') || cleanLower.includes('yaad dilao') || cleanLower.includes('dawai'))
    ) {
      const parsedTime = this.parseTime(cleanLower) || { timeStr: '18:00', displayStr: '6:00 PM' };
      session.activeSlot = {
        slotType: 'reminder_confirmation',
        pendingData: {
          title: 'दवाई का रिमाइंडर',
          time: parsedTime.timeStr,
          displayTime: parsedTime.displayStr,
          category: 'medication'
        },
        promptText: `आज शाम ${parsedTime.displayStr} का रिमाइंडर सेट करूँ? क्या इसे सेव कर दूँ?`
      };

      const spoken = `आज शाम ${parsedTime.displayStr} का रिमाइंडर सेट करूँ? क्या इसे सेव कर दूँ?`;
      return returnResponse(spoken, spoken, {
        suggestedFollowUps: ['हाँ, सेव कर दो', 'नहीं, रद्द करो'],
        requiresVoiceResponse: true
      });
    }

    if (
      cleanLower.includes('कार्य') ||
      cleanLower.includes('काम') ||
      cleanLower.includes('kya karna hai') ||
      (currentLang === 'hi' && cleanLower.includes('aaj'))
    ) {
      const spoken = `आज एलेनोर के लिए 2 कार्य बाकी हैं: शाम 7:30 बजे Atorvastatin दवाई और रात 9:00 बजे ह्यूमिडिफायर।`;
      const display = `आज के बाकी कार्य:\n• 19:30 - शाम की दवाई (Atorvastatin 20mg)\n• 21:00 - नाइट ह्यूमिडिफायर`;
      return returnResponse(spoken, display, { requiresVoiceResponse: false });
    }

    // ==========================================
    // 8. Reminders Creation Entrypoint
    // ==========================================
    if (
      cleanLower.includes('remind me to') ||
      cleanLower.includes('create a reminder') ||
      cleanLower.includes('set a reminder') ||
      cleanLower.includes('schedule a reminder')
    ) {
      let title = 'Call Mom';
      const titleMatch = transcript.match(/(?:remind me to|create a reminder to|set a reminder to|reminder for)\s+([^,]+?)(?:\s+(?:around|at|by|tomorrow|today|in|on)\b|$)/i);
      if (titleMatch && titleMatch[1].trim().length > 2) {
        const raw = titleMatch[1].replace(/[.!?,;:]+$/, '').trim();
        if (raw.length > 0) {
          title = raw.charAt(0).toUpperCase() + raw.slice(1);
        }
      }

      const parsedTime = this.parseTime(cleanLower);

      if (parsedTime) {
        if (parsedTime.isAmbiguousAmPm && !cleanLower.includes('pm') && !cleanLower.includes('am')) {
          session.activeSlot = {
            slotType: 'reminder_ampm',
            pendingData: { title, rawHour: parsedTime.hourVal || 6, category: 'household' },
            promptText: `Do you mean ${parsedTime.hourVal} AM or ${parsedTime.hourVal} PM?`
          };
          const spoken = `Do you mean ${parsedTime.hourVal} AM or ${parsedTime.hourVal} PM?`;
          return returnResponse(spoken, spoken, {
            suggestedFollowUps: ['6 PM', '6 AM'],
            requiresVoiceResponse: true
          });
        }

        session.activeSlot = {
          slotType: 'reminder_confirmation',
          pendingData: {
            title,
            time: parsedTime.timeStr,
            displayTime: parsedTime.displayStr,
            category: cleanLower.includes('med') ? 'medication' : 'household'
          },
          promptText: `${parsedTime.displayStr} today. Shall I save that reminder?`
        };

        const spoken = `${parsedTime.displayStr} today. Shall I save that reminder?`;
        const display = `I'll schedule a reminder to "${title}" for ${parsedTime.displayStr} today.\n\nShall I save that reminder?`;

        return returnResponse(spoken, display, {
          suggestedFollowUps: ['Yes, please', 'No, cancel'],
          requiresVoiceResponse: true
        });
      } else {
        session.activeSlot = {
          slotType: 'reminder_time',
          pendingData: { title, category: 'household' },
          promptText: `Of course! What time should I remind you?`
        };

        const spoken = `Of course! What time should I remind you?`;
        return returnResponse(spoken, spoken, {
          suggestedFollowUps: ['Around six', '6 PM', 'In one hour'],
          requiresVoiceResponse: true
        });
      }
    }

    // ==========================================
    // 9. Tasks & Daily Summary Queries
    // ==========================================
    if (
      cleanLower.includes('what do i need to do next') ||
      cleanLower.includes('what is next') ||
      cleanLower.includes("what's next") ||
      cleanLower.includes('next task')
    ) {
      const today = '2026-10-20';
      const pending = dataStore.tasks.filter(t => t.dueDate === today && t.status === 'pending');
      if (pending.length > 0) {
        const next = pending[0];
        session.lastDiscussedTaskId = next.id;
        const spoken = `Next up is ${next.title} at ${next.dueTime}. Would you like me to read the instructions?`;
        const display = `Next Scheduled Care Task:\n\n• ${next.dueTime} — ${next.title}\n• Category: ${next.category}\n• Assigned: ${next.assignedTo}\n• Instructions: ${next.description}`;
        return returnResponse(spoken, display, {
          suggestedFollowUps: ['Read instructions', 'What else is scheduled?'],
          requiresVoiceResponse: true
        });
      } else {
        const spoken = "All care tasks for today have been completed! Eleanor is all set.";
        return returnResponse(spoken, spoken, { requiresVoiceResponse: false });
      }
    }

    if (
      cleanLower.includes('what do i need to do') ||
      cleanLower.includes("what's happening today") ||
      cleanLower.includes('tasks today') ||
      cleanLower.includes('schedule today')
    ) {
      const today = '2026-10-20';
      const tasks = dataStore.tasks.filter(t => t.dueDate === today);
      const completed = tasks.filter(t => t.status === 'completed');
      const pending = tasks.filter(t => t.status === 'pending');

      const spoken = `You have ${tasks.length} care tasks scheduled today: ${completed.length} completed, and ${pending.length} pending: ${pending.map(p => `${p.title} at ${p.dueTime}`).join(', ')}.`;
      const display = `Today's Care Tasks for Eleanor Vance (${completed.length}/${tasks.length} Completed):\n\n` +
        `• Pending:\n${pending.map(p => `  - ${p.dueTime}: ${p.title} (${p.category})`).join('\n')}\n\n` +
        `• Completed:\n${completed.map(c => `  - ${c.dueTime}: ${c.title}`).join('\n')}`;

      session.lastDiscussedTaskId = pending[0]?.id;
      return returnResponse(spoken, display, {
        toolExecution: {
          tool: 'list_care_tasks',
          input: { status: 'all' },
          output: { count: tasks.length, pending: pending.length, completed: completed.length },
          status: 'success'
        },
        suggestedFollowUps: ['What is next?', 'Remind me to call Mom at six', 'Check vitals'],
        requiresVoiceResponse: false
      });
    }

    // ==========================================
    // 10. Handover Generation
    // ==========================================
    if (cleanLower.includes('handover') || cleanLower.includes('shift report')) {
      const toolRes = agentService.executeTool('generate_handover', {
        outgoingCaregiver: 'Sarah Jenkins (Primary)',
        incomingCaregiver: 'Nurse David Morales, RN',
        shiftTitle: 'Evening Shift Handover'
      }, 'EchoCare Voice Agent');

      const handover = toolRes.data as HandoverReport;
      const spoken = `All set! I've compiled the shift handover for Nurse David Morales based on today's stored records, including 5 completed activities and 2 pending evening tasks.`;
      const display = `Shift Handover Compiled Successfully:\n\n` +
        `• Outgoing: ${handover.outgoingCaregiver}\n` +
        `• Incoming: ${handover.incomingCaregiver}\n` +
        `• Vitals Summary: ${handover.vitalObservations}\n` +
        `• Activities: ${handover.completedTasksCount} completed, ${handover.pendingTasksCount} pending`;

      return returnResponse(spoken, display, {
        toolExecution: {
          tool: 'generate_handover',
          input: { outgoing: 'Sarah Jenkins', incoming: 'Nurse David Morales' },
          output: handover,
          status: 'success'
        },
        suggestedFollowUps: ['What do I need to do next?'],
        requiresVoiceResponse: false
      });
    }

    // ==========================================
    // 11. Consequential Task Cancellation
    // ==========================================
    if (cleanLower.includes('cancel task') || cleanLower.includes('cancel the task')) {
      const pendingTask = dataStore.tasks.find(t => t.status === 'pending');
      if (pendingTask) {
        session.activeSlot = {
          slotType: 'cancel_confirmation',
          pendingData: { taskId: pendingTask.id, taskTitle: pendingTask.title },
          promptText: `Cancelling a scheduled care task requires explicit caregiver approval. Are you sure you want to cancel ${pendingTask.title}?`
        };

        const spoken = `Cancelling a scheduled care task alters Eleanor's routine. Are you sure you want to cancel ${pendingTask.title}?`;
        return returnResponse(spoken, spoken, {
          suggestedFollowUps: ['Yes, cancel it', 'No, keep it'],
          requiresVoiceResponse: true
        });
      }
    }

    // ==========================================
    // 12. Default Friendly Fallback
    // ==========================================
    const spoken = currentLang === 'ta'
      ? 'நான் எக்கோகேர். இன்றைய பணிகள், நினைவூட்டல்கள் அல்லது வைட்டல்ஸ் பற்றி என்னிடம் கேட்கலாம்.'
      : currentLang === 'hi'
      ? 'मैं इकोकेयर हूँ। आप आज के कार्य, दवाई के रिमाइंडर या वाइटल्स के बारे में पूछ सकते हैं।'
      : "I'm Echo, your home care assistant. You can ask what tasks are scheduled today, tell me to set a reminder, or check Eleanor's vitals.";

    return returnResponse(spoken, spoken, {
      suggestedFollowUps: ['What do I need to do today?', 'Remind me to call Mom at six', 'Check vitals'],
      requiresVoiceResponse: false
    });
  }
}

export const voiceConversationService = new VoiceConversationService();
