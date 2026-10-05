---
title: Modules overview
description: Optional modules installed with kaddo add.
---

Modules extend Kaddo with new artifact types and directories. Install one with:

```bash
kaddo add adr
```

| Module | Adds |
|---|---|
| `adr` | Architecture Decision Records (K4) |
| `rfc` | Request for Comments (K3) |
| `incident` | Incident reports (K3) |
| `migration` | Migration plans (K4) |
| `legacy` | Legacy system notes (K3) |
| `contracts` | API/data contracts (K4) |
| `capabilities` | Product capabilities (K3) |
| `guard-advanced` | CI guard rules (`rules.yml`) |
| `agents` | Agent definitions |
| `skills` | Skill definitions |
| `standards` | Global coding/docs/testing conventions starter |
| `security` | Security considerations starter (no scanning) |
| `stack` | Technologies and stack decisions starter |
| `git-strategy` | Git strategy starter (GitHub Flow + Conventional Commits + SemVer) |

Each module declares its directories, work-item types, and quality gates. Modules
are tracked in `.kaddo/config.yml` under a `module_<name>` key.

> **Modules vs features.** A *module* is something you install with `kaddo add` that adds
> directories, work-item types and gates. Everything else in the sidebar — diagrams, reports,
> the MCP server, adapters — is a built-in feature or interface of Kaddo, not an installable module.
