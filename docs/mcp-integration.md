# EchoCare AI — Model Context Protocol (MCP) Integration Guide
### Protocol Version: 2024-11-05

## Overview
EchoCare AI implements the open Model Context Protocol (MCP) standard to allow host AI assistants (e.g. Claude Desktop, Amazon Alexa+ developer prototypes, custom LangChain/LlamaIndex agents) to securely coordinate home care tasks, query vitals, schedule reminders, and retrieve shift handovers.

## Architecture

```
[ Host LLM / MCP Client ]
          │
          │ JSON-RPC 2.0 (Streamable HTTP or Stdio)
          ▼
[ EchoCare MCP Server ]
          │
          ├── tools/list
          └── tools/call
                ├── get_daily_summary
                ├── list_care_tasks
                ├── create_care_task
                ├── complete_care_task
                ├── cancel_care_task (requires confirmation)
                ├── create_reminder
                ├── list_reminders
                └── generate_handover
```

## How to Test

### 1. In-App Interactive MCP Inspector
Open the EchoCare AI web application and navigate to the **MCP Inspector** tab in the sidebar. You can:
- View all 9 registered tool schemas.
- Customize argument values in JSON.
- Click **Execute Tool** to invoke the endpoint and inspect the live JSON-RPC 2.0 request/response envelope.

### 2. Streamable HTTP Test via cURL
```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_daily_summary",
      "arguments": { "date": "2026-10-20" }
    }
  }'
```

### 3. Local Python MCP Server
```bash
python mcp_server/server.py
```
