---
type: project-resource
id: RES-telemetry-service
title: Kaddo Telemetry Service
resource_type: service
provider: kaddo
environments:
  - production
access_interfaces:
  - type: api
    tool: HTTPS
    purpose: receive anonymous, opt-in usage telemetry from the Kaddo CLI/MCP
    operations:
      - ingest-events
access_boundaries:
  production:
    - write-only (clients send events; they never read)
authentication:
  mode: none
---

# Purpose

The endpoint that receives **anonymous, opt-in usage telemetry** from the Kaddo CLI and MCP, hosted at
`telemetry.kaddo.org`. It is disabled by default and requires explicit consent (see the Telemetry
docs). This is product telemetry — it is **not** the website analytics on `kaddo.org` (Google
Analytics), and the two share no identity.

# Access Interfaces

## API

Clients POST anonymous usage metadata over HTTPS. No identifiers, project names, repository data or
source are sent.

# Access Boundaries

- Production: clients are write-only; Kaddo never reads from this service as part of the lifecycle.

# Authentication

No client credentials are required. No tokens or secrets are stored in knowledge.
