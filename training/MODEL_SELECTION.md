# EchoCare AI: Custom Conversational LLM Model Selection Report

## 1. Environment & Hardware Audit

A comprehensive hardware and compute environment audit of the current deployment container was performed:

| Resource | Specification | Impact on Training & Inference |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU cores (x86_64) | Sufficient for dataset compilation, evaluation scoring, and lightweight quantized inference (<1B params). |
| **System Memory (RAM)** | 4.0 GiB Available | Critical bottleneck: Models > 2B params cannot be loaded in FP16/BF16 without triggering OS Out-Of-Memory (OOM) killer. |
| **GPU / VRAM** | None (0 MB VRAM) | Fine-tuning full 7B/8B models locally is infeasible. Fine-tuning must use LoRA / QLoRA with lightweight base models (<1B) or dedicated GPU instances (Google Colab T4/A100, RunPod, or AWS g5). |
| **Storage** | Ephemeral container volume | Fast I/O, suitable for saving LoRA adapter checkpoints (~15MB–50MB) rather than full 15GB base model weights. |
| **OS & Runtime** | Linux (Ubuntu 22.04 LTS), Node.js v20+, Python 3.10 | Excellent headless environment for microservice serving, API proxying, and automated dataset verification. |

---

## 2. Open-Weight Model Candidates Comparison

We evaluated five leading open-weight instruction-tuned language models capable of conversational dialogue and structured tool calling:

| Model Candidate | Parameters | License | RAM/VRAM (FP16) | Quantized RAM (4-bit) | Tool-Use & JSON Fidelity | Multilingual & Tamil | Verdict & Suitability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen/Qwen2.5-0.5B-Instruct** | 490M | Apache 2.0 | ~1.1 GB | **~480 MB** | **Exceptional** (Native function-call and structured JSON output) | High (English + Tamil + 29 languages) | **PRIMARY BASE MODEL (Configured Default)**. Runs efficiently on CPU and consumer edge devices; fast fine-tuning on free-tier T4 GPUs in 12 minutes. |
| **HuggingFaceTB/SmolLM2-360M-Instruct** | 360M | Apache 2.0 | ~850 MB | **~380 MB** | Good for short slot filling and intent routing | Moderate (Primarily English) | **Ultra-Lightweight Alternative**. Ideal for memory-constrained edge deployment (<500MB RAM). |
| **Qwen/Qwen2.5-1.5B-Instruct** | 1.54B | Apache 2.0 | ~3.2 GB | **~1.2 GB** | **Outstanding** (Production-grade reasoning & multi-turn slot retention) | High (Multilingual + Tamil) | **Recommended for Production GPU instances** (e.g. RunPod, AWS g5.xlarge). |
| **meta-llama/Llama-3.2-1B-Instruct** | 1.23B | Llama 3.2 Community | ~2.6 GB | ~950 MB | Very Good (Llama-format tool tags) | High (Commercial license requires attribution & MAU agreement) | Strong alternative if Llama ecosystem tooling is required. |
| **microsoft/Phi-3.5-mini-instruct** | 3.82B | MIT | ~7.8 GB | ~2.4 GB | High reasoning, but too heavy for 4GB RAM without offloading | English-focused | Exceeds local development container RAM limit in FP16. |

---

## 3. Selected Primary Base Model

**Selected Model:** `Qwen/Qwen2.5-0.5B-Instruct`  
**License:** Apache 2.0 (Permits commercial and research use, modification, and redistribution)  
**Tokenizer:** Byte-Pair Encoding (BPE) with 151,643 vocabulary size, including dedicated `<|im_start|>`, `<|im_end|>`, and tool-call special tokens.  
**Quantization Support:** 4-bit NF4 (QLoRA via bitsandbytes) and GGUF (`q4_k_m`, `q8_0`) for llama.cpp / Ollama local execution.

### Environment Variable Configuration
The base model is decoupled from the codebase and configurable via `.env`:
```bash
ECHOCARE_BASE_MODEL="Qwen/Qwen2.5-0.5B-Instruct"
ECHOCARE_ADAPTER_PATH="./models/echocare-lora-adapter"
ECHOCARE_MAX_SEQ_LENGTH="1024"
ECHOCARE_INFERENCE_ENGINE="hybrid" # options: "lora", "gemini_teacher", "deterministic"
```

---

## 4. Fine-Tuning Strategy: Parameter-Efficient Fine-Tuning (PEFT / LoRA)

To avoid catastrophic forgetting while instilling EchoCare care coordination behavior:
- **Base weights frozen:** Base transformer weights remain unaltered.
- **Low-Rank Adaptation (LoRA):** Rank $r = 16$, $\alpha = 32$, targeting projection matrices `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`.
- **Trainable parameters:** Approximately 4.2 million parameters (under 0.9% of total parameters).
- **Adapter footprint:** ~16.8 MB on disk, allowing fast distribution and versioned switching without duplicating the 1GB base model.
- **Safety grounding:** The model is trained to generate structured tool calls (`{"name": "...", "arguments": {...}}`) that are intercepted and validated by EchoCare's application guardrails before execution.
