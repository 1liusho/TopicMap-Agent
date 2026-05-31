# Research Lineage Agent

This repository now includes the first runnable scaffold for the architecture
described in `docs/`.

## What is implemented

- `services/api`: FastAPI backend for the first project flow
  - `POST /api/projects`
  - `GET /api/projects`
  - `GET /api/projects/{project_id}`
  - `POST /api/projects/{project_id}/plan-query`
  - `POST /api/projects/{project_id}/run`
  - `GET /api/projects/{project_id}/runs/latest`
  - `GET /api/projects/{project_id}/papers`
  - `PATCH /api/projects/{project_id}/papers/{paper_id}`
- `apps/web`: Next.js App Router frontend for the first website flow
  - `/`
  - `/projects/new`
  - `/projects/[id]/run`
  - `/projects/[id]/papers`
  - `/projects/[id]/graph`
  - `/projects/[id]/report`
  - `/api/assistant/message` web-to-agent bridge route
- `packages/core`: shared Python data models for the API
- `data/projects`: local JSON storage for projects, runs, papers, and query plans

The current pipeline is intentionally mock-first:

- query planning is heuristic and deterministic
- run progress is simulated from elapsed time
- papers are generated from topic-specific seed data
- graph and report are generated from topic-specific mock insight rules

This matches the staged plan in `docs/`: first make the product flow visible,
then replace the mock pipeline with real retrieval, dedup, extraction, graph,
and report modules.

## Repository layout

```text
research-lineage-agent/
  apps/web/
  data/projects/
  docs/
  packages/core/
  services/api/
```

## Run the backend

```powershell
cd D:\科研助手Agent\research-lineage-agent\services\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m uvicorn app.main:app --reload --port 8000
```

## Run the frontend

```powershell
cd D:\科研助手Agent\research-lineage-agent\apps\web
Copy-Item .env.local.example .env.local
npm.cmd install
npm.cmd run dev
```

The frontend expects the backend at `http://127.0.0.1:8000` by default.

## What comes next

1. Replace the mock runner with real search adapters.
2. Replace mock graph/report generation with extraction pipelines backed by real evidence.
3. Point the web bridge at your real OpenClaw Gateway and let the agent call the `research-lineage` skill.
4. Make the OpenClaw `research-lineage` skill call the same backend API for a single source of truth.

## OpenClaw bridge configuration

The web app now includes `POST /api/assistant/message`.

- `OPENCLAW_BRIDGE_MODE=mock`: return grounded local answers from project context
- `OPENCLAW_BRIDGE_MODE=proxy`: forward the message to `OPENCLAW_BRIDGE_URL`
- `OPENCLAW_BRIDGE_MODE=gateway`: connect directly to a local OpenClaw Gateway over WebSocket

### Gateway mode

Set these values in `apps/web/.env.local`:

```env
OPENCLAW_BRIDGE_MODE=gateway
OPENCLAW_GATEWAY_WS_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your_gateway_token
OPENCLAW_GATEWAY_AGENT_ID=main
OPENCLAW_GATEWAY_SESSION_KEY_PREFIX=research-lineage
OPENCLAW_GATEWAY_TIMEOUT_SECONDS=120
OPENCLAW_GATEWAY_SCOPES=operator.admin
```

Behavior in `gateway` mode:

- the browser still talks only to your own Next.js route
- the Next.js route opens a WebSocket connection to OpenClaw
- it sends the current project, paper shortlist, graph snapshot, report summary, and recent chat history as grounded context
- it uses one OpenClaw session per project by default, so different projects do not bleed into each other

### Proxy mode

When `proxy` mode is enabled, the route forwards:

- `projectId`
- `message`
- `history`
- `context` containing current project, papers, graph, and report summary

This gives you two clean deployment paths:

- local direct integration through the Gateway
- a separate custom bridge service if you later want one
