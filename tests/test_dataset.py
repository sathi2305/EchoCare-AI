#!/usr/bin/env python3
"""
Unit tests for EchoCare dataset integrity, non-leakage, and schema compliance.
"""

import os
import json
import unittest

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "training", "data")

class TestEchoCareDataset(unittest.TestCase):

    def test_files_exist(self):
        for name in ["train.jsonl", "val.jsonl", "test.jsonl"]:
            path = os.path.join(DATA_DIR, name)
            self.assertTrue(os.path.exists(path), f"Missing {name}")

    def test_schema_conformance(self):
        for name in ["train.jsonl", "val.jsonl", "test.jsonl"]:
            path = os.path.join(DATA_DIR, name)
            with open(path, "r", encoding="utf-8") as f:
                for idx, line in enumerate(f):
                    data = json.loads(line)
                    self.assertIn("id", data)
                    self.assertIn("category", data)
                    self.assertIn("messages", data)
                    self.assertIn("metadata", data)
                    self.assertGreaterEqual(len(data["messages"]), 2)

    def test_zero_leakage_between_train_and_test(self):
        def get_queries(filename):
            queries = set()
            with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    for m in data.get("messages", []):
                        if m["role"] == "user":
                            queries.add(m["content"].strip().lower())
            return queries

        train_queries = get_queries("train.jsonl")
        test_queries = get_queries("test.jsonl")

        overlap = train_queries.intersection(test_queries)
        self.assertEqual(len(overlap), 0, f"Detected leakage between train and test: {overlap}")

if __name__ == "__main__":
    unittest.main()
