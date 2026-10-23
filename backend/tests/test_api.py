import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_get_tasks():
    res = client.get("/api/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)
    assert len(tasks) >= 2

def test_create_and_complete_task():
    # Create task
    payload = {
        "title": "Evening Hydration Check",
        "description": "Ensure 250ml water consumed",
        "category": "nutrition",
        "priority": "medium",
        "assigned_to": "Sarah Jenkins",
        "due_date": "2026-10-20",
        "due_time": "20:00"
    }
    create_res = client.post("/api/tasks", json=payload)
    assert create_res.status_code == 201
    task = create_res.json()
    assert task["title"] == payload["title"]
    assert task["status"] == "pending"

    # Complete task
    complete_res = client.patch(f"/api/tasks/{task['id']}/complete", params={"notes": "Eleanor drank full glass"})
    assert complete_res.status_code == 200
    completed_task = complete_res.json()
    assert completed_task["status"] == "completed"
    assert "Eleanor drank" in completed_task["notes"]

def test_generate_handover():
    res = client.post("/api/handovers/generate", json={
        "outgoing_caregiver": "Sarah Jenkins",
        "incoming_caregiver": "Nurse David Morales",
        "shift_title": "Evening Shift Handover"
    })
    assert res.status_code == 200
    report = res.json()
    assert "shift_date" in report
    assert report["outgoing_caregiver"] == "Sarah Jenkins"
    assert report["completed_tasks_count"] >= 1
