---
type: feature
id: WI-093
title: Analizadores TypeScript (código y dependencias) con evidencia
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
source_id: AUD-C5
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-1
  - EP-001 AC-5
dependencies:
  - AUD-C4
scope_confidence:
  level: medium
  reasons:
    - >-
      Primer candidato con IO real (invoca herramientas externas); el diseño
      clave es inyectar el runner de comandos para que el mapeo salida→hallazgos
      sea determinista y testeable con salidas de prueba, sin procesos reales.
    - >-
      La honestidad de confianza y evidencia se decide aquí: un hecho reportado
      por una herramienta es `confirmed`; una heurística es `likely`/`inferred`;
      ningún hallazgo sin evidencia ni provenance.
    - >-
      Una herramienta ausente o que falla debe producir cobertura parcial (vía
      el orquestador), nunca un resultado limpio; pero una salida con exit≠0 que
      sí trae hallazgos (p. ej. audit con vulnerabilidades) NO es un fallo.
surfaces:
  product-ui: not-applicable
  frontend: not-applicable
  backend: affected
  database: not-applicable
  configuration: reviewed-not-affected
  feature-flags: not-applicable
  content-copy: not-applicable
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: reviewed-not-affected
  operations-release: not-applicable
ready_at: '2026-11-27'
---

# Analizadores TypeScript (código y dependencias) con evidencia

> Materialized from Initiative INI-001, candidate AUD-C5.

## 1. Problema y valor

**Actor:** el flujo de auditoría de Kaddo (más adelante `kaddo audit run`, AUD-C8).

**Comportamiento actual:** existe el orquestador (WI-092) con una interfaz de
analizador (`Analyzer`), pero no hay analizadores **concretos**. Nada produce
todavía hallazgos reales de código y dependencias con evidencia.

**Comportamiento objetivo:** dos analizadores de Core que implementan la interfaz
`Analyzer` y producen hallazgos **respaldados por evidencia**:

1. **Dependencias:** ejecuta el `audit` del gestor de paquetes del proyecto
   (p. ej. `pnpm audit --json`) y mapea cada advisory a un `AuditFinding` con
   evidencia (advisory + paquete afectado), `provenance` = la herramienta y
   `confidence: 'confirmed'` (hecho reportado por la herramienta).
2. **Código (TypeScript):** ejecuta el diagnóstico del compilador (p. ej.
   `tsc --noEmit`) y mapea cada diagnóstico a un `AuditFinding` con evidencia
   (mensaje + `file:line`), `provenance` = la herramienta y severidad mapeada.

La invocación de la herramienta es **inyectable** (un runner de comandos), de modo
que la lógica de mapeo salida→hallazgos es pura y determinista y se prueba con
salidas de prueba, sin procesos reales. Una herramienta ausente o que falla se
señala honestamente para que el orquestador registre **cobertura parcial**; una
salida con exit≠0 que sí trae hallazgos no es un fallo.

**Valor (EP-001 AC-1, AC-5):** hallazgos verificables de código y dependencias,
con archivos, referencias y evidencia suficientes para su revisión.

**Completitud observable:** con salidas de prueba, el analizador de dependencias
produce hallazgos `confirmed` con evidencia del advisory, el de código produce
hallazgos con `file:line`, ambos enchufan en `runAudit` (WI-092), y una
herramienta ausente hace el run `partial`.

## 2. Alcance

- Un **runner de comandos** inyectable: `(command, args, options) => Promise<{ stdout, stderr, exitCode }>`,
  con una implementación por defecto sobre `execa` (ya usada en el repo) y un
  stub para pruebas.
- **Analizador de dependencias** (`createDependencyAnalyzer({ run })`): implementa
  `Analyzer`; ejecuta el `audit` del gestor de paquetes (detectado por el Discover
  / scan), parsea el JSON y mapea advisories a `AuditFinding`
  (`category: 'dependency'`, `confidence: 'confirmed'`, severidad del advisory,
  evidencia = resumen del advisory, provenance = `'<pm> audit'`).
- **Analizador de código TS** (`createTypescriptAnalyzer({ run })`): implementa
  `Analyzer`; ejecuta el diagnóstico de `tsc` y mapea diagnósticos a
  `AuditFinding` (`category: 'types'`, evidencia = mensaje + `file:line`,
  severidad mapeada del diagnóstico, provenance = `'tsc'`).
- **Mapeo honesto:** severidad tomada de la herramienta; `confidence` según la
  fuente (hecho de herramienta → `confirmed`; heurística → `likely`/`inferred`);
  nunca se sube una inferencia a confirmada.
- **Evidencia obligatoria:** cada hallazgo lleva `evidence` y `provenance`; no se
  emite ningún hallazgo sin ellas.
- **Ids estables** vía `stableFindingId` para deduplicar el mismo advisory /
  diagnóstico entre ejecuciones.
- **Fallo honesto:** herramienta ausente o salida inválida → el analizador señala
  fallo/skip (lo captura el orquestador como cobertura parcial); exit≠0 con
  hallazgos válidos (audit con vulnerabilidades) → `ok`.
- Lógica de mapeo pura y determinista, exportada desde el barrel de Core; el único
  punto impuro es el runner inyectado.
