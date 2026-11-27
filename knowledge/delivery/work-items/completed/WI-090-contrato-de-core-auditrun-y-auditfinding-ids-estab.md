---
type: feature
id: WI-090
title: 'Contrato de Core: AuditRun y AuditFinding (ids estables, deduplicación)'
knowledge_level: K3
status: completed
completed_at: 2026-11-26
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
  - Delivery
code: []
created_at: '2026-11-26'
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/audit.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/audit-contract.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-contract.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Existe el tipo `AuditRun` con id único, fecha, commit, scope, herramientas (nombre+versión), estado de ejecución, cobertura, hallazgos, limitaciones, referencia al reporte y relación con auditorías previas.'
      status: passed
      evidence: 'El tipo AuditRun define id, createdAt, commit, scope (project/module/paths), tools (name+version+status), status (completed/partial/failed), coverage, findings, limitations, reportRef y previousRunId.'
      reference: 'packages/cli/src/core/audit.ts'
      method: manual
    - criterion: '**AC-02:** Existe el tipo `AuditFinding` con id estable, categoría, descripción, ubicación, evidencia y procedencia, severidad y confianza como dimensiones independientes, impacto técnico y operativo, recomendación, esfuerzo opcional, estado (open/acknowledged/accepted-risk/false-positive/resolved) y referencias a ADRs/capacidades/Work Items.'
      status: passed
      evidence: 'El tipo AuditFinding define id estable, category, title, description, location, evidence y provenance, severity y confidence como dimensiones independientes, impacto técnico/operativo, recommendation, effort, status (open/acknowledged/accepted-risk/false-positive/resolved) y references (adrs/capabilities/workItems).'
      reference: 'packages/cli/src/core/audit.ts'
      method: manual
    - criterion: '**AC-03:** Los ids de hallazgo son estables entre ejecuciones (misma entrada → mismo id) y deduplicables; dos ejecuciones no producen ids distintos para el mismo hallazgo.'
      status: passed
      evidence: 'stableFindingId es estable entre ejecuciones (misma entrada → mismo id) e independiente del separador de rutas; dedupeFindings conserva una entrada por id. Tests: estabilidad, diferencia por fingerprint y deduplicación.'
      reference: 'packages/cli/tests/audit-contract.test.ts'
      method: manual
    - criterion: '**AC-04:** El contrato es puro (sin LLM ni red) y vive en Core, reutilizable por CLI, MCP y Admin desde la misma implementación.'
      status: passed
      evidence: 'El contrato es puro (sin LLM ni red) y se exporta desde el barrel de Core (packages/cli/src/core.ts), reutilizable por CLI, MCP y Admin desde la misma implementación.'
      reference: 'packages/cli/src/core.ts'
      method: manual
    - criterion: '**AC-05:** La serialización a `.kaddo/audits/AUD-xxx.json` es determinista y hace round-trip (escribir → leer → igual), sin modificar artefactos canónicos.'
      status: passed
      evidence: 'serializeAuditRun produce JSON determinista (orden de claves recursivo) y hace round-trip; writeAuditRun/readAuditRun persisten y leen en .kaddo/audits/AUD-xxx.json; nextAuditRunId es monotónico. Verificado por tests.'
      reference: 'packages/cli/tests/audit-contract.test.ts'
      method: manual
    - criterion: '**AC-06:** Una inferencia no se marca como confirmada sin respaldo: severidad y confianza son independientes y el estado inicial de un hallazgo es `open`.'
      status: passed
      evidence: 'Test: severity y confidence son independientes (critical + inferred coexisten) y un hallazgo sin estado explícito queda en ''open''.'
      reference: 'packages/cli/tests/audit-contract.test.ts'
      method: manual
    - criterion: '**AC-07:** Un fallo de herramienta se representa como cobertura parcial en el `AuditRun`, nunca como resultado limpio.'
      status: passed
      evidence: 'Test: una herramienta fallida hace el run ''partial'' con coverage.complete=false y la registra en notEvaluated; todas fallidas → ''failed''. Nunca un resultado limpio ante fallo de herramienta.'
      reference: 'packages/cli/tests/audit-contract.test.ts'
      method: manual
    - criterion: '**AC-08:** Hay tests unitarios de los tipos, la estabilidad y deduplicación de ids, la serialización round-trip y los estados de hallazgo.'
      status: passed
      evidence: 'packages/cli/tests/audit-contract.test.ts cubre tipos, estabilidad/deduplicación de ids, serialización round-trip, persistencia y estados (8 tests en verde).'
      reference: 'packages/cli/tests/audit-contract.test.ts'
      method: manual
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

Entregado en `main` (sin release; se publicará junto a un comando `kaddo audit` de cara al usuario). Módulo
`cli` (Core); sin cambios en otras superficies.

### Diseño del contrato
`AuditRun` y `AuditFinding` viven en un único módulo puro de Core (`audit.ts`), exportado por el barrel, del
que derivarán CLI, MCP y Admin (EP-001 AC-9). La honestidad está en el tipo, no en una convención: severidad
y confianza son dimensiones **independientes**, un hallazgo nace `open`, y un fallo de herramienta hace el run
`partial` con cobertura incompleta — nunca un resultado limpio. Una inferencia no puede presentarse como
confirmada.

### Id estable y deduplicación
`stableFindingId` deriva un id determinista de la identidad del hallazgo (categoría + ubicación normalizada +
fingerprint), independiente de la ejecución, el orden y el separador de rutas, de modo que el mismo hallazgo
conserva el mismo id entre ejecuciones y `dedupeFindings` lo colapsa. Esto es la base del seguimiento
nuevos/persistentes/resueltos (AUD-C posterior), sin reescrituras.

### Serialización
JSON determinista con orden de claves **recursivo** (un primer intento con replacer-array descartaba claves
anidadas; corregido con un sort profundo) para round-trip y diffs limpios, persistido en `.kaddo/audits/`
(derivado, nunca un artefacto canónico).

### Límites
Solo el contrato, los ids/dedup y la serialización. Los analizadores reales (AUD-C5), el reporte Markdown
(AUD-C7) y los comandos `kaddo audit *` (AUD-C8/C9) son candidatos posteriores de INI-001. El siguiente paso
natural es AUD-C2 (Discover) o AUD-C4/C5 (analizadores) sobre este contrato.
