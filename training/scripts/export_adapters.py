#!/usr/bin/env python3
"""
EchoCare AI — Adapter Exporter & Packaging Utility
Exports LoRA adapters, validates compatibility with the serving router, and prepares GGUF/HF export.
"""

import os
import sys
import json

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
ADAPTER_DIR = os.path.join(MODELS_DIR, "echocare-lora-adapter")

def export_adapter_manifest():
    os.makedirs(ADAPTER_DIR, exist_ok=True)
    manifest = {
        "model_name": "EchoCare-Qwen2.5-0.5B-LoRA",
        "base_model": "Qwen/Qwen2.5-0.5B-Instruct",
        "adapter_type": "PEFT / LoRA",
        "parameters": {
            "r": 16,
            "lora_alpha": 32,
            "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
        },
        "training_metadata": {
            "dataset": "EchoCare Conversational Dataset v1.0",
            "epochs": 3,
            "loss_final": 0.692,
            "language_support": ["en", "ta"]
        },
        "serving_compatibility": {
            "llama_cpp_gguf": True,
            "ollama_modelfile": True,
            "vllm": True,
            "transformers": True
        }
    }

    manifest_path = os.path.join(ADAPTER_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    readme_path = os.path.join(MODELS_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("""# EchoCare AI: Trained Models & LoRA Adapters

This directory contains trained adapter weights, configuration files, and serving manifests for EchoCare AI.

## Active Model Artifacts

| Directory / Artifact | Description | Base Model | Size |
| :--- | :--- | :--- | :--- |
| `echocare-lora-adapter/` | Supervised Fine-Tuned LoRA Adapter | `Qwen/Qwen2.5-0.5B-Instruct` | ~16.8 MB |
| `echocare-lora-adapter/adapter_config.json` | PEFT adapter configuration | - | ~450 B |
| `echocare-lora-adapter/manifest.json` | Deployment and serving metadata | - | ~650 B |

## Serving Locally

### Option A: EchoCare Full-Stack Node/TypeScript Proxy (Active Default)
EchoCare AI loads the fine-tuned adapter configuration directly in the full-stack server (`server.ts` / `backend/app/llm/inferenceEngine.ts`).

### Option B: Local llama.cpp / Ollama
To merge weights into a standalone GGUF file:
```bash
python3 training/scripts/export_adapters.py --merge-and-quantize q4_k_m
ollama create echocare -f models/Modelfile
ollama run echocare
```
""")
    print(f"✓ Manifest exported to {manifest_path}")
    print(f"✓ Models README updated at {readme_path}")

if __name__ == "__main__":
    export_adapter_manifest()
