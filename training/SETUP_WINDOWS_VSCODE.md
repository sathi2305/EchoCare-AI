# EchoCare AI: Windows & VS Code Setup Guide for LLM Fine-Tuning

This guide provides step-by-step instructions for running the EchoCare AI dataset pipeline, supervised fine-tuning (LoRA), and model serving locally on Windows 10/11 using Visual Studio Code, WSL2 (recommended), or native Python.

---

## 1. Prerequisites

### Recommended: Windows Subsystem for Linux (WSL2)
1. Open PowerShell as Administrator and run:
   ```powershell
   wsl --install -d Ubuntu-22.04
   ```
2. Restart your computer if prompted, then open the Ubuntu terminal.
3. Install Python 3.10 and venv:
   ```bash
   sudo apt update && sudo apt install -y python3 python3-pip python3-venv git
   ```

### Hardware Requirements
- **CPU-Only Mode (Inference & Dataset Validation):** Minimum 8 GB RAM, 4 CPU cores.
- **LoRA Fine-Tuning Mode:**
  - Recommended: NVIDIA GPU with 6GB+ VRAM (GTX 1660 Ti, RTX 3060, RTX 4060, etc.) with CUDA 12+.
  - Free Cloud Alternative: Open `training/scripts/train.py` directly in Google Colab (Select Runtime → T4 GPU).

---

## 2. VS Code Configuration

1. Install **Visual Studio Code** from [code.visualstudio.com](https://code.visualstudio.com/).
2. Install recommended extensions:
   - **WSL** (`ms-vscode-remote.remote-wsl`)
   - **Python** (`ms-python.python`)
   - **Pylance** (`ms-python.vscode-pylance`)
   - **YAML** (`redhat.vscode-yaml`)
3. Open the repository root folder in VS Code.

---

## 3. Virtual Environment Setup

Inside your VS Code terminal (WSL or PowerShell):

```bash
# 1. Create a dedicated virtual environment
python3 -m venv .venv

# 2. Activate the virtual environment
# On Linux / WSL:
source .venv/bin/activate
# On Windows PowerShell:
# .\.venv\Scripts\Activate.ps1

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install training dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers trl peft datasets accelerate bitsandbytes pyyaml
```

---

## 4. Running the End-to-End Pipeline

### Step 1: Prepare & Split Dataset
Generates zero-leakage `train.jsonl`, `val.jsonl`, and `test.jsonl`:
```bash
python3 training/scripts/prepare_dataset.py
```

### Step 2: Validate Dataset Schema & Partition Integrity
```bash
python3 training/scripts/validate_dataset.py
```

### Step 3: Run Supervised Fine-Tuning (SFT with LoRA)
```bash
python3 training/scripts/train.py \
  --base-model "Qwen/Qwen2.5-0.5B-Instruct" \
  --epochs 3 \
  --batch-size 2 \
  --grad-accum 4 \
  --learning-rate 2e-4 \
  --lora-r 16 \
  --lora-alpha 32 \
  --output-dir "./models/echocare-lora-adapter"
```

*Note:* If running on a GPU with limited VRAM (e.g. 4GB–6GB), add `--batch-size 1 --grad-accum 8`.

### Step 4: Export Adapter Artifacts
```bash
python3 training/scripts/export_adapters.py
```

### Step 5: Run Pre-Deployment Benchmark Evaluation
```bash
python3 training/evaluations/evaluate.py
```

### Step 6: Run Automated Test Suite
```bash
python3 -m unittest discover tests
```

---

## 5. Integrating with EchoCare AI Full-Stack Server

The trained adapter configuration in `models/echocare-lora-adapter` is loaded into EchoCare AI automatically.
Start the full-stack server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to interact with the voice assistant and inspect model status on the new **Custom LLM Training & Model Management** page.
