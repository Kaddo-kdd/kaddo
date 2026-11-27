---
type: feature
id: WI-092
title: Orquestador de análisis (fallo de tool = cobertura parcial)
knowledge_level: K3
status: in-progress
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
code: []
created_at: '2026-11-27'
source: initiative
source_id: AUD-C4
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-1
  - EP-001 AC-4
dependencies:
  - AUD-C1
scope_confidence:
  level: medium
  reasons:
    - >-
      Es el motor que ejecuta los analizadores y ensambla el AuditRun; su
      contrato de aislamiento de fallos y cobertura condiciona a los
      analizadores (AUD-C5), la correlación (AUD-C6) y el reporte (AUD-C7).
    - >-
      La regla central de EP-001 —un fallo de herramienta es cobertura parcial,
      nunca un resultado limpio— se materializa aquí y debe probarse con
      analizadores de prueba, sin depender de herramientas reales.
    - >-
      El orquestador no debe reclasificar hallazgos: conserva severidad y
      confianza (confirmado/inferido) tal como los entrega cada analizador.
surfaces:
  product-ui: not-applicable
  frontend: not-applicable
  backend: affected
  database: not-applicable
  configuration: not-applicable
  feature-flags: not-applicable
  content-copy: not-applicable
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: reviewed-not-affected
  operations-release: not-applicable
ready_at: '2026-11-27'
---

# Orquestador de análisis (fallo de tool = cobertura parcial)

> Materialized from Initiative INI-001, candidate AUD-C4.

## 1. Problema y valor

**Actor:** el flujo de auditoría de Kaddo (más adelante `kaddo audit run` vía
CLI/MCP/Admin).

**Comportamiento actual:** existe el contrato `AuditRun`/`AuditFinding` (WI-090,
con `buildAuditRun` que deriva estado y cobertura de forma honesta) y la base
factual del Discover (WI-091), pero no hay un **motor** que ejecute un conjunto
de analizadores, aísle sus fallos y ensamble un `AuditRun` a partir de sus
resultados.

**Comportamiento objetivo:** un orquestador de Core, dado un alcance, un
contexto y una lista de analizadores (adaptadores), ejecuta cada uno, **aísla**
sus fallos (una herramienta que lanza o rechaza se registra como `AuditToolRun`
fallido y su área como no evaluada, sin abortar a los demás), recolecta y
deduplica los hallazgos y ensambla un `AuditRun` mediante el contrato de Core.
Un fallo de herramienta produce **cobertura parcial**, nunca un resultado limpio
(EP-001 AC-4), y el orquestador **no reclasifica** hallazgos: conserva severidad
y confianza tal como las entrega el analizador.

**Valor (EP-001 AC-1, AC-4):** permite ejecutar una auditoría con hallazgos
verificables y distinguir confirmados, inferencias y áreas no evaluadas, con
honestidad de cobertura. Es el motor del que dependen los analizadores (AUD-C5),
la correlación (AUD-C6) y el reporte (AUD-C7).

**Completitud observable:** con analizadores de prueba (uno OK, uno que lanza,
uno omitido) `runAudit` devuelve un `AuditRun` `partial` con el tool fallido en
`coverage.notEvaluated`, los hallazgos del analizador OK deduplicados, y round-trip
de serialización verificado.

## 2. Alcance

- Una interfaz de **analizador** (adaptador) en Core (`cli`): `name`, `version?`
  y `run(context)` que devuelve hallazgos (`AuditFinding[]`) y, opcionalmente,
  áreas evaluadas / no evaluadas; puede ser síncrono o asíncrono.
- `runAudit({ id, createdAt, scope, analyzers, context })`: ejecuta cada
  analizador, captura su resultado o su fallo, deduplica hallazgos por id estable
  y **ensambla** un `AuditRun` reutilizando `buildAuditRun` (WI-090).
- **Aislamiento de fallos:** un analizador que lanza o rechaza se registra como
  `AuditToolRun` con `status: 'failed'` y su razón; su área pasa a
  `notEvaluated`; los demás analizadores continúan.
- **Honestidad de cobertura:** cualquier analizador fallido/omitido hace el run
  `partial` (o `failed` si todos fallan) y `coverage.complete = false`; nunca
  `completed` ante un fallo.
- **Sin reclasificación:** los hallazgos conservan `severity` y `confidence`
  (confirmado/likely/inferido) y su `provenance` (qué analizador los produjo) tal
  como los entrega el analizador; el orquestador no los sube de nivel.
- Determinismo: orden estable de tools y de hallazgos; dado el mismo conjunto de
  analizadores y contexto, el `AuditRun` producido es idéntico y serializa con
  round-trip (`serializeAuditRun`).
