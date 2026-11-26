---
type: initiative
id: INI-001
title: Audit Core & Discovery
status: planned
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
  - id: AUD-C2
    title: 'Discover: stack, módulos, dependencias y configuración'
    type: feature
    suggested_knowledge_level: K2
    expected_value: Base factual para análisis y correlación.
    source_signals:
      - EP-001 AC-1
    dependencies:
      - AUD-C1
  - id: AUD-C3
    title: Selección de alcance por módulo (monorepo)
    type: feature
    suggested_knowledge_level: K2
    expected_value: Permite auditar un módulo o rutas específicas.
    source_signals:
      - EP-001 AC-3
    dependencies:
      - AUD-C2
priority: high
epic: EP-001
---

## Objetivo

Establecer la base del flujo de auditoría de EP-001: el contrato de Core (AuditRun y AuditFinding) y la
fase de Discover (stack, módulos, dependencias y configuración), de modo que CLI, MCP y Admin puedan
derivar resultados consistentes del mismo contrato (EP-001 AC-9). Es el frente del que depende todo lo
demás (analizadores, reporte, interfaces, planificación de remediación).

## Alcance

- Contratos tipados `AuditRun` (id, fecha, commit, scope, herramientas, cobertura, referencia al reporte,
  relación con auditorías previas) y `AuditFinding` (id estable, categoría, evidencia y procedencia,
  severidad y confianza independientes, estado open/acknowledged/accepted-risk/false-positive/resolved).
- Deduplicación y trazabilidad de hallazgos entre ejecuciones.
- Discover: identificar stack, módulos, dependencias y configuración; selección de alcance por módulo en
  monorepos.

## Candidatos (sin materializar)

Propuestas pendientes de autorización humana; no se materializan como Work Items automáticamente.
