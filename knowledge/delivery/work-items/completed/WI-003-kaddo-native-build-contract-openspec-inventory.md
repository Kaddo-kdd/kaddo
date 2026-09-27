---
type: feature
id: WI-003
title: Kaddo-Native Build Contract & OpenSpec Dependency Inventory
status: completed
completed_at: '2026-09-27'
work_type: feature
created_at: '2026-09-27'
knowledge_level: K3
source:
  type: external
  imported_at: '2026-09-27'
  source_format: markdown-frontmatter
  source_hash: ''
  inferred: false
generated_by: kaddo-admin
depends_on:
  - VS-107
milestone:
  - Build Kaddo with Kaddo
domains:
  - CLI & System Context
  - Knowledge
  - Delivery
  - Integrations
  - Admin UI
  - Admin Server
  - MCP
affected_modules:
  - packages/cli
  - packages/admin
  - packages/admin-server
  - packages/mcp
  - packages/integrations
  - apps/docs
  - openspec
  - knowledge
scope_confidence:
  level: high
  reasons:
    - VS-107 completed — Admin MVP hardened
    - OpenSpec footprint is enumerable via grep
    - Build Contract is definitional — no runtime changes
    - Discovery scope is bounded to this repository
---

# Kaddo-Native Build Contract & OpenSpec Dependency Inventory

## Actor and outcome

**Actor:** Kaddo project maintainer planning the migration from OpenSpec to Kaddo-native workflow.

**Outcome:** Complete understanding of OpenSpec dependencies, a formal Kaddo-Native Build Contract, and a gap analysis that enables the migration roadmap (VS-109 through VS-114).

## Current behavior

- OpenSpec exists as a directory (`openspec/`) with change artifacts (proposals, specs, tasks)
- Some CLI commands, docs, and workflows reference OpenSpec
- Kaddo already has Work Items, Knowledge, Refinement, System Context, and Admin
- No formal Build Contract defines the Kaddo-native lifecycle
- No inventory exists of what OpenSpec does vs what Kaddo already replaces

## Target behavior

- Every OpenSpec dependency is inventoried, classified, and mapped to a Kaddo equivalent or explicit gap
- A Kaddo-Native Build Contract defines the full lifecycle: Captured Intent → Completed
- A gap matrix identifies what must be built before OpenSpec can be retired
- Migration baseline metrics exist
- The roadmap VS-109 through VS-114 is validated against real gaps

## Problem

Removing OpenSpec without understanding its responsibilities could break capabilities not yet replaced by Kaddo. This VS performs the discovery and contract definition needed to migrate safely.

## Expected result

Four deliverables:
1. OpenSpec Dependency Inventory
2. Kaddo-Native Build Contract
3. OpenSpec → Kaddo Mapping Matrix
4. Migration Gap Analysis

## Scope

Discovery and contract definition only. No code removal, no OpenSpec deletion, no implementation of new lifecycle stages.

## Out of scope

- Eliminating OpenSpec
- Implementing Implementation Handoff, Evidence, or Verification
- Migrating existing specs
- Modifying CI/CD
- Building the OpenSpec compatibility bridge

## Acceptance criteria

- AC-01: Complete reproducible inventory of OpenSpec references and dependencies
- AC-02: Each dependency has a category
- AC-03: Operational vs historical dependencies distinguished
- AC-04: Each dependency documents its current responsibility
- AC-05: Each operational dependency documents removal impact
- AC-06: Each dependency has a Kaddo replacement or explicit gap
- AC-07: Each dependency classified (already-replaced / replacement-partial / replacement-missing / compatibility-only / historical-only)
- AC-08: Kaddo-Native Build Contract documented
- AC-09: Captured Intent contract defined
- AC-10: Refinement contract defined
- AC-11: Ready contract defined
- AC-12: Implementation Handoff contract defined conceptually
- AC-13: Implementation Evidence contract defined conceptually
- AC-14: Verification contract defined conceptually
- AC-15: Completed contract defined conceptually
- AC-16: No monolithic replacement spec introduced
- AC-17: Knowledge remains separate from Work Item
- AC-18: Dynamic context assembly contemplated
- AC-19: Contract is agent-neutral
- AC-20: Contract is human-compatible
- AC-21: OpenSpec → Kaddo mapping matrix exists
- AC-22: All gaps documented
- AC-23: Each gap classified (blocking / important / optional)
- AC-24: Each blocking gap has a target VS
- AC-25: OpenSpec not removed during VS-108
- AC-26: No new OpenSpec dependencies introduced
- AC-27: Migration baseline metrics exist
- AC-28: Build Contract validated with a representative Work Item
- AC-29: Next VS (109+) can begin without migration uncertainty

## Learning

1. **OpenSpec tiene cero dependencias runtime.** El scan reveló que OpenSpec no tiene imports en código fuente, ni en package.json, ni en CI/workflows. Todo su footprint es workflow de autoría (CONTRIBUTING.md, templates) y artifacts históricos (99 change folders). La barrera para retirarlo es de proceso, no técnica.

2. **El 79% de las responsabilidades de OpenSpec ya están cubiertas por Kaddo.** De 28 responsabilidades mapeadas desde los 4 templates de OpenSpec, 22 tienen cobertura completa en Kaddo (WI model + skills existentes), 3 tienen cobertura parcial, y 3 son gaps. Los gaps son menores (data model docs, error handling docs, output examples) — más prompts que capacidades.

3. **La infraestructura de tipos para Evidence y Verification ya existe pero está sin usar.** `lifecycle.ts` define RepoEvidence, ImplementationEvidence, ValidationStatus, ReleaseGate, CompletionException y CompletionDecision. Ningún comando CLI los consume aún. Estos tipos fueron diseñados con anticipación y están listos para ser activados en VS-111.

4. **El gap blocking es de documentación, no de funcionalidad.** El único gap blocking (G-07) es que CONTRIBUTING.md sigue instruyendo a usar OpenSpec. Actualizar esa sección es suficiente para desbloquear la eliminación (junto con los gaps important).

5. **El Build Contract se validó con el propio WI-003.** Usar WI-003 como caso de estudio confirmó que el lifecycle funciona end-to-end para trabajo documental. Las etapas 5 y 6 se ejecutaron manualmente, confirmando que la automatización es deseable pero no bloqueante.

6. **El design.md de OpenSpec no tiene un equivalente directo en Kaddo.** La implementation-planning skill cubre tasks y scope técnico, pero no la fase deliberativa de evaluar alternativas y documentar trade-offs. La adr-writing skill existe para decisiones arquitectónicas, pero no está integrada al workflow de WI. Este gap (G-01) es el más significativo para la calidad del proceso.
