---
type: feature
id: WI-093
title: Analizadores TypeScript (código y dependencias) con evidencia
knowledge_level: K3
status: completed
completed_at: 2026-11-26
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
code: []
created_at: '2026-11-27'
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/audit-analyzers.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/audit-analyzers.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-analyzers.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** El analizador de dependencias implementa `Analyzer`, ejecuta el `audit` del gestor de paquetes del proyecto y mapea cada advisory a un `AuditFinding` con evidencia (advisory + paquete afectado), `provenance` = la herramienta y `confidence: ''confirmed''`.'
      status: passed
      evidence: 'createDependencyAnalyzer implementa Analyzer: ejecuta ''<pm> audit --json'' y mapea cada advisory a un AuditFinding con evidencia (severidad + paquete + versiones + url), provenance ''<pm> audit'' y confidence ''confirmed''. Test de mapeo sobre fixture de audit.'
      reference: 'packages/cli/src/core/audit-analyzers.ts'
      method: manual
    - criterion: '**AC-02:** El analizador de código TypeScript implementa `Analyzer`, ejecuta el diagnóstico del compilador (`tsc`) y mapea cada diagnóstico a un `AuditFinding` con evidencia (mensaje + `file:line`), `provenance` = la herramienta y severidad mapeada del diagnóstico.'
      status: passed
      evidence: 'createTypescriptAnalyzer implementa Analyzer: ejecuta ''tsc --noEmit --pretty false'' y mapTscDiagnostics mapea cada diagnóstico a un AuditFinding con evidencia (file:line:col + mensaje), provenance ''tsc'' y severidad mapeada (error→high, warning→low).'
      reference: 'packages/cli/src/core/audit-analyzers.ts'
      method: manual
    - criterion: '**AC-03:** La invocación de la herramienta externa es inyectable (un runner de comandos), de modo que la lógica de mapeo se prueba con salidas capturadas, sin spawnear procesos reales.'
      status: passed
      evidence: 'La invocación es inyectable (type CommandRunner); los tests pasan un stubRunner que devuelve fixtures, sin spawnear procesos (execaRunner es el default real).'
      reference: 'packages/cli/src/core/audit-analyzers.ts'
      method: manual
    - criterion: '**AC-04:** La severidad se mapea desde la clasificación de la propia herramienta y la `confidence` refleja la fuente (hecho de herramienta → `confirmed`; heurística → `likely`/`inferred`); nunca se sube por encima de lo que la herramienta soporta.'
      status: passed
      evidence: 'mapSeverity toma la clasificación de la herramienta (critical/high/moderate|medium/low) y desconocido → info; confidence ''confirmed'' para hechos de herramienta, nunca subida. Test de severidad y de confianza.'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
    - criterion: '**AC-05:** Todo hallazgo lleva `evidence` y `provenance`; no se emite ningún hallazgo sin ambas.'
      status: passed
      evidence: 'Test (AC-05): todos los hallazgos producidos por runAudit cumplen evidence.length>0 y provenance.length>0; no se emite ninguno sin ambas.'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
    - criterion: '**AC-06:** Los ids de hallazgo son estables (`stableFindingId`), de modo que el mismo advisory/diagnóstico se deduplica entre ejecuciones.'
      status: passed
      evidence: 'Test (AC-06): mapAuditAdvisories produce ids estables (stableFindingId) para el mismo advisory entre ejecuciones; el orquestador los deduplica.'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
    - criterion: '**AC-07:** Una herramienta ausente o con salida inválida se señala honestamente (fallo/skip) para que el orquestador registre cobertura parcial — nunca un resultado limpio vacío; una salida con exit≠0 que sí trae hallazgos válidos (p. ej. `audit` con vulnerabilidades) NO se trata como fallo.'
      status: passed
      evidence: 'Test (AC-07): exit≠0 con JSON válido (vulnerabilidades) → run ''completed'' (no es fallo); salida ilegible / herramienta ausente → el analizador lanza y runAudit lo marca ''failed''/partial con coverage.complete=false; tsc exit≠0 sin diagnósticos → partial.'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
    - criterion: '**AC-08:** Los analizadores enchufan en el orquestador (`runAudit`, WI-092) y producen un `AuditRun` con sus hallazgos y tools; verificado con runners de prueba.'
      status: passed
      evidence: 'Test (AC-08): ambos analizadores enchufan en runAudit (WI-092) y producen un AuditRun con hallazgos (dependency + types) y sus tools; verificado con runners de prueba.'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
    - criterion: '**AC-09:** La lógica de mapeo (salida de herramienta → hallazgos) es pura y determinista y se exporta desde el barrel de Core (`packages/cli/src/core.ts`); el único punto impuro es el runner inyectado.'
      status: passed
      evidence: 'La lógica de mapeo (mapAuditAdvisories, mapTscDiagnostics, mapSeverity) es pura y determinista; el único punto impuro es el CommandRunner inyectado. Exportada desde el barrel Core (packages/cli/src/core.ts); un test la importa desde ../src/core.js.'
      reference: 'packages/cli/src/core.ts'
      method: manual
    - criterion: '**AC-10:** Hay pruebas unitarias con salidas de prueba que cubren: mapeo de advisories, mapeo de diagnósticos, mapeo de severidad/confianza, evidencia/provenance presentes, estabilidad/dedup de ids, herramienta ausente → cobertura parcial (vía `runAudit`), y exit≠0 con hallazgos → `ok`.'
      status: passed
      evidence: 'packages/cli/tests/audit-analyzers.test.ts cubre mapeo de advisories y diagnósticos, severidad/confianza, evidencia/provenance, estabilidad/dedup de ids, herramienta ausente→partial vía runAudit y exit≠0 con hallazgos→ok (11 tests en verde).'
      reference: 'packages/cli/tests/audit-analyzers.test.ts'
      method: manual
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

