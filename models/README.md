# EchoCare AI: Trained Models & LoRA Adapters

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
