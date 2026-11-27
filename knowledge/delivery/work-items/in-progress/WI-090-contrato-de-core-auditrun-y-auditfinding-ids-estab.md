---
type: feature
id: WI-090
title: 'Contrato de Core: AuditRun y AuditFinding (ids estables, deduplicación)'
knowledge_level: K3
status: in-progress
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
  - Delivery
code: []
created_at: '2026-11-26'
source: initiative
source_id: AUD-C1
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-5
  - EP-001 AC-8
  - EP-001 AC-9
scope_confidence:
  level: medium
  reasons:
    - >-
      Es el contrato base del que derivan CLI, MCP y Admin (EP-001 AC-9); su
      forma condiciona todo el resto del MVP.
    - >-
      Debe mantener severidad y confianza como dimensiones independientes y no
      marcar inferencias como confirmadas (regla de EP-001).
    - >-
      Los ids de hallazgo deben ser estables y deduplicables entre ejecuciones;
      la estrategia de id se valida con pruebas antes de considerarse
      definitiva.
surfaces:
  product-ui: not-applicable
  frontend: not-applicable
  backend: affected
  database: not-applicable
  configuration: affected
  feature-flags: not-applicable
  content-copy: not-applicable
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: reviewed-not-affected
  operations-release: not-applicable
ready_at: '2026-11-26'
---

# Contrato de Core: AuditRun y AuditFinding (ids estables, deduplicación)

> Materializado desde la Initiative INI-001 (Kaddo Audit — MVP), candidato AUD-C1.

## 1. Problema y valor

El flujo de auditoría de EP-001 necesita un **contrato de datos único en Core** del que deriven CLI, MCP y
Admin (EP-001 AC-9). Sin él, cada superficie modelaría los resultados por su cuenta y divergirían. Este Work
Item define los tipos `AuditRun` y `AuditFinding`, la generación de **ids estables**, la **deduplicación**
entre ejecuciones y la **serialización** determinista — la raíz de la que dependen los demás candidatos del
MVP (análisis, reporte, CLI, remediación).

## 2. Alcance

- Tipo **`AuditRun`**: id único, fecha, commit analizado, scope (proyecto/módulo/rutas), herramientas
  usadas (nombre + versión), estado de ejecución, cobertura, hallazgos, limitaciones de análisis,
  referencia al reporte y relación con auditorías anteriores.
- Tipo **`AuditFinding`**: id estable, categoría, descripción, ubicación, evidencia y procedencia, severidad
  y confianza **independientes**, impacto técnico y potencial impacto operativo, recomendación, esfuerzo
  (opcional), estado (`open` | `acknowledged` | `accepted-risk` | `false-positive` | `resolved`), referencias
  a ADRs/capacidades/Work Items y recomendación de planificación propuesta.
- **Id estable + deduplicación**: la misma entrada produce el mismo id; dos ejecuciones no generan ids
  distintos para el mismo hallazgo (clave estable por categoría + ubicación + huella del hallazgo).
- **Serialización** determinista a `.kaddo/audits/AUD-xxx.json` (round-trip) y lectura; sin tocar artefactos
  canónicos.
- Función **pura** en Core (sin LLM, sin red), reutilizable por CLI/MCP/Admin.

## 3. Fuera de alcance

Analizadores reales (AUD-C5), el reporte humano en Markdown (AUD-C7), los comandos `kaddo audit *` (AUD-C8/C9)
y las vistas MCP/Admin. Aquí solo el contrato, los ids/dedup y la serialización.

## 4. Acceptance Criteria

- [ ] **AC-01:** Existe el tipo `AuditRun` con id único, fecha, commit, scope, herramientas (nombre+versión), estado de ejecución, cobertura, hallazgos, limitaciones, referencia al reporte y relación con auditorías previas.
- [ ] **AC-02:** Existe el tipo `AuditFinding` con id estable, categoría, descripción, ubicación, evidencia y procedencia, severidad y confianza como dimensiones independientes, impacto técnico y operativo, recomendación, esfuerzo opcional, estado (open/acknowledged/accepted-risk/false-positive/resolved) y referencias a ADRs/capacidades/Work Items.
- [ ] **AC-03:** Los ids de hallazgo son estables entre ejecuciones (misma entrada → mismo id) y deduplicables; dos ejecuciones no producen ids distintos para el mismo hallazgo.
- [ ] **AC-04:** El contrato es puro (sin LLM ni red) y vive en Core, reutilizable por CLI, MCP y Admin desde la misma implementación.
- [ ] **AC-05:** La serialización a `.kaddo/audits/AUD-xxx.json` es determinista y hace round-trip (escribir → leer → igual), sin modificar artefactos canónicos.
- [ ] **AC-06:** Una inferencia no se marca como confirmada sin respaldo: severidad y confianza son independientes y el estado inicial de un hallazgo es `open`.
- [ ] **AC-07:** Un fallo de herramienta se representa como cobertura parcial en el `AuditRun`, nunca como resultado limpio.
- [ ] **AC-08:** Hay tests unitarios de los tipos, la estabilidad y deduplicación de ids, la serialización round-trip y los estados de hallazgo.

## 5. Validación

Tests unitarios en `packages/cli`: construcción de `AuditRun`/`AuditFinding`, estabilidad de ids (misma
entrada → mismo id), deduplicación entre dos ejecuciones, serialización round-trip a/desde JSON, y defaults
honestos (estado `open`, severidad/confianza separadas, cobertura parcial ante fallos). `pnpm -r build` y el
gate raíz en verde.

## 6. Learning

_Completar en Gate C: diseño del contrato, estrategia de id/dedup, decisiones de serialización y límites._