Entregado en `main` (sin release; se publicará junto a `kaddo audit run`, AUD-C8). Módulo `cli` (Core); sin
cambios en otras superficies ni escritura en `knowledge/`.

### Runner inyectable = IO testeable
El primer candidato con IO real se mantuvo determinista separando la **ejecución** (un `CommandRunner`
inyectable, con `execaRunner` por defecto) del **mapeo** (`mapAuditAdvisories`, `mapTscDiagnostics`,
`mapSeverity`, funciones puras). Los tests pasan un stub con salidas de fixture: ni un proceso real. Es el
patrón que hace honesto y repetible un analizador que, en producción, invoca herramientas externas.

### Honestidad de confianza y evidencia
Un hecho reportado por una herramienta (un advisory de `audit`, un diagnóstico de `tsc`) es `confirmed`; una
severidad desconocida cae a `info`, nunca se sube. Ningún hallazgo se emite sin `evidence` y `provenance`.
La identidad del hallazgo (`stableFindingId`) permite deduplicar el mismo advisory/diagnóstico entre
ejecuciones, base del seguimiento posterior (AUD-C tracking).

### La trampa del exit code
`pnpm audit` sale con código ≠0 cuando **encuentra** vulnerabilidades: eso es un éxito con hallazgos, no un
fallo. Se parsea la salida siempre; solo una salida **ilegible** (herramienta ausente/rota) o un `tsc` con
exit≠0 y **cero** diagnósticos se tratan como fallo → cobertura parcial vía el orquestador. Confundir exit≠0
con fallo habría descartado hallazgos reales o marcado limpio un árbol vulnerable.

### Decisiones del MVP
Código con `tsc` (diagnósticos del compilador, sin depender de la config de reglas del proyecto) y
dependencias con `pnpm audit` primero; añadir ESLint/semgrep u otros gestores no cambia la interfaz
`Analyzer`.

### Límite
Analizadores concretos con runner inyectado. El cableado real end-to-end (ejecutar las herramientas de
verdad) llega con `kaddo audit run` (AUD-C8). La correlación (AUD-C6), el reporte (AUD-C7) y la relación con
Work Items (AUD-C10) son candidatos posteriores. El siguiente paso natural es AUD-C6 (correlación) o AUD-C7
(reporte) sobre estos hallazgos, o AUD-C3 (alcance por módulo) en paralelo.

