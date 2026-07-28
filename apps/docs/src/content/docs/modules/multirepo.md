---
title: Multirepo modules
description: Discover and map secondary repositories as living modules of one system.
---

Kaddo represents not only the main architecture repo, but also the **secondary
repos** (frontend, backend, workers, infra…) as living modules of the same system.

> **Multirepo vs Knowledge Capsules.** Map a repo as a module when you have access and it is in
> scope. When a repo belongs to another team, is access-restricted, or you only need integration
> context, import a [Knowledge Capsule](/knowledge-capsules/) instead — no mapping, no source.

## Core and module roles

When initializing a multirepo project, `kaddo init` asks for a **role** immediately
after selecting multirepo structure:

- **core**: the architecture/orchestrator repo — defines the `system.name`, gets the
  full knowledge structure (business, product, roadmap, agents, skills) plus
  `knowledge/tech/system/system-context.md` and a modules map.
- **module**: a secondary repo that belongs to a system — gets only
  `knowledge/tech/module/module-context.md`, `knowledge/tech/current-state.md`, and
  `knowledge/tech/codebase.md`. No `business.md`, `product.md`, agents, skills, or
  `delivery/work-items/`.

The role and system identity are stored in `.kaddo/config.yml`:

```yaml
# Core repo
project:
  role: core
system:
  name: acme-platform
multirepo:
  role: core
  modules_file: .kaddo/modules.yml
  workspace_roots:
    - '..'

# Module repo
project:
  role: module
multirepo:
  role: module
  parent_system: acme-platform
module:
  id: billing
```

The `system.name` is set explicitly during core init and referenced by modules via
`multirepo.parent_system`. The `workspace_roots` array tells discovery where to look
for sibling repositories (defaults to `['..']`).

## Discovering modules

`kaddo modules discover` scans the workspace roots for sibling repositories and
classifies each one:

```bash
kaddo modules discover          # scan and show results (dry run)
kaddo modules discover --apply  # scan and persist eligible modules
```

Each discovered repository gets a status:

- **configured**: has `.kaddo/config.yml` with `role: module` and matching `parent_system`.
- **not_configured**: the directory exists but Kaddo is not initialized.
- **invalid**: has Kaddo initialized but `project.role` is not `module`.
- **foreign_system**: configured as a module but `parent_system` points to a different system.
- **duplicate**: another repo already registered the same module id.
- **missing**: previously registered in `.kaddo/modules.yml` but the path no longer exists.

Only **configured** modules with no warnings are eligible for mapping. The `--apply`
flag persists them to `.kaddo/modules.yml` and generates
`knowledge/tech/modules/modules.md`.

## Operitive index: .kaddo/modules.yml

`.kaddo/modules.yml` is the single source of truth for mapped modules:

```yaml
version: 1
system: acme-platform
workspace_roots:
  - '..'
modules:
  - id: billing
    name: Billing
    path: ../acme-billing
    parent_system: acme-platform
    status: configured
    context:
      module: knowledge/tech/module/module-context.md
      current_state: knowledge/tech/current-state.md
      codebase: knowledge/tech/codebase.md
```

## Mapping additional details

`kaddo modules map [path]` registers or updates a module in `.kaddo/modules.yml` and
generates the knowledge structure under `knowledge/tech/modules/<id>/`:

```bash
kaddo modules map              # interactive — asks for path
kaddo modules map ../frontend  # direct — maps the given repo
```

## Listing and validating

```bash
kaddo modules list     # read-only list from .kaddo/modules.yml
kaddo modules validate # check registered modules still exist and are valid
```

`kaddo modules list` reads directly from `.kaddo/modules.yml` — it never prompts,
discovers, or writes. `kaddo modules validate` checks each registered module path and
reports legacy knowledge paths that should be migrated.

## Module context

Each module repo has a `knowledge/tech/module/module-context.md` with 9 sections:

1. Module identity
2. Responsibility
3. Boundaries
4. Exposed interfaces
5. Dependencies
6. Consumers
7. Local rules
8. Risks
9. Open questions

The `module-context-agent` refines this artifact; the `module-context-refinement`
skill guides the refinement. Install the agent in the **core** repo with
`kaddo add agents` — module repos do not install agents or skills directly.

### Module project route

Module repos follow a 7-step project route (instead of the full 16-step core route):

1. Enable Kaddo
2. Scan repository
3. Refine module context
4. Describe current state
5. Map codebase
6. Validate module knowledge
7. Ready for core orchestration

### Knowledge layers in modules

For module repos, knowledge layers are evaluated differently:

| Layer | Status |
|---|---|
| Business | Not applicable — managed by core |
| Product | Not applicable — managed by core |
| Tech | Evaluated normally (module-context + current-state + codebase) |
| Delivery | Managed by core |

Module repos never create business, product, roadmap, or Work Items.
`kaddo add agents` and `kaddo add skills` are blocked on module repos.

> **Legacy path support.** Kaddo also reads `knowledge/module/module-context.md`
> (the pre-VS-093 path) if the new path does not exist. Run `kaddo modules validate`
> to detect legacy paths and get migration recommendations.

## Knowledge paths

All multirepo knowledge lives under `knowledge/tech/`:

| Artifact | Path |
|---|---|
| System context (core) | `knowledge/tech/system/system-context.md` |
| Modules map (core) | `knowledge/tech/modules/modules.md` |
| Module context (module) | `knowledge/tech/module/module-context.md` |
| Per-module design (core) | `knowledge/tech/modules/<id>/module-design.md` |

## Context efficiency

In a multirepo system, the Repository Exploration Tax multiplies: an agent has to discover which
repo owns which capability, where contracts live and which standards apply globally. Kaddo reduces
that exploration by mapping each repository as a module, keeping module knowledge under
`knowledge/tech/modules/<id>/` and surfacing the module map through `context` and `explain`.

## Example: architecture-repo + frontend + backend + infra

```bash
# in the architecture repo
kaddo init                    # select multirepo → core, set system name
kaddo modules discover --apply  # finds ../frontend, ../backend, ../infra
kaddo modules map ../frontend   # add detailed metadata
kaddo modules list
```

## Global vs module-level artifacts

- **Global** (whole system): `kaddo add standards|security|stack|git-strategy`
  writes `knowledge/tech/<topic>.md` once for the system. See
  [Standards, security & stack](/modules/global-docs/) and
  [Git strategy](/modules/git-strategy/).
- **Module-level** (per repo): `knowledge/tech/modules/<id>/*.md`, generated by
  `kaddo modules map`.

## Work Items and affected modules

Work Item front matter includes `affected_modules: []`. When a WI targets specific
modules, list them:

```yaml
affected_modules:
  - loyalty
  - billing
```

The context pack includes module-context for affected modules, and the understand
handoff suggests a branch strategy per module.

## Capsule export scopes

```bash
kaddo capsule export                  # project-level capsule (default)
kaddo capsule export --scope system   # includes all mapped module summaries
kaddo capsule export --module loyalty # capsule for a single module
```

> Kaddo never scans the secondary repos, never calls a Git/GitHub API, and never
> runs a security scan. It maps structure deterministically; your LLM agents do
> the interpretation.
