# EchoCare AI — Proactive Agentic Home Care Coordinator
### Built for Amazon Developer Hackathon 2026

![EchoCare AI Banner](https://img.shields.io/badge/EchoCare-AI%20Home%20Coordinator-06b6d4?style=for-the-badge)
![MCP Version](https://img.shields.io/badge/MCP%20Protocol-2024--11--05-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Apache--2.0-green?style=for-the-badge)

EchoCare AI is an intelligent home-care coordination platform that helps family caregivers and home health aides organize daily care activities, medication reminders, vital signs monitoring, household routines, and clinical shift handovers through a proactive conversational AI agent and open Model Context Protocol (MCP) server.

---

## 1. Problem Statement & Solution

- **The Challenge**: Families managing care for aging relatives or chronic conditions face scattered notes, forgotten medication doses, uncoordinated visits between family and visiting nurses, and lack of auditable records.
- **The Solution**: A centralized, proactive care hub with:
  - Factual data retrieval (never invents observations).
  - Safety guardrails (consequential actions require caregiver confirmation).
  - Truthful automated shift handovers compiled directly from verified recorded tasks.
  - Multi-modal interaction (voice in English and Tamil தமிழ், animated AI orb, and melodic audio chimes).
  - Open Model Context Protocol (MCP) server for integration with next-generation smart home assistants.

---

## 2. Core Features & Capabilities

- **Overview Dashboard**: Inspired by high-end clinical monitors, featuring deep navy and cyan hues, Recharts daily routine timeline, key adherence metrics, and live care-team status.
- **Alexa-Style Conversational Voice Assistant**:
  - Ambient Voice HUD with interactive animated AI orb (idle, listening, thinking, speaking).
  - Real-time Web Audio API frequency waveform visualizer directly connected to microphone input.
  - Multi-turn conversational memory & slot filling (e.g., asking for time when not specified, remembering recently created reminders).
  - Natural spoken answers via Web Speech Synthesis with voice picker, adjustable speech rate, and interruption (barge-in).
  - Spoken confirmation prompts for consequential actions ("Should I save it?").
  - Multilingual support for English (US) and Tamil (தமிழ்).
- **Proactive AI Assistant & HUD**:
  - Conversational agent with animated pulsating orb.
  - Tool execution inspection (view JSON arguments & outputs).
  - Consequential confirmation cards for sensitive actions.
- **Care Tasks Coordination**:
  - Full CRUD operations with priority, category, caregiver assignment, and due times.
  - Clinical completion notes (record blood glucose, blood pressure, mobility laps).
  - Real-time search and multi-category filtering.
- **Home Reminders**:
  - Auditory and visual chimes synthesized via the Web Audio API.
  - Flexible frequency (Daily, Twice daily, Weekly, Once).
  - Linked directly to care tasks.
- **Caregiver Shift Handover**:
  - 1-Click truthful synthesis of outgoing shift events from real stored records.
  - Formatted for clipboard copy and printable/PDF export.
  - Historical shift archive.
- **Auditable Activity History**:
  - Immutable event timeline recording every task completion, tool call, and approval.
- **MCP Inspector & Playground**:
  - Live in-app testbench for the Model Context Protocol server.
  - Inspect all 9 registered tool schemas and execute JSON-RPC 2.0 calls.
- **Household & Settings**:
  - Clinical target values (Blood pressure goals, fasting glucose targets).
  - Caregiver team registry and emergency contacts.
  - 1-Click Demo Reset to restore benchmark records anytime.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Web Audio API, Web Speech API.
- **Backend**: Node.js / Express full-stack runner with Vite middlewares + Python FastAPI reference backend (`backend/app/main.py`).
- **AI Agent**: Google `@google/genai` TypeScript SDK (Gemini 2.5 Flash) with robust deterministic local fallback.
- **MCP Protocol**: Official Model Context Protocol specification v2024-11-05 with Streamable HTTP and stdio transport.

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js 20+
- Python 3.10+ (for Python backend/MCP tests)

### Running the Full-Stack Application
```bash
# 1. Install dependencies
npm install

# 2. Run the full-stack dev server (starts on http://localhost:3000)
npm run dev
```

### Running the Python Backend & MCP Server
```bash
# In a separate terminal:
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Run automated tests
pytest tests/test_api.py -v
```

---

## 5. Model Context Protocol (MCP) Tools

| Tool | Description |
|---|---|
| `get_daily_summary` | Get care metrics and schedule adherence for care recipient. |
| `list_care_tasks` | Filter and query care tasks by category or status. |
| `create_care_task` | Schedule a new authorized care task with caregiver assignment. |
| `complete_care_task` | Record task completion with observational notes and vitals. |
| `cancel_care_task` | Cancel a task with required clinical reason (triggers approval). |
| `create_reminder` | Schedule an auditory chime reminder for Eleanor. |
| `list_reminders` | Query active home reminders. |
| `generate_handover` | Truthfully compile shift handover from stored records. |
| `get_activity_history` | Retrieve the immutable audit log. |

---

## 6. Safety & Non-Emergency Disclaimer

EchoCare AI is an assistive care coordination platform designed to organize schedules, tasks, and communications between caregivers and family members. It is not an emergency medical service, medical device, or replacement for professional clinical diagnosis.
