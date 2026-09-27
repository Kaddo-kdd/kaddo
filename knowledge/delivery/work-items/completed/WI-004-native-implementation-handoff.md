---
type: feature
id: WI-004
title: Native Implementation Handoff
status: completed
work_type: feature
created_at: '2026-09-27'
completed_at: '2026-09-27'
knowledge_level: K3
source:
  type: external
  imported_at: '2026-09-27'
  source_format: markdown-frontmatter
  source_hash: ''
  inferred: false
generated_by: kaddo-admin
depends_on:
  - VS-108
milestone:
  - Build Kaddo with Kaddo
closes_gaps:
  - G-01
domains:
  - CLI & System Context
  - Knowledge
  - Delivery
affected_modules:
  - packages/cli
  - knowledge/skills/implementation-planning
  - knowledge/agents/delivery
scope_confidence:
  level: high
  reasons:
    - VS-108 completed — Build Contract and gap analysis available
    - implementation-planning skill exists and needs enrichment
    - G-01 gap is well defined — design deliberation missing
    - No new runtime infrastructure required — skill and convention changes
---

# Native Implementation Handoff

## Actor and outcome

**Actor:** Developer or coding agent beginning implementation of a ready Work Item.

**Outcome:** A ready Work Item produces a structured Implementation Handoff with relevant context assembly and design deliberation, enabling the implementor to begin with confidence without depending on OpenSpec design.md.

## Current behavior

- implementation-planning skill produces: scope técnico, expected files, risks, validations, steps, stop criteria.
- No explicit design deliberation phase (technical approach, rationale, alternatives, trade-offs).
- Context assembly is informal — depends on agent's judgment about what to read.
- ADR skill exists but is not integrated into the WI workflow.

## Target behavior

- implementation-planning skill includes design deliberation: Technical Approach, Rationale, and optionally Alternatives/Trade-offs.
- Context assembly is guided by WI scope (affected_modules, domains, dependencies).
- ADR recommendation when decisions are architecturally significant.
- Human confirmation gate before implementation begins.
- Handoff remains a derived projection, not a new source of truth.

## Problem

G-01 from VS-108 gap analysis: OpenSpec design.md provided an explicit design deliberation phase that Kaddo lacks. Without it, technical decisions are made implicitly during implementation without documented rationale.

## Expected result

The implementation-planning skill produces a complete Implementation Handoff covering context summary, design deliberation, and implementation plan — proportional to the WI complexity.

## Scope

- Enrich implementation-planning skill with design deliberation
- Define context assembly guidance in the skill
- Integrate ADR recommendation for significant decisions
- Update implementation-agent prompt to reference enriched skill
- Add tests for the enriched workflow
- Validate with a real WI walkthrough

## Out of scope

- Implementation Evidence collection (VS-111)
- Verification orchestration (VS-111)
- OpenSpec removal
- Automatic code implementation
- New CLI commands or MCP tools (skill enrichment only)

## Acceptance criteria

- AC-01: Only a ready Work Item can produce an Implementation Handoff
- AC-02: Handoff assembles context from WI, Knowledge, System and Repository proportionally
- AC-03: Every Handoff includes Technical Approach and Rationale
- AC-04: Alternatives and trade-offs are documented when relevant, not mandatory for trivial changes
- AC-05: Handoff includes affected areas, implementation steps, and validation plan
- AC-06: Stop criteria are defined for the implementor
- AC-07: Workflow can recommend ADR for architecturally significant decisions
- AC-08: Handoff is a derived artifact, not a new source of truth
- AC-09: Human confirmation gate exists before implementation begins
- AC-10: Output is agent-neutral and human-compatible
- AC-11: Shared contract reusable from CLI, MCP, Agent interfaces
- AC-12: Existing WI lifecycle, refinement, and ready continue without regression

## Learning

1. **El patrón RefinementHandoff es directamente replicable.** `buildImplementationHandoff()` sigue el mismo patrón que `buildRefinementHandoff()` — tipo plano, builder determinístico, texto agent-agnostic. Validado con 15 tests. Este patrón es la base para cualquier handoff futuro (Evidence, Verification).

2. **La skill de implementation-planning era excesivamente lean (51 líneas).** Un skill debe tener un output template concreto (como adr-writing tiene). Sin template, cada agente inventa su propio formato. La versión enriquecida (con template, context assembly guidance, y design deliberation) es más operable.

3. **Deliberación de diseño proporcional funciona mejor que mandatoria.** Hacer obligatorios Alternatives y Trade-offs para cambios triviales genera boilerplate. La regla "document when non-trivial, note why omitted otherwise" balancea rigor y eficiencia.

4. **Context assembly guiado reduce scope creep.** Listar las 5 fuentes del Build Contract como checklist evita que el agente lea todo el proyecto o ignore contexto relevante. La proporcionalidad ("a bugfix needs the module, a cross-cutting feature needs topology") es la clave operativa.

5. **Las backticks en template strings de JS requieren escape simple (`\``), no triple.** `\\\`` produce `\` + backtick, no solo backtick. Error corregido durante la implementación.

6. **G-01 cerrado: la brecha de design.md de OpenSpec está cubierta.** 22 de 28 responsabilidades de OpenSpec ya estaban cubiertas (79%). Con VS-110, 25 de 28 (89%) — Technical Approach, Rationale y ADR recommendation cierran los 3 gaps parciales del mapping matrix.
