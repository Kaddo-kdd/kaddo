---
title: kaddo admin
description: Launch the local web admin interface for a Kaddo project.
---

`kaddo admin` starts a local web server that provides an interactive admin dashboard over
the current Kaddo project. It brings together project observability, Work Item management,
Integration management, and System exploration in a browser UI.

## Usage

```bash
kaddo admin
kaddo admin --port 8080
kaddo admin --host 0.0.0.0
kaddo admin --no-open
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--port <number>` | `4173` | Port for the admin server |
| `--host <address>` | `127.0.0.1` | Host to bind |
| `--no-open` | `false` | Do not open the browser automatically |

## Sections

The admin dashboard contains six sections:

### Overview

Project summary, readiness level, knowledge layer status, module list, route progress, and findings.

### Knowledge

Browse all knowledge layers and their artifacts. Filter by layer, status, or search text.

### Work Items

Full Work Item lifecycle management — create draft Work Items, view details, edit fields, and track status transitions. Search, filter by status or module.

### System Explorer

Interactive semantic system topology graph. Toggle Knowledge, Delivery, and Implementation overlays. Deep-link to nodes. For refined Work Items, view system impact classification (affected, reviewed, unknown) projected onto the graph.

### Integrations

Manage external integrations (Jira, GitHub, etc.): add, configure, verify connectivity, enable/disable, set credentials, and delete. Supports the provider catalog with configSchema and secretSchema.

### External Work Items

Discover work items across all enabled integrations. Filter by type, status, or search text. Import items as Draft Work Items with duplicate detection. Pagination with Load More.

## Security

- Session authentication: local, ephemeral, cookie-based (SameSite=strict, HttpOnly)
- CSRF protection: same-origin check on all state-changing requests
- Input validation: integration IDs and secret names validated server-side against path traversal
- Secrets: never exposed in API responses (boolean presence only)
- ErrorBoundary: a crash in one section does not affect the others

## Architecture

- The admin server consumes domain logic from Kaddo Core — it never duplicates it
- Git remains the canonical source of truth; SQLite is operational storage only
- The frontend uses the Kaddo Design System with semantic and domain color tokens
- All data flows through a REST API at `/api/v1/admin/`

## Known Limitations

- Single-user, single-machine — not intended for team-wide deployment
- Work Item editing is limited to fields supported by the Admin API
- System Explorer performance degrades above ~500 nodes

## Requirements

- Node.js >= 22.5 (for `node:sqlite` built-in module)
- The project must be initialized with `kaddo init`
- The admin frontend must be built (`pnpm -r build`)
