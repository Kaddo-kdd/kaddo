---
title: Module templates
description: Per-repo design, stack, security, standards and ADRs (multirepo).
---

Generated under `architecture/modules/<id>/` by
[`kaddo modules map`](/modules/multirepo/). Each is a thin starter you refine with the
matching agent.

| Template | Purpose | Output path | Agent |
|---|---|---|---|
| Module Design | Purpose, boundaries, dependencies | `architecture/modules/<id>/module-design.md` | `module-design-agent` |
| Module Stack | The module's stack | `architecture/modules/<id>/stack.md` | `stack-agent` |
| Module Security | The module's security concerns | `architecture/modules/<id>/security.md` | `security-agent` |
| Module Standards | The module's standards | `architecture/modules/<id>/standards.md` | `standards-agent` |
| Module ADR | Module-scoped decision | `architecture/modules/<id>/adrs/` | — |

## Module Design

Front matter (`module`, `owner`, `repoPath`, `capabilities`, `code`). Sections:
Purpose · Boundaries · Inputs/Outputs · Dependencies · Related capabilities · Risks &
open questions.

## Module Stack / Security / Standards

Module-scoped versions of the global operations templates — document only what differs
from or specializes the system-wide artifacts.

## Module ADR

A decision that affects only this module. System-wide decisions belong in the
architecture repo's ADRs.
