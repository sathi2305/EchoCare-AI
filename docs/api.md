# EchoCare AI — REST API Documentation

### Base URL: `/api`

### Endpoints

#### 1. System Health
- **GET** `/api/health`
  - Response: `{ status: "healthy", service: "EchoCare AI Coordination Backend", version: "1.0.0" }`

#### 2. Dashboard Summary
- **GET** `/api/dashboard/summary`
  - Returns aggregated metrics (adherence %, completed count, pending count, next scheduled task, active reminders) and recipient profile.

#### 3. Care Tasks
- **GET** `/api/tasks?status=...&category=...&search=...`
  - Returns list of care tasks matching filters.
- **POST** `/api/tasks`
  - Body: `{ title, description, category, priority, assignedTo, dueDate, dueTime, reminderLinked }`
- **PATCH** `/api/tasks/:id/complete`
  - Body: `{ completedBy, notes }`
- **PATCH** `/api/tasks/:id/cancel`
  - Body: `{ reason }`
- **DELETE** `/api/tasks/:id`

#### 4. Reminders
- **GET** `/api/reminders`
- **POST** `/api/reminders`
  - Body: `{ title, category, time, frequency, soundEnabled }`
- **PATCH** `/api/reminders/:id/toggle`
  - Toggles active status.
- **DELETE** `/api/reminders/:id`

#### 5. Caregiver Shift Handovers
- **GET** `/api/handovers`
- **POST** `/api/handovers/generate`
  - Body: `{ outgoingCaregiver, incomingCaregiver, shiftTitle }`
  - Truthfully compiles handover from stored records.
- **POST** `/api/handovers`
  - Saves manual or customized handover report.

#### 6. Activity History
- **GET** `/api/activities`
  - Returns immutable audit log of care events, tool calls, and completions.

#### 7. AI Assistant
- **POST** `/api/agent/chat`
  - Body: `{ message: string, confirmedAction?: object }`
  - Dispatches tools, returns structured assistant answer with tool execution payload.

#### 8. Model Context Protocol (MCP)
- **GET** `/api/mcp/tools`
  - Returns tools schema in MCP format.
- **POST** `/api/mcp/invoke`
  - JSON-RPC 2.0 endpoint for MCP `tools/call`.
