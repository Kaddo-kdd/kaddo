---
title: Project Resources
description: Model external systems (databases, cloud, APIs, queues…) as first-class Tech Knowledge and link them to Work Items by role. Read-only knowledge — Kaddo never connects to them and never stores secrets.
---

Much of a system lives outside the repository — a Supabase database, an AWS account, a Kafka topic,
a third-party API. **Project Resources** model those external systems as first-class Tech Knowledge so
humans and agents can answer: what external systems does this project use, why, in which environments,
how can they be accessed, and what are the limits?

Project Resources are **read-only knowledge**. Kaddo never connects to the system, never runs any
interface, and never stores or resolves credential values — only references (an env var or secret
name).

:::note[Resource ≠ Access Interface ≠ Module]
- A **resource** is the stable external system (e.g. "Supabase Main Database").
- An **access interface** is a mechanism to reach it (CLI, MCP, SQL, API, SDK, IaC, Console).
- A **module** (`affected_modules`) is part of your own code. Resources are external systems — keep
  the two separate; don't turn a service into a module just to relate it to a Work Item.
:::

## Define a resource

Resources live under `knowledge/tech/resources/` with `type: project-resource`. The minimum is just
identity, type and provider; it grows only when you need interfaces or boundaries.

```markdown
---
type: project-resource
id: RES-supabase-main
title: Supabase Main Database
resource_type: database        # database | cloud | api | queue | storage | repository | platform | service | other
provider: supabase
environments: [development, production]
access_interfaces:
  - type: cli                  # cli | mcp | api | sql | sdk | iac | console | other
    tool: supabase
    purpose: migrations and local development
    operations: [migrations, schema-inspection]
  - type: mcp
    provider: Supabase
  - type: sql
    tool: psql
access_boundaries:
  development: [read, write, migrations]
  production: [read]
authentication:
  mode: external
  refs: [SUPABASE_ACCESS_TOKEN]   # reference NAMES only — never values
---

# Purpose

Stores application users, projects and product data.
```

### Security boundary

A resource **never** stores credentials. Allowed: a credential/env-var/secret **name**, the auth
mechanism, a required role, an access boundary. Not allowed: tokens, passwords, private keys,
connection strings with secrets, database credentials. Kaddo defensively drops any `authentication.refs`
entry that looks like a value (e.g. `NAME=value`), so a mistake never leaks.

## Link resources to Work Items

A Work Item declares the resources it relates to, by **role**, in its front matter — separate from
`affected_modules`:

```yaml
affected_modules:
  - api
resources:
  - id: RES-supabase-main
    role: affected        # affected | implementation | validation | delivery
  - id: RES-aws-platform
    role: validation
```

| Role | Meaning |
|---|---|
| `affected` | the resource's state/config/schema changes because of the Work Item |
| `implementation` | you need to interact with it to implement |
| `validation` | you need it to verify the outcome |
| `delivery` | it participates in deployment/release |

Resources are **optional**: a CSS change needs none. During refinement, the `work-item-refinement`
skill asks whether the change observes, modifies, validates or delivers against a known resource —
without inventing resources that aren't backed by project knowledge.

## Where resources show up

- **CLI**: `kaddo resources list` and `kaddo resources get <id>` (add `--json`). Read-only, no secrets.
- **MCP**: the `kaddo_list_resources` and `kaddo_get_resource` tools return the same, without secrets.
- **Implementation Handoff**: a "Relevant Resources" section lists only the Work Item's own resources
  with their role, purpose, interfaces and boundaries. It **informs** the agent — it never connects or
  runs anything, and a declared interface does not mean it is installed or connected.
- **Knowledge Graph**: a resource is a `project-resource` node; a Work Item's roles produce `affects`,
  `uses`, `validates_with` and `delivers_through` edges, with provenance from the Work Item.
- **Project description**: `tech/current-state.md` or `tech/codebase.md` may list resources briefly to
  explain the architecture, without duplicating the full definition:

  ```markdown
  ## External Resources

  - RES-supabase-main — primary application database
  - RES-aws-platform — runtime infrastructure
  ```

## Evidence

Implementation Evidence may reference validations performed against a resource — for example
"migration applied in development" or "expected schema verified". Evidence describes the **validation**,
never the resource's contents: no database records, query dumps, credential values or tokens.

## Managing resources (create, update, delete)

You don't have to write the Markdown by hand. Resources can be created, updated and deleted from the
CLI, the Admin, or an LLM via MCP — all converge on one Core contract, so the rules are the same
everywhere, and the artifact under `knowledge/tech/resources/` stays the source of truth.

**CLI:**

```bash
kaddo resources create --title "Supabase Main" --type database --provider supabase   # or run it with no flags, interactively
kaddo resources update RES-supabase-main --purpose "Primary application database"
kaddo resources delete RES-supabase-main      # lists what references it, then asks to confirm (--yes to skip)
```

**MCP / LLM:** the `kaddo_create_resource`, `kaddo_update_resource` and `kaddo_delete_resource` tools
follow a preview-then-confirm flow: without `confirm` they return a preview (and, for delete, what
references the resource) and write nothing; with `confirm: true` Core persists the change. An agent
proposes; a human confirms. The architecture agent can also suggest resource **candidates** from
existing knowledge — it never creates them silently.

**Admin:** the **Resources** section lists resources (grouped by scope), and lets you create, inspect,
edit and delete them. Deleting first shows what references the resource; those references are never
removed for you.

Deleting a resource only removes its own artifact — the `resources:` entries in Work Items that pointed
to it are left intact.

## Multirepo scope

In a multirepo project a resource can declare **ownership scope** — the system as a whole, or a
specific module — without moving its artifact out of the core repository (the canonical catalog always
lives in `knowledge/tech/resources/`):

```yaml
scope:
  type: module
  module: orders-api
```

A system-scoped resource can be **used by** several modules without being duplicated — this is a
dependency, distinct from ownership:

```yaml
scope:
  type: system
modules: [orders-api, billing-worker]
```

Module ids are validated against `.kaddo/modules.yml` when it exists (unknown modules are flagged, not
silently accepted). In the Knowledge Graph this produces `module ──depends_on──→ resource` edges, and
the Admin groups resources by scope and shows shared resources as "used by" their modules.

## What this is not

Project Resources are knowledge, not execution. Kaddo does not run CLI commands, connect to Supabase
or AWS, install MCP servers, run SQL, provision infrastructure, store credentials, or manage a secrets
manager. For external *delivery/work-management* providers (Jira, GitHub Issues, Azure DevOps) see
[Integrations](/integrations/) — those are a different concept.
