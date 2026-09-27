---
title: Admin MVP Guide
description: Complete guide to the Kaddo Admin web interface — setup, sections, and daily use.
---

This guide covers the Kaddo Admin web interface from first launch to daily use.

## Quick start

```bash
# Build once (needed after install or update)
pnpm -r build

# Launch the admin
kaddo admin
```

The browser opens at `http://127.0.0.1:4173`. A session cookie is set automatically — no login required.

## Navigating the six sections

### 1. Overview

The landing page. Shows project readiness, knowledge layer health, active findings, and the recommended next step. Use it as your morning check.

### 2. Knowledge

Browse knowledge artifacts organized by layer (Business, Product, Tech, Delivery). Each layer card shows artifact count and status (complete, placeholder, missing). Click a layer to see its artifacts; click an artifact for its full content and metadata.

### 3. Work Items

The Work Item lifecycle starts here:

1. **Create** — Click "+ Create Work Item", describe the intent, choose a type
2. **View** — See status, affected modules, system entities, provenance from external sources
3. **Edit** — Modify fields on draft or ready Work Items
4. **Filter** — By status (active, completed, archived), module, or free-text search

### 4. System Explorer

An interactive graph of your project's semantic topology. Nodes represent system entities (services, models, controllers, etc.) and edges show relationships.

- **Overlays**: Toggle Knowledge, Delivery, and Implementation layers
- **Search**: Find nodes by name or type
- **Work Item Impact**: Add `?workItem=WI-001` to see which entities a Work Item affects, with fit-to-view centering
- **Deep-link**: `?node=entityId` focuses a specific node

### 5. Integrations

Connect external tools:

1. Click "+ Add Integration" to open the provider catalog
2. Choose a provider (Jira, GitHub, etc.)
3. Enter an ID, configure fields, set credentials
4. "Verify & Save" tests connectivity before committing
5. Enable/disable integrations without losing configuration

Delete shows a confirmation dialog — imported Work Items are not affected.

### 6. External Work Items

Once integrations are enabled, discover their items:

1. Items appear grouped by integration
2. Filter by type, status, label, or search
3. Click "Import" to create a Draft Work Item — duplicate detection prevents re-import
4. "Load More" for paginated results

## MVP limitations

- **Single-user**: designed for one developer on localhost, not team deployment
- **No real-time sync**: data refreshes on navigation or manual "Refresh" clicks
- **System Explorer**: performance is best under ~500 nodes
- **Work Item editing**: limited to Admin API fields (full editing via CLI or agents)
