from typing import List, Optional, Literal
from pydantic import BaseModel, Field

TaskCategory = Literal['medication', 'vital_signs', 'physical_therapy', 'nutrition', 'hygiene', 'household', 'appointment']
TaskPriority = Literal['urgent', 'high', 'medium', 'low']
TaskStatus = Literal['pending', 'in_progress', 'completed', 'cancelled']
ReminderFrequency = Literal['once', 'daily', 'twice_daily', 'weekly', 'custom']

class CareTaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = ''
    category: TaskCategory = 'medication'
    priority: TaskPriority = 'medium'
    assigned_to: str = 'Sarah Jenkins'
    due_date: str = '2026-10-20'
    due_time: str = '14:00'
    reminder_linked: Optional[bool] = False

class CareTaskCreate(CareTaskBase):
    pass

class CareTaskResponse(CareTaskBase):
    id: str
    status: TaskStatus
    completed_at: Optional[str] = None
    completed_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

class ReminderBase(BaseModel):
    title: str
    category: TaskCategory = 'medication'
    time: str
    frequency: ReminderFrequency = 'daily'
    is_active: bool = True
    sound_enabled: bool = True
    recipient_name: str = 'Eleanor Vance'

class ReminderCreate(ReminderBase):
    task_id: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: str
    task_id: Optional[str] = None
    created_at: str

class HandoverReportCreate(BaseModel):
    outgoing_caregiver: str = 'Sarah Jenkins (Primary)'
    incoming_caregiver: str = 'Nurse David Morales, RN'
    shift_title: str = 'Evening Shift Handover'

class HandoverReportResponse(BaseModel):
    id: str
    shift_date: str
    shift_time: str
    outgoing_caregiver: str
    incoming_caregiver: str
    completed_tasks_count: int
    pending_tasks_count: int
    vital_observations: str
    clinical_notes: str
    pending_items: List[str]
    emergency_checklist_completed: bool
    created_at: str

class AgentChatRequest(BaseModel):
    message: Optional[str] = None
    confirmed_action: Optional[dict] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    mode: str
    timestamp: str
