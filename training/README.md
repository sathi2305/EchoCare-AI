# EchoCare AI: Custom LLM Training & Voice Agent System

This directory houses the end-to-end custom language model training, dataset curation, supervised fine-tuning (PEFT/LoRA), and pre-deployment evaluation pipeline for EchoCare AI.

## Directory Structure

```
training/
├── MODEL_SELECTION.md           # Hardware audit and comparative analysis of open-weight models
├── README.md                    # System architecture and directory overview
├── SETUP_WINDOWS_VSCODE.md      # Step-by-step Windows, WSL2, and VS Code setup instructions
├── config.yaml                  # Root LoRA training hyperparameter configuration
├── prepare_dataset.py           # Multilingual dataset generator (English, Tamil, Hindi, Tanglish)
├── train_sft.py                 # Multilingual SFT training pipeline
├── evaluate_model.py            # Multilingual benchmark evaluation script
├── inference.py                 # Standalone inference CLI with structured tool parsing
├── configs/
│   └── train_config.yaml        # Detailed LoRA hyperparameters, optimizer, and scheduler configuration
├── data/
│   ├── dataset_schema.json      # JSON schema for conversational turns and tool calls
│   ├── dataset_summary.json     # Record counts and multilingual coverage stats
│   ├── train.jsonl              # Training split (70%)
│   ├── validation.jsonl         # Validation split (15%)
│   ├── val.jsonl                # Validation split alias
│   └── test.jsonl               # Independent test split (15%, zero-leakage verified)
├── evaluations/
│   ├── EVALUATION_REPORT.md     # Measured benchmark report comparing Base vs Fine-Tuned
│   ├── evaluate.py              # Automated 9-dimensional evaluation script
│   └── results.json             # Structured evaluation scores and gate statuses
└── scripts/
    ├── export_adapters.py       # LoRA adapter packaging and manifest generator
    ├── prepare_dataset.py       # Dataset synthesis, augmentation, and split generator
    ├── train.py                 # PyTorch/TRL/PEFT supervised fine-tuning pipeline
    └── validate_dataset.py      # Schema verification and cross-split leakage detector
```

## Quick Start Commands

```bash
# 1. Generate & split multilingual dataset (English, Tamil, Hindi)
python3 training/prepare_dataset.py

# 2. Verify schema and zero-leakage
python3 training/scripts/validate_dataset.py

# 3. Run supervised fine-tuning (SFT with LoRA)
python3 training/train_sft.py

# 4. Run multilingual benchmark evaluation
python3 training/evaluate_model.py

# 5. Test CLI inference with code-switching
python3 training/inference.py --prompt "Echo, innikku evening 6 manikku reminder set pannu."

# 6. Run automated test suite
python3 -m unittest discover tests
```