- Pruebas unitarias con **salidas de prueba** (fixtures), incluyendo integración
  con `runAudit`.

## 3. Fuera de alcance

- El comando `kaddo audit run` de cara al usuario y su cableado end-to-end real
  (AUD-C8) — aquí los analizadores se prueban con runner inyectado.
- Correlación de hallazgos con ADRs/ownership/Work Items (AUD-C6) y relación con
  Work Items existentes / dedup de planning (AUD-C10).
- Reporte estructurado y artefactos de salida (AUD-C7).
- Selección de alcance por módulo desde la UI (AUD-C3); el analizador respeta el
  `scope`/`dir` que recibe en el `context`.
- Analizadores de otros lenguajes (Rust, etc.) y herramientas adicionales
  (semgrep, eslint-security…): el MVP cubre dependencias (audit del PM) y tipos
  (tsc); añadir más analizadores no cambia la interfaz.
- Autofix o modificación de código/dependencias.

## 4. Acceptance Criteria

- [ ] **AC-01:** El analizador de dependencias implementa `Analyzer`, ejecuta el `audit` del gestor de paquetes del proyecto y mapea cada advisory a un `AuditFinding` con evidencia (advisory + paquete afectado), `provenance` = la herramienta y `confidence: 'confirmed'`.
- [ ] **AC-02:** El analizador de código TypeScript implementa `Analyzer`, ejecuta el diagnóstico del compilador (`tsc`) y mapea cada diagnóstico a un `AuditFinding` con evidencia (mensaje + `file:line`), `provenance` = la herramienta y severidad mapeada del diagnóstico.
- [ ] **AC-03:** La invocación de la herramienta externa es inyectable (un runner de comandos), de modo que la lógica de mapeo se prueba con salidas capturadas, sin spawnear procesos reales.
- [ ] **AC-04:** La severidad se mapea desde la clasificación de la propia herramienta y la `confidence` refleja la fuente (hecho de herramienta → `confirmed`; heurística → `likely`/`inferred`); nunca se sube por encima de lo que la herramienta soporta.
- [ ] **AC-05:** Todo hallazgo lleva `evidence` y `provenance`; no se emite ningún hallazgo sin ambas.
- [ ] **AC-06:** Los ids de hallazgo son estables (`stableFindingId`), de modo que el mismo advisory/diagnóstico se deduplica entre ejecuciones.
- [ ] **AC-07:** Una herramienta ausente o con salida inválida se señala honestamente (fallo/skip) para que el orquestador registre cobertura parcial — nunca un resultado limpio vacío; una salida con exit≠0 que sí trae hallazgos válidos (p. ej. `audit` con vulnerabilidades) NO se trata como fallo.
- [ ] **AC-08:** Los analizadores enchufan en el orquestador (`runAudit`, WI-092) y producen un `AuditRun` con sus hallazgos y tools; verificado con runners de prueba.
- [ ] **AC-09:** La lógica de mapeo (salida de herramienta → hallazgos) es pura y determinista y se exporta desde el barrel de Core (`packages/cli/src/core.ts`); el único punto impuro es el runner inyectado.
- [ ] **AC-10:** Hay pruebas unitarias con salidas de prueba que cubren: mapeo de advisories, mapeo de diagnósticos, mapeo de severidad/confianza, evidencia/provenance presentes, estabilidad/dedup de ids, herramienta ausente → cobertura parcial (vía `runAudit`), y exit≠0 con hallazgos → `ok`.

## 5. Validación

- `npx vitest run packages/cli/tests/audit-analyzers.test.ts` en verde (nuevos
  tests, con runner inyectado y fixtures de salida).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.

## 6. Definición de Done

- Runner inyectable + analizador de dependencias + analizador de código TS en
  Core (`cli`), implementando `Analyzer` (WI-092) y reutilizando
  `stableFindingId` (WI-090), exportados desde el barrel.
- Las 10 ACs verificadas con pruebas unitarias (fixtures, sin procesos reales).
- Build y gate raíz en verde; sin cambios en otras superficies ni escritura en
  `knowledge/`.

## 7. Preguntas abiertas

- ¿Código con `tsc --noEmit` o con el linter del proyecto (ESLint)? Propuesta:
  `tsc` para el MVP (diagnósticos `confirmed` del compilador, sin depender de la
  config de reglas del proyecto); ESLint/otros se añaden después sin cambiar la
  interfaz.
- Diferencias de esquema JSON entre `npm audit` y `pnpm audit`. Propuesta: mapear
  el gestor detectado por el Discover; empezar por `pnpm audit --json` y aislar el
  parseo por gestor.

## 8. Dependencias

- **AUD-C4 / WI-092** (completado): la interfaz `Analyzer` y `runAudit` que estos
  analizadores implementan y en la que enchufan.
- **AUD-C1 / WI-090** (completado): `AuditFinding` y `stableFindingId` para la
  evidencia y la deduplicación.
- Relación con **AUD-C2 / WI-091** (Discover): el gestor de paquetes y los módulos
  del `context`/`discovery` orientan qué `audit` ejecutar.

## 9. Learning

_What did we learn? Update after completion._
