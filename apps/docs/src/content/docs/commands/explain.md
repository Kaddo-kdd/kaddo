---
title: kaddo explain
description: Explain the Knowledge Repository for humans or agents.
---

```bash
kaddo explain                      # human-readable summary
kaddo explain --for agent          # structured JSON for AI tools
kaddo explain --scope payments     # limit to a domain or keyword
kaddo explain --type adr           # limit to one artifact type
kaddo explain --since 2026-01-01   # limit by creation date
```

The `--for agent` output is structured JSON including artifacts, domains,
`domain_owners`, `installed_modules`, and `enabled_plugins` — so agents start
with real context instead of assumptions.
