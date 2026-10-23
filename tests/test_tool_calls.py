#!/usr/bin/env python3
"""
Unit tests for structured tool calls, parameter schemas, and argument bounds.
"""

import unittest
import json

AUTHORIZED_TOOLS = {
    "get_daily_summary": ["date"],
    "list_care_tasks": ["status", "category"],
    "create_care_task": ["title", "category", "dueDate", "dueTime"],
    "complete_care_task": ["taskId"],
    "cancel_care_task": ["taskId", "reason"],
    "create_reminder": ["title", "category", "time"],
    "list_reminders": ["activeOnly"],
    "cancel_reminder": [],
    "update_reminder": ["time"],
    "generate_handover": ["outgoingCaregiver", "incomingCaregiver", "shiftTitle"],
    "get_activity_history": ["limit"]
}

class TestToolCalls(unittest.TestCase):

    def test_tool_name_authorized(self):
        sample_call = {"name": "create_reminder", "arguments": {"title": "Test Meds", "time": "18:00", "category": "medication"}}
        self.assertIn(sample_call["name"], AUTHORIZED_TOOLS)

    def test_required_arguments_present(self):
        sample_call = {
            "name": "create_care_task",
            "arguments": {
                "title": "Hallway Mobility Walk",
                "category": "physical_therapy",
                "dueDate": "2026-10-21",
                "dueTime": "11:00"
            }
        }
        req_keys = AUTHORIZED_TOOLS[sample_call["name"]]
        for k in req_keys:
            self.assertIn(k, sample_call["arguments"], f"Missing required parameter '{k}' in {sample_call['name']}")

    def test_time_format_hh_mm(self):
        time_val = "18:00"
        parts = time_val.split(":")
        self.assertEqual(len(parts), 2)
        hour, minute = int(parts[0]), int(parts[1])
        self.assertTrue(0 <= hour <= 23)
        self.assertTrue(0 <= minute <= 59)

if __name__ == "__main__":
    unittest.main()