- Solo lectura: no escribe conocimiento canónico ni muta las entradas; la
  persistencia (`writeAuditRun`) la decide el llamador.
- Exportado desde el barrel de Core; reutilizable por CLI/MCP/Admin.
- Pruebas unitarias con analizadores de prueba (sin herramientas reales).

## 3. Fuera de alcance

- Analizadores reales de TypeScript (código y dependencias): AUD-C5.
- Selección de alcance por módulo/rutas como operación de usuario: AUD-C3 (el
  orquestador **recibe** el `scope`, no lo resuelve de la UI).
- Correlación con ADRs/ownership/Work Items: AUD-C6.
- Reporte estructurado y artefactos de salida: AUD-C7.
- Comando `kaddo audit run` de cara al usuario: AUD-C8.
- Ejecución concurrente/paralela y límites de tiempo configurables: fuera del
  MVP (ejecución secuencial y determinista; un `timeout` por analizador se puede
  abordar después sin cambiar el contrato).

## 4. Acceptance Criteria

- [ ] **AC-01:** Existe una interfaz de analizador (adaptador) con `name`, `version?` y `run(context)` que devuelve hallazgos (`AuditFinding[]`) y, opcionalmente, áreas evaluadas / no evaluadas; `run` puede ser síncrono o asíncrono.
- [ ] **AC-02:** `runAudit({ id, createdAt, scope, analyzers, context })` ejecuta cada analizador y ensambla un `AuditRun` reutilizando el contrato de Core (`buildAuditRun`), con los hallazgos deduplicados por id estable.
- [ ] **AC-03:** Un analizador que lanza o rechaza queda aislado: se registra como `AuditToolRun` con `status: 'failed'` y su razón, y su área queda en `notEvaluated`, sin abortar la ejecución de los demás analizadores.
- [ ] **AC-04:** Cualquier analizador fallido u omitido hace el run `partial` (o `failed` si todos fallan) con `coverage.complete = false`; nunca `completed` cuando una herramienta falló.
- [ ] **AC-05:** Los hallazgos conservan la `severity` y la `confidence` (confirmado/likely/inferido) que entrega el analizador; el orquestador no reclasifica ni sube una inferencia a confirmada.
- [ ] **AC-06:** Cada hallazgo registra su `provenance` (qué analizador lo produjo) y el run lista los tools con su `name`, `version?` y resultado.
- [ ] **AC-07:** Dado el mismo conjunto de analizadores y contexto, el `AuditRun` producido es idéntico (orden estable de tools y hallazgos) y serializa con round-trip (`serializeAuditRun`).
- [ ] **AC-08:** El orquestador es de solo lectura: no escribe conocimiento canónico ni muta las entradas; la persistencia (`writeAuditRun`) la decide el llamador.
- [ ] **AC-09:** La función es pura (sin red más allá de lo que haga cada analizador; el núcleo de ensamblaje es determinista) y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin.
- [ ] **AC-10:** Hay pruebas unitarias con analizadores de prueba que cubren: todos OK → `completed`; uno que lanza → `partial` + tool fallido + `notEvaluated`; todos fallan → `failed`; deduplicación entre analizadores; conservación de confianza; y registro de provenance.

## 5. Validación

- `npx vitest run packages/cli/tests/audit-orchestrator.test.ts` en verde (nuevos
  tests, con analizadores de prueba).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.

## 6. Definición de Done

- Interfaz de analizador + `runAudit` (ensamblaje, aislamiento de fallos,
  cobertura parcial, sin reclasificación) en Core (`cli`), exportados desde el
  barrel y reutilizando `buildAuditRun`/`dedupeFindings`/`serializeAuditRun`.
- Las 10 ACs verificadas con pruebas unitarias (analizadores de prueba, sin
  herramientas reales).
- Build y gate raíz en verde; sin cambios en otras superficies ni escritura en
  `knowledge/`.

## 7. Preguntas abiertas

- ¿El `context` del analizador incluye el `ProjectDiscovery` (WI-091) completo o
  solo el `scope` + `dir`? Propuesta: incluir `dir`, `scope` y, opcionalmente,
  `discovery`, para que un analizador pueda usar la base factual sin recomputarla.
- ¿Ejecución secuencial o en paralelo? Propuesta: secuencial y determinista en el
  MVP; la paralelización no cambia el contrato y se puede abordar después.

## 8. Dependencias

- **AUD-C1 / WI-090** (completado): el contrato `AuditRun`/`AuditFinding` y
  `buildAuditRun`/`dedupeFindings`/`serializeAuditRun` que este orquestador
  reutiliza.
- Relación con **AUD-C2 / WI-091** (Discover): el `context` puede transportar el
  `ProjectDiscovery` como base factual (no es dependencia dura).

## 9. Learning

_What did we learn? Update after completion._
