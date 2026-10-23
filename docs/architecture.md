# EchoCare AI — System Architecture
## Proactive Agentic Home Care Coordinator | Amazon Developer Hackathon 2026

```
+-----------------------------------------------------------------------------------+
|                              EchoCare AI Client (React 19)                         |
|  - Deep Navy / Cyan HUD UI         - Animated AI Orb         - Web Audio Synthesizer  |
|  - Voice Input (Web Speech API)    - Tamil & English Support - Recharts Adherence  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTP / JSON-RPC 2.0)
+-----------------------------------------------------------------------------------+
|                        EchoCare Full-Stack Coordination Server                    |
|  - Express / FastAPI REST API                                                    |
|  - Model Context Protocol (MCP) Streamable Server                                 |
+-----------------------------------------------------------------------------------+
        │                                                     │
        ▼                                                     ▼
+─────────────────────────────────+         +──────────────────────────────────────+
|       Agentic AI Layer          |         |           Persistence Engine         |
| - Proactive Routine Engine      |         | - Tasks & Medication Schedules       |
| - Tool Validator & Dispatcher   |         | - Auditable Activity History         |
| - Confirmation Guardrails       |         | - Caregiver Shift Handovers          |
| - Gemini 2.5 + Safe Fallback    |         | - Care Recipient Clinical Profiles   |
+─────────────────────────────────+         +──────────────────────────────────────+
```

### Core Design Principles

1. **Safety Safeguarded & Consequential Approvals**: Consequential actions (such as task cancellations, medication changes, or emergency updates) require explicit confirmation before persistence.
2. **Truthful Factual Retrieval**: The AI assistant never fabricates clinical metrics or completes tasks without real caregiver action. All summaries are computed from verifiable records.
3. **Dual Execution Engine**:
   - **Gemini API Mode**: When `GEMINI_API_KEY` is present, uses Google's latest `gemini-2.5-flash` model with tool-use schemas.
   - **Deterministic Agent Mode**: Guaranteed 100% reliable local test mode that parses intents and dispatches identical validated tools.
4. **Standard MCP Compliant**: Provides standard MCP tools over both Streamable HTTP (`/api/mcp/invoke`) and `stdio`.
