# EchoCare AI Model Context Protocol (MCP) Server

This server implements the Model Context Protocol (MCP) Specification (v2024-11-05), exposing structured, schema-validated home care coordination tools to authorized AI agents and LLM clients.

## Supported Transports

1. **Streamable HTTP / JSON-RPC 2.0**: Available via the EchoCare API endpoint at `/api/mcp/invoke`.
2. **stdio Transport**: Standard input/output transport runnable via Python for local LLM developer environments (e.g., Claude Desktop, MCP Inspector).

## Exposed Tools

| Tool Name | Purpose | Consequential Confirmation |
|---|---|---|
| `get_daily_summary` | Fetches care adherence, vitals summary, and pending tasks. | Read-only |
| `list_care_tasks` | Queries care schedule with category and status filters. | Read-only |
| `create_care_task` | Schedules a new authorized care task. | Write |
| `complete_care_task` | Marks a task completed with caregiver observation notes. | Write |
| `cancel_care_task` | Cancels a task with mandatory clinical justification. | Requires Confirmation |
| `create_reminder` | Schedules an active auditory/visual chime reminder. | Write |
| `list_reminders` | Fetches all active reminders for the care recipient. | Read-only |
| `generate_handover` | Synthesizes a truthful shift handover from recorded records. | Write |
| `get_activity_history` | Returns the auditable immutable activity timeline. | Read-only |

## Running with MCP Inspector

```bash
# Test using stdio transport
python mcp_server/server.py

# Test JSON-RPC list tools request:
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | python mcp_server/server.py
```

## Protocol Compliance & Security Safeguards

- Input arguments strictly validated against JSON Schemas.
- Read and write operations segregated.
- Destructive and consequential actions require caregiver confirmation.
- Transparent non-emergency disclaimer maintained across all tool responses.
