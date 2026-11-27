---
type: initiative
id: INI-001
title: Kaddo Audit — MVP (CLI + TypeScript)
status: completed
knowledge_level: K3
domains:
  - Tech
  - Delivery
related_capabilities: []
created_at: '2026-11-26'
external_links: []
candidates:
  - id: AUD-C1
    title: 'Contrato de Core: AuditRun y AuditFinding (ids estables, deduplicación)'
    type: feature
    suggested_knowledge_level: K3
    expected_value: 'Contrato único del que derivan CLI, MCP y Admin (EP-001 AC-9).'
    source_signals:
      - EP-001 AC-5
      - EP-001 AC-8
      - EP-001 AC-9
    materialized_as: WI-090
  - id: AUD-C2
    title: 'Discover: stack, módulos, dependencias y configuración'
    type: feature
    suggested_knowledge_level: K2
    expected_value: Base factual para análisis y correlación.
    source_signals:
      - EP-001 AC-1
    dependencies:
      - AUD-C1
    materialized_as: WI-091
  - id: AUD-C3
    title: Selección de alcance por módulo (monorepo)
    type: feature
    suggested_knowledge_level: K2
    expected_value: Auditar un módulo o rutas específicas.
    source_signals:
      - EP-001 AC-3
    dependencies:
      - AUD-C2
    materialized_as: WI-096
  - id: AUD-C4
    title: Orquestador de análisis (fallo de tool = cobertura parcial)
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-1
      - EP-001 AC-4
    dependencies:
      - AUD-C1
    materialized_as: WI-092
  - id: AUD-C5
    title: Analizadores TypeScript (código y dependencias) con evidencia
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-1
      - EP-001 AC-5
    dependencies:
      - AUD-C4
    materialized_as: WI-093
  - id: AUD-C6
    title: 'Correlación de hallazgos con ADRs, ownership, WIs y riesgos'
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-4
    dependencies:
      - AUD-C5
    materialized_as: WI-094
  - id: AUD-C7
    title: 'Reporte estructurado + artefactos (knowledge/tech/audits, .kaddo/audits)'
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-4
      - EP-001 AC-5
    dependencies:
      - AUD-C6
    materialized_as: WI-095
  - id: AUD-C8
    title: kaddo audit run (con selección de alcance)
    type: feature
    suggested_knowledge_level: K2
    source_signals:
      - EP-001 AC-3
      - EP-001 AC-10
    dependencies:
      - AUD-C7
      - AUD-C3
    materialized_as: WI-097
  - id: AUD-C9
    title: kaddo audit report
    type: feature
    suggested_knowledge_level: K2
    source_signals:
      - EP-001 AC-10
    dependencies:
      - AUD-C8
    materialized_as: WI-098
  - id: AUD-C10
    title: Relacionar hallazgos con Work Items existentes + dedup
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-6
    dependencies:
      - AUD-C7
    materialized_as: WI-099
  - id: AUD-C11
    title: >-
      kaddo audit plan — preview de remediación + asociación a Planning con
      aprobación
    type: feature
    suggested_knowledge_level: K3
    source_signals:
      - EP-001 AC-7
      - EP-001 AC-10
    dependencies:
      - AUD-C10
      - AUD-C9
    materialized_as: WI-100
priority: high
epic: EP-001
outcome_verifications:
  - criterion: >-
      Auditar proyectos TypeScript y dependencias mediante CLI, con alcance por
      módulo y cobertura parcial explícita.
    status: passed
    evidence: 'Pruebas de analizadores, alcance, orquestación y comando de auditoría.'
    reference: >-
      packages/cli/tests/audit-analyzers.test.ts;
      packages/cli/tests/audit-scope.test.ts;
      packages/cli/tests/audit-orchestrator.test.ts;
      packages/cli/tests/audit-run-command.test.ts
    method: automated
    verified_at: '2026-11-27'
    verified_by: codex
  - criterion: >-
      Generar resultados y reportes reproducibles que separen evidencia
      confirmada, inferencias y áreas no evaluadas.
    status: passed
    evidence: Pruebas de contrato y generación de reportes.
    reference: >-
      packages/cli/tests/audit-contract.test.ts;
      packages/cli/tests/audit-report.test.ts
    method: automated
    verified_at: '2026-11-27'
    verified_by: codex
  - criterion: >-
      Relacionar hallazgos con Work Items existentes y previsualizar remediación
      sin escrituras automáticas, con aprobación explícita para vincular.
    status: passed
    evidence: 'Pruebas de vínculos, preview y CLI con fixtures aislados.'
    reference: >-
      packages/cli/tests/audit-work-item-link.test.ts;
      packages/cli/tests/audit-plan.test.ts
    method: automated
    verified_at: '2026-11-27'
    verified_by: codex
completed_at: '2026-11-27'
completion_decision:
  readiness: READY_TO_COMPLETE
  decided_at: '2026-11-27'
  reasons:
    - >-
      All success criteria are verified and committed scope is delivered. Human
      approval is still required to close.
---

## Objetivo

MVP del flujo de auditoría de EP-001: **auditar un proyecto TypeScript desde el CLI** con hallazgos
verificables, un reporte reproducible y un plan de remediación vinculable a Planning, todo sobre un
**contrato de Core compartido**. Es la primera Initiative de la épica; agrupa los frentes mínimos para un
MVP usable de punta a punta.

## Alcance (MVP) — frentes y candidatos

1. **Core & Discovery** — contrato `AuditRun`/`AuditFinding`, discover y alcance por módulo (AUD-C1–C3).
2. **Static Analysis (TypeScript)** — orquestador + analizadores con evidencia (AUD-C4, C5).
3. **Correlation & Report** — correlación con conocimiento + reporte confirmado/inferencia/no-evaluado +
   artefactos (AUD-C6, C7).
4. **CLI** — `kaddo audit run` / `kaddo audit report` (AUD-C8, C9).
5. **Remediation Planning** — dedup + `kaddo audit plan` (preview) + asociación a Planning con aprobación
   (AUD-C10, C11).

## Fuera del MVP (post-MVP, otras Initiatives más adelante)

- Adaptadores **Rust** (EP-001 AC-2).
- Paridad **MCP** y **Admin** (EP-001 AC-9).
- **compare/track** entre ejecuciones (EP-001 AC-8).

## Candidatos (sin materializar)

Propuestas pendientes de autorización humana; se materializan de a uno, empezando por AUD-C1 (contrato Core).

## Success Criteria

- Auditar proyectos TypeScript y dependencias mediante CLI, con alcance por módulo y cobertura parcial explícita.
- Generar resultados y reportes reproducibles que separen evidencia confirmada, inferencias y áreas no evaluadas.
- Relacionar hallazgos con Work Items existentes y previsualizar remediación sin escrituras automáticas, con aprobación explícita para vincular.
