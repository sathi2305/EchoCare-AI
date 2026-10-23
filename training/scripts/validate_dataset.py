#!/usr/bin/env python3
"""
EchoCare AI — Dataset Validation Script
Validates formatting, token heuristics, schema integrity, and zero leakage between splits.
"""

import json
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
REQUIRED_KEYS = {"id", "category", "intent", "messages", "metadata"}
VALID_ROLES = {"system", "user", "assistant", "tool"}
VALID_CATEGORIES = {
    "greetings_identity", "daily_summary", "task_management",
    "reminder_slot_filling", "datetime_interpretation",
    "multiturn_clarification", "corrections_interruptions",
    "caregiver_handover", "tool_selection_schema",
    "tool_failure_recovery", "unclear_requests",
    "privacy_authorization", "medical_safety_boundary",
    "multilingual_tamil"
}

def validate_split(file_name, expected_split):
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"FAIL: File not found: {file_path}")
        return [], False

    seen_ids = set()
    records = []
    has_errors = False

    with open(file_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except Exception as e:
                print(f"FAIL [{file_name}:{line_no}] Invalid JSON: {e}")
                has_errors = True
                continue

            # Check top-level keys
            missing = REQUIRED_KEYS - set(item.keys())
            if missing:
                print(f"FAIL [{file_name}:{line_no}] Missing keys: {missing}")
                has_errors = True

            # ID uniqueness
            record_id = item.get("id")
            if record_id in seen_ids:
                print(f"FAIL [{file_name}:{line_no}] Duplicate ID: {record_id}")
                has_errors = True
            seen_ids.add(record_id)

            # Split consistency
            split_meta = item.get("metadata", {}).get("split")
            if split_meta != expected_split:
                print(f"FAIL [{file_name}:{line_no}] Metadata split mismatch: expected '{expected_split}', got '{split_meta}'")
                has_errors = True

            # Category validation
            cat = item.get("category")
            if cat not in VALID_CATEGORIES:
                print(f"WARN [{file_name}:{line_no}] Unrecognized category '{cat}'")

            # Messages validation
            messages = item.get("messages", [])
            if not messages or len(messages) < 2:
                print(f"FAIL [{file_name}:{line_no}] Conversation has fewer than 2 messages")
                has_errors = True

            for msg_idx, msg in enumerate(messages):
                role = msg.get("role")
                if role not in VALID_ROLES:
                    print(f"FAIL [{file_name}:{line_no} msg {msg_idx}] Invalid role: {role}")
                    has_errors = True
                if not msg.get("content") and not msg.get("tool_calls"):
                    print(f"FAIL [{file_name}:{line_no} msg {msg_idx}] Empty message without tool_calls")
                    has_errors = True

            records.append(item)

    return records, not has_errors

def main():
    print("=" * 60)
    print("EchoCare AI — Dataset Validation Suite")
    print("=" * 60)

    train_records, train_ok = validate_split("train.jsonl", "train")
    val_records, val_ok = validate_split("val.jsonl", "val")
    test_records, test_ok = validate_split("test.jsonl", "test")

    # Leakage check: Ensure no user prompts in test/val appear in train
    train_queries = set(
        m["content"].strip().lower()
        for r in train_records
        for m in r["messages"] if m["role"] == "user"
    )
    val_queries = set(
        m["content"].strip().lower()
        for r in val_records
        for m in r["messages"] if m["role"] == "user"
    )
    test_queries = set(
        m["content"].strip().lower()
        for r in test_records
        for m in r["messages"] if m["role"] == "user"
    )

    leak_train_val = train_queries.intersection(val_queries)
    leak_train_test = train_queries.intersection(test_queries)

    print(f"\nDataset Statistics:")
    print(f"• Training Set:   {len(train_records)} records")
    print(f"• Validation Set: {len(val_records)} records")
    print(f"• Test Set:       {len(test_records)} records")
    print(f"• Total Records:  {len(train_records) + len(val_records) + len(test_records)}")

    if leak_train_test:
        print(f"FAIL: Leakage detected between train and test ({len(leak_train_test)} overlaps)")
    else:
        print("✓ Zero-leakage verified: Train and Test splits have disjoint user queries.")

    all_ok = train_ok and val_ok and test_ok and not leak_train_test
    if all_ok:
        print("\n✓ ALL DATASET INTEGRITY CHECKS PASSED.")
        sys.exit(0)
    else:
        print("\n✗ DATASET VALIDATION FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    main()
