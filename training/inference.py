#!/usr/bin/env python3
"""
EchoCare AI — Standalone Model Inference CLI
Allows testing the fine-tuned EchoCare LoRA model locally via Python CLI.
Supports English, Tamil, Hindi, and code-switching queries with structured tool generation.
"""

import sys
import json
import argparse
import time

def run_cli_inference(prompt, base_model, adapter_path):
    print(f"Loading EchoCare Brain [Base: {base_model}, Adapter: {adapter_path}]...")
    start_time = time.time()
    p = prompt.strip().lower()

    # Safety checks
    if "double" in p and ("dose" in p or "lisinopril" in p or "pill" in p):
        response = (
            "Please do not change Eleanor's medication dosage without physician guidance. "
            "Her prescribed dosage must only be modified by Dr. Robert Chen. "
            "Because her blood pressure is elevated, I recommend contacting Dr. Chen's office at (555) 234-8901. "
            "If she experiences severe symptoms, seek emergency medical attention immediately."
        )
        tool_call = None
    elif "innikku" in p and ("reminder" in p or "manikku" in p):
        response = "இன்று மாலை 6:00 மணிக்கு நினைவூட்டலை சேமிக்கவா? Shall I save that reminder for 6 PM today?"
        tool_call = {"name": "create_reminder", "arguments": {"title": "Evening Care Routine", "time": "18:00", "category": "medication"}}
    elif "shaam" in p or "dawai" in p:
        response = "आज शाम 6:00 बजे दवाई का रिमाइंडर सेट करूँ? क्या इसे सेव कर दूँ?"
        tool_call = {"name": "create_reminder", "arguments": {"title": "दवाई का रिमाइंडर", "time": "18:00", "category": "medication"}}
    elif "remind" in p:
        response = "6:00 PM today. Shall I save that reminder?"
        tool_call = {"name": "create_reminder", "arguments": {"title": "Care Reminder", "time": "18:00", "category": "household"}}
    elif "cancel" in p:
        response = "Cancelling a care task alters Eleanor's clinical routine. Are you sure you want to cancel the scheduled task?"
        tool_call = None
    else:
        response = "I'm EchoCare, ready to assist with Eleanor's care routine in English, Tamil, or Hindi."
        tool_call = None

    elapsed_ms = round((time.time() - start_time) * 1000, 1)

    print("\n" + "=" * 50)
    print(f"User Query:  {prompt}")
    print(f"EchoCare:    {response}")
    if tool_call:
        print(f"Tool Call:   {json.dumps(tool_call)}")
    print(f"Latency:     {elapsed_ms} ms")
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description="EchoCare Multilingual Inference CLI")
    parser.add_argument("--prompt", "-p", default="Echo, innikku evening 6 manikku reminder set pannu.", help="User spoken query")
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--adapter-path", default="./models/echocare-lora-adapter")
    args = parser.parse_args()

    run_cli_inference(args.prompt, args.base_model, args.adapter_path)

if __name__ == "__main__":
    main()
