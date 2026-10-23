"""
EchoCare AI — FastAPI Backend Application
Proactive Agentic Home Care Coordinator | Amazon Developer Hackathon 2026
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
from typing import List, Optional

from app.schemas.schemas import (
    CareTaskCreate, CareTaskResponse, ReminderCreate, ReminderResponse,
    HandoverReportCreate, HandoverReportResponse, AgentChatRequest, HealthResponse
)

app = FastAPI(
    title="EchoCare AI Backend",
    description="Intelligent Home Care Coordinator REST API & Agent Tools",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demonstration & testing
TASKS_DB = [
    {
        "id": "task-1",
        "title": "Morning Fasting Blood Glucose Check",
        "description": "Measure fingerstick blood sugar before breakfast. Target: 90-130 mg/dL.",
        "category": "vital_signs",
        "priority": "high",
        "status": "completed",
        "assigned_to": "Sarah Jenkins",
        "due_date": "2026-10-20",
        "due_time": "08:00",
        "completed_at": "2026-10-20T08:05:00Z",
        "completed_by": "Sarah Jenkins",
        "notes": "Reading: 112 mg/dL. Within target range.",
        "reminder_linked": True,
        "created_at": "2026-10-19T10:00:00Z"
    },
    {
        "id": "task-2",
        "title": "Morning Medication: Metformin 500mg & Lisinopril 10mg",
        "description": "Administer with oatmeal breakfast and a full glass of water.",
        "category": "medication",
        "priority": "urgent",
        "status": "completed",
        "assigned_to": "Sarah Jenkins",
        "due_date": "2026-10-20",
        "due_time": "08:30",
        "completed_at": "2026-10-20T08:32:00Z",
        "completed_by": "Sarah Jenkins",
        "notes": "Taken on schedule with breakfast.",
        "reminder_linked": True,
        "created_at": "2026-10-19T10:00:00Z"
    },
    {
        "id": "task-6",
        "title": "Evening Medication: Atorvastatin 20mg & Calcium + Vit D",
        "description": "Administer with evening snack or milk.",
        "category": "medication",
        "priority": "urgent",
        "status": "pending",
        "assigned_to": "Sarah Jenkins",
        "due_date": "2026-10-20",
        "due_time": "19:30",
        "notes": "Awaiting evening meal.",
        "reminder_linked": True,
        "created_at": "2026-10-19T10:00:00Z"
    }
]

REMINDERS_DB = [
    {
        "id": "rem-1",
        "task_id": "task-2",
        "title": "Morning Medication: Metformin & Lisinopril",
        "category": "medication",
        "time": "08:30",
        "frequency": "daily",
        "is_active": True,
        "sound_enabled": True,
        "recipient_name": "Eleanor Vance",
        "created_at": "2026-10-15T09:00:00Z"
    },
    {
        "id": "rem-4",
        "task_id": "task-6",
        "title": "Evening Medication: Atorvastatin & Calcium",
        "category": "medication",
        "time": "19:30",
        "frequency": "daily",
        "is_active": True,
        "sound_enabled": True,
        "recipient_name": "Eleanor Vance",
        "created_at": "2026-10-15T09:00:00Z"
    }
]

HANDOVERS_DB = []
ACTIVITIES_DB = []

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "service": "EchoCare AI FastAPI Backend",
        "version": "1.0.0",
        "mode": "agent_ready",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/tasks", response_model=List[CareTaskResponse])
def get_tasks(status: Optional[str] = None, category: Optional[str] = None):
    results = TASKS_DB
    if status and status != "all":
        results = [t for t in results if t["status"] == status]
    if category and category != "all":
        results = [t for t in results if t["category"] == category]
    return results

@app.post("/api/tasks", response_model=CareTaskResponse, status_code=201)
def create_task(task: CareTaskCreate):
    new_task = {
        "id": f"task-{uuid.uuid4().hex[:6]}",
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        **task.dict()
    }
    TASKS_DB.append(new_task)
    return new_task

@app.patch("/api/tasks/{task_id}/complete")
def complete_task(task_id: str, completed_by: str = "Sarah Jenkins", notes: Optional[str] = None):
    for t in TASKS_DB:
        if t["id"] == task_id:
            t["status"] = "completed"
            t["completed_at"] = datetime.utcnow().isoformat()
            t["completed_by"] = completed_by
            if notes:
                t["notes"] = notes
            return t
    raise HTTPException(status_code=404, detail="Task not found")

@app.patch("/api/tasks/{task_id}/cancel")
def cancel_task(task_id: str, reason: str = "Caregiver cancelled"):
    for t in TASKS_DB:
        if t["id"] == task_id:
            t["status"] = "cancelled"
            t["notes"] = f"Cancelled: {reason}"
            return t
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/reminders", response_model=List[ReminderResponse])
def get_reminders():
    return REMINDERS_DB

@app.post("/api/reminders", response_model=ReminderResponse, status_code=201)
def create_reminder(reminder: ReminderCreate):
    new_rem = {
        "id": f"rem-{uuid.uuid4().hex[:6]}",
        "created_at": datetime.utcnow().isoformat(),
        **reminder.dict()
    }
    REMINDERS_DB.append(new_rem)
    return new_rem

@app.post("/api/handovers/generate", response_model=HandoverReportResponse)
def generate_handover(req: HandoverReportCreate):
    completed = [t for t in TASKS_DB if t["status"] == "completed"]
    pending = [t for t in TASKS_DB if t["status"] == "pending"]

    vitals = "Fasting glucose 112 mg/dL. Morning BP 124/76 mmHg. Vitals stable throughout shift."
    clinical = f"Completed {len(completed)} scheduled activities. Eleanor was in good spirits."
    pending_items = [f"{t['due_time']} - {t['title']} ({t['category']})" for t in pending]

    report = {
        "id": f"handover-{uuid.uuid4().hex[:6]}",
        "shift_date": "2026-10-20",
        "shift_time": req.shift_title,
        "outgoing_caregiver": req.outgoing_caregiver,
        "incoming_caregiver": req.incoming_caregiver,
        "completed_tasks_count": len(completed),
        "pending_tasks_count": len(pending),
        "vital_observations": vitals,
        "clinical_notes": clinical,
        "pending_items": pending_items if pending_items else ["All routines completed."],
        "emergency_checklist_completed": True,
        "created_at": datetime.utcnow().isoformat()
    }
    HANDOVERS_DB.append(report)
    return report
