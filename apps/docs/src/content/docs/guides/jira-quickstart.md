---
title: Jira Integration Quickstart
description: Connect Jira to Kaddo and import work items in under five minutes.
---

This guide walks through connecting a Jira instance to Kaddo and importing your first work item.

## Prerequisites

- Kaddo initialized project (`kaddo init`)
- A Jira instance (Cloud or Server) with API access
- A Jira API token ([create one here](https://id.atlassian.com/manage-profile/security/api-tokens) for Cloud)

## Step 1 — Add the Jira integration

### Via Admin UI

1. Run `kaddo admin` and open Integrations
2. Click "+ Add Integration"
3. Select **Jira** from the provider catalog
4. Fill in:
   - **Integration ID**: e.g. `my-jira`
   - **Base URL**: your Jira instance URL (e.g. `https://company.atlassian.net`)
   - **Email**: your Jira account email
   - **API Token**: your Jira API token (stored encrypted, never exposed in API responses)
5. Click "Verify & Save" — Kaddo tests the connection before committing

### Via CLI

```bash
kaddo integrations create --id my-jira --adapter jira
kaddo integrations set-config my-jira baseUrl https://company.atlassian.net
kaddo integrations set-secret my-jira email you@company.com
kaddo integrations set-secret my-jira apiToken YOUR_TOKEN
kaddo integrations enable my-jira
kaddo integrations status my-jira
```

## Step 2 — Configure filters (optional)

By default, Kaddo discovers all items the API token has access to. Narrow the scope with JQL:

- **Admin UI**: Go to the integration detail → Filters section
- **CLI**: `kaddo integrations set-filter my-jira jql "project = PROJ AND status != Done"`

## Step 3 — Discover and import

### Via Admin UI

1. Go to **External Work Items**
2. Items from Jira appear grouped under the integration
3. Filter by type (Bug, Task, Story, Epic) or status
4. Click **Import** on any item → choose a Kaddo Work Item type → "Import as Draft"
5. Kaddo detects duplicates — already imported items show the "Imported" badge

### Via CLI

```bash
kaddo integrations discover my-jira
kaddo integrations import my-jira PROJ-123 --type feature
```

## What happens on import

1. Kaddo creates a **Draft** Work Item in `knowledge/delivery/work-items/draft/`
2. The original external data is stored as a snapshot for provenance
3. The Work Item detail shows the source integration, external ID, and last sync timestamp
4. The imported item is marked in External Work Items — re-import is blocked

## Troubleshooting

| Issue | Solution |
|---|---|
| `unauthorized` status | Check email + API token; ensure the token has read access |
| `invalid-config` status | Verify the base URL format (include `https://`) |
| No items discovered | Check JQL filter; ensure the token has project access |
| "Invalid JQL" error | Kaddo normalizes the error — check the JQL syntax in Jira |
