# EchoCare AI — Quality Assurance & Testing Guide

## 1. Automated Test Execution

### Backend Tests
EchoCare AI comes with automated pytest test coverage verifying:
- Health check endpoints
- Task CRUD, completion, and cancellation
- Reminder scheduling and audio chime enablement
- Shift handover synthesis from recorded tasks
- Input validation and boundary protections

Run tests:
```bash
pytest backend/tests/test_api.py -v
```

### TypeScript Validation & Linting
Verify TypeScript type consistency across all React components, models, and server handlers:
```bash
npm run lint
```

### Production Build Verification
Test Vite production compilation:
```bash
npm run build
```

## 2. End-to-End Verification Checklist

| Step | Action | Expected Result | Verified |
|---|---|---|---|
| 1 | Launch App & View Dashboard | Overview displays Eleanor Vance (78), 5 of 8 completed, adherence 63% | [x] |
| 2 | Ask Assistant for Daily Summary | Assistant executes `get_daily_summary` and reports truthful metrics | [x] |
| 3 | Schedule New Task via Agent | `create_care_task` executes, persists in Tasks list, linked reminder added | [x] |
| 4 | Complete Task with Notes | Record glucose or BP reading; status updates immediately; audit log adds event | [x] |
| 5 | Request Consequential Cancellation | Confirmation card appears requiring approval before cancellation | [x] |
| 6 | Generate Caregiver Handover | Click "Compile Shift Handover"; system aggregates verified tasks and vitals | [x] |
| 7 | Inspect MCP Server | Open MCP Inspector tab; verify all 9 tools and run JSON-RPC query | [x] |
| 8 | Test Audio Chime | Audio synthesizer plays pleasant melodic two-tone chime via Web Audio API | [x] |
| 9 | Voice Input (Tamil & English) | SpeechRecognition listens and speaks response via Web Speech synthesis | [x] |
| 10 | Reset Demo Records | Restores initial benchmark dataset with 1 click | [x] |
