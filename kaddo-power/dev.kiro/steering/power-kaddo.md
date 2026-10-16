---
inclusion: always
---

# Kaddo Agent Plugin for Kiro

Use Kaddo's structured project knowledge before exploring source files. Kaddo knowledge is the
starting point, not a substitute for verifying relevant implementation details.

## Sources of truth

- Kaddo Core and CLI own deterministic lifecycle rules and validation.
- The installed `@kaddo/mcp` server owns its current tools, resources and schemas.
- Installed Kaddo Skills own reusable KDD methodology.
- This steering file explains when and why Kiro should use those capabilities.

Do not infer a complete MCP API from this file. Discover capabilities from the installed server.

## Human decision boundary

Follow this sequence:

```text
discover -> analyze -> propose -> human validates -> Kaddo records -> continue
```

Never autonomously:

- mark a Work Item ready;
- expand confirmed scope;
- resolve open questions;
- accept an ADR or business decision;
- treat graph traversal as confirmed impact;
- commit or push; or
- make an irreversible project decision.

Unknown and unreviewed surfaces remain visible. A missing graph edge does not prove no impact.

## Knowledge and delivery

Orient from Business, Product, Tech and Delivery knowledge, then inspect the selected Work Item.
Only a ready Work Item may enter implementation. Before coding, produce a plan grounded in its
scope, acceptance criteria, module coverage, risks and validation, and wait for human approval.

For user-facing changes, review the whole path rather than the first technical component: product,
frontend, backend, database, configuration, feature flags, authentication and authorization,
notifications, analytics, documentation, operations and affected modules.

After implementation, validate the result, use Guard, capture learning and propose the knowledge
updates implied by the change.

### Project Resources

External systems declared under `knowledge/tech/resources/` (databases, APIs, cloud services, etc.)
are Project Resources. Read them when planning implementation — they document access interfaces,
boundaries and auth references without storing credentials. If new external systems appear during
implementation, propose creating a Project Resource for each.

### Integrations

When `.kaddo/integrations.yml` exists, external work systems (Jira, GitHub Issues, etc.) are
connected. External items may be listed and imported as Draft Work Items. Import always requires
a human-selected Kaddo type. Kaddo never infers type from external metadata.

### Initiatives

Initiatives are an optional outcome layer over Work Items. They track which roadmap candidates have
been materialized and how their associated Work Items are progressing. A Work Item never requires
an initiative. Check initiative progress before planning large roadmap-driven work.

### Verification

When a Work Item is in-progress and implementation is complete, use `kaddo_verify_work_item` (or
`kaddo verify <id>`) to collect evidence against acceptance criteria before proposing closure. The
evidence is persisted in the Work Item front matter under `implementation_evidence`.

## Kiro and adapter responsibilities

This Power provides portable Skills, MCP integration and Kiro activation guidance. Repository-level
instructions in `AGENTS.md` are owned by `kaddo adapters install kiro`. Respect both when present;
do not create or duplicate MCP configuration unless the user asks to repair project binding.
