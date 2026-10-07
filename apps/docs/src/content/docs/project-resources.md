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

## What this is not

Project Resources are knowledge, not execution. Kaddo does not run CLI commands, connect to Supabase
or AWS, install MCP servers, run SQL, provision infrastructure, store credentials, or manage a secrets
manager. For external *delivery/work-management* providers (Jira, GitHub Issues, Azure DevOps) see
[Integrations](/integrations/) — those are a different concept.
