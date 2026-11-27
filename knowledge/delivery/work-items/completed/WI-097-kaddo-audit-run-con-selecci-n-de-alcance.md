---
type: feature
id: WI-097
title: kaddo audit run (con selección de alcance)
knowledge_level: K3
status: completed
completed_at: 2026-11-27
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
code: []
created_at: '2026-11-27'
implementation_status: completed
validation_status: passed
released_in: v3.146.0
implementation_evidence:
  repositories:
    cli:
      role: primary
      status: completed
      changed_paths:
        - packages/cli/src/commands/audit.ts
        - packages/cli/src/index.ts
        - packages/cli/tests/audit-run-command.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-run-command.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
        - command: node packages/cli/dist/index.js audit run --module cli
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/commands/audit.md
        - apps/docs/src/content/docs/es/commands/audit.md
        - apps/docs/astro.config.mjs
      validations:
        - command: pnpm --filter docs build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** `kaddo audit run` ejecuta el flujo completo: Discover (WI-091) → `resolveAuditScope` (WI-096) → `runAudit` con los analizadores reales (WI-092/093, `execaRunner`) → `correlateFindings` inline (WI-094) → `renderAuditReport` (WI-095) → `writeAuditArtifacts` en `.kaddo/audits`.'
      status: passed
      evidence: 'Test (AC-01): performAuditRun ejecuta Discover→resolveAuditScope→runAudit (analizadores reales)→correlateFindings→renderAuditReport→writeAuditArtifacts; escribe .kaddo/audits/AUD-001.{json,md}. Smoke real en el repo: 164 hallazgos de pnpm audit.'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-02:** `--module <id...>` y `--paths <glob...>` seleccionan el alcance vía `resolveAuditScope`; sin ellas audita el proyecto completo; un módulo desconocido falla con el error del resolver (lista los módulos válidos) y no ejecuta la auditoría.'
      status: passed
      evidence: 'Test (AC-02): --module ''cli'' → scope { kind:''module'', modules:[''@kaddo/cli''] }; un módulo desconocido lanza ''Unknown module'' y no ejecuta la auditoría.'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-03:** La correlación es inline: el reporte y los artefactos incluyen hallazgos correlacionados (referencias a ADRs/capacidades/WIs, owners, riesgos y `matchStrength`).'
      status: passed
      evidence: 'Test (AC-03): con un WI cuyos codeGlobs cubren el archivo del hallazgo, el reporte incluye la correlación (WIs: WI-010) producida por correlateFindings inline.'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-04:** Por defecto escribe solo artefactos derivados en `.kaddo/audits/AUD-xxx.{json,md}` e imprime un resumen humano (estado del run, nº de hallazgos por confianza, cobertura y ruta del reporte); no escribe en `knowledge/`.'
      status: passed
      evidence: 'Test (AC-04): por defecto escribe solo .kaddo/audits/AUD-001.{json,md} y no crea knowledge/tech/audits; el resumen humano se imprime (printSummary).'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-05:** `--json` emite el `AuditRun` JSON determinista a stdout (sin el resumen humano).'
      status: passed
      evidence: '--json emite serializeAuditRun(result.run) a stdout en vez del resumen; verificado en el smoke real (JSON determinista del AuditRun).'
      reference: 'packages/cli/src/commands/audit.ts'
      method: manual
    - criterion: '**AC-06:** `--publish` escribe el reporte canónico en `knowledge/tech/audits/AUD-xxx.md` solo tras confirmación humana; `--yes` omite el prompt; si no se confirma, no se escribe ningún artefacto canónico.'
      status: passed
      evidence: 'Test (AC-06): --publish escribe knowledge/tech/audits/AUD-001.md solo si confirm() devuelve true; declinado o sin TTY sin --yes no publica; --yes omite el prompt.'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-07:** Una herramienta ausente o que falla produce un run `partial`/`failed` reflejado en el resumen y el reporte; nunca un resultado limpio, y el comando no reclasifica hallazgos.'
      status: passed
      evidence: 'Test (AC-07): una herramienta ausente (tsc exit 127) hace el run ''partial'' con coverage.complete=false y tsc en notEvaluated; nunca un resultado limpio. Confirmado en el smoke real (tsc no en PATH → partial).'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-08:** Códigos de salida: `0` cuando el run se ejecuta (`completed`/`partial`); distinto de `0` solo cuando el run es `failed` (todas las herramientas fallaron) o ante un error de uso (alcance ambiguo / módulo desconocido). La mera existencia de hallazgos no hace fallar el comando.'
      status: passed
      evidence: 'runAuditRunCommand fija process.exitCode = run.status===''failed'' ? 1 : 0, y 2 ante error de uso (resolveAuditScope lanza). La existencia de hallazgos no cambia el código de salida.'
      reference: 'packages/cli/src/commands/audit.ts'
      method: manual
    - criterion: '**AC-09:** La orquestación del comando se expone como una función con dependencias inyectadas (runner de comandos, cwd, confirmación) testeable sin spawnear procesos ni escribir en el repo real; el comando está registrado en la CLI.'
      status: passed
      evidence: 'Test (AC-09): performAuditRun es testeable con dependencias inyectadas (run, confirm, createdAt, idFor, hasTty) sin spawnear procesos ni escribir el repo real; el comando ''audit run'' está registrado en packages/cli/src/index.ts.'
      reference: 'packages/cli/tests/audit-run-command.test.ts'
      method: manual
    - criterion: '**AC-10:** El comando queda documentado en `apps/docs` (en + es) y se publica vía Gate B (bump de las 5 versiones, tag, publish de `@kaddo/cli` + `@kaddo/mcp`).'
      status: passed
      evidence: 'Comando documentado en apps/docs/src/content/docs/commands/audit.md y su versión es/, con entrada en el sidebar (astro.config.mjs). Publicado vía Gate B: cli/admin/admin-server/mcp/integrations a 3.146.0, tag v3.146.0 y publish de @kaddo/cli + @kaddo/mcp (logs ''✅ Published package @kaddo/cli@3.146.0'' y ''@kaddo/mcp@3.146.0'').'
      reference: 'apps/docs/src/content/docs/commands/audit.md'
      method: manual
source: initiative
source_id: AUD-C8
source_initiative: INI-001
affected_modules:
  - cli
  - docs
source_signals:
  - EP-001 AC-3
  - EP-001 AC-10
dependencies:
  - AUD-C7
  - AUD-C3
scope_confidence:
  level: medium
  reasons:
    - >-
      Primer comando de cara al usuario: cablea el pipeline completo (Discover →
      alcance → orquestador → analizadores reales → correlación → reporte →
      artefactos) con ejecución real de herramientas.
    - >-
      La orquestación del comando se separa en una función con dependencias
      inyectadas (runner, cwd, confirmación) para probar el flujo sin spawnear
      procesos ni escribir en el repo real.
    - >-
      Es la WI con release (Gate B): publica el motor de auditoría acumulado
      (@kaddo/cli + @kaddo/mcp) de las 7 slices de Core cerradas sin release.
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
  documentation: affected
  operations-release: affected
ready_at: '2026-11-27'
---

# kaddo audit run (con selección de alcance)

> Materialized from Initiative INI-001, candidate AUD-C8.

## 1. Problema y valor

**Actor:** quien audita un proyecto desde la CLI de Kaddo.

**Comportamiento actual:** todas las piezas del motor de auditoría existen y están
cerradas en `main` (contrato, discover, alcance, orquestador, analizadores,
correlación, reporte), pero **no hay comando** que las cablee; nada es ejecutable
de cara al usuario y el motor acumulado no está publicado.

**Comportamiento objetivo:** un comando `kaddo audit run [opciones]` que ejecuta el
flujo completo de principio a fin con **herramientas reales**: Discover (WI-091) →
`resolveAuditScope` (WI-096) → `runAudit` con los analizadores de dependencias y
código (WI-092/093, `execaRunner`) → `correlateFindings` **inline** (WI-094) →
`renderAuditReport` (WI-095) → `writeAuditArtifacts` (`.kaddo/audits`). Imprime un
resumen humano y deja el reporte derivado; con `--publish` escribe además el
reporte **canónico** en `knowledge/tech/audits/`, pidiendo confirmación antes de
esa escritura.

**Valor (EP-001 AC-3, AC-10):** un monorepo puede ejecutar una auditoría con
alcance seleccionable y obtener hallazgos verificables; la auditoría no altera
código ni documentación sin autorización (la escritura canónica es opt-in y
confirmada). Es la WI que **publica** (Gate B) el motor acumulado.

**Completitud observable:** `kaddo audit run --module cli` sobre este repo ejecuta
los analizadores, escribe `.kaddo/audits/AUD-xxx.{json,md}`, imprime un resumen con
estado y nº de hallazgos por confianza, y con `--publish` (confirmado) deja el
reporte en `knowledge/tech/audits/AUD-xxx.md`.

## 2. Alcance

- Comando `kaddo audit run` registrado en la CLI (subcomando de `audit`).
- **Opciones:** `--module <id...>` y `--paths <glob...>` → `resolveAuditScope`
  (sin ellas, proyecto completo); `--json` (emite el `AuditRun` JSON a stdout);
  `--publish` (escribe el reporte canónico) y `--yes` (omite el prompt de
  confirmación de `--publish`).
- **Pipeline:** Discover → alcance → `runAudit` con los analizadores de WI-093
  usando `execaRunner` → `correlateFindings` **inline** (usando `discoverKnowledge`
  + ownership) → `renderAuditReport` con los hallazgos correlacionados →
  `writeAuditArtifacts` (derivados en `.kaddo/audits`).
- **Salida por defecto:** resumen humano (estado del run, nº de hallazgos por
  confianza —confirmados/inferencias—, cobertura, ruta del reporte derivado).
- **`--json`:** emite el `AuditRun` JSON determinista a stdout (sin el resumen).
- **`--publish` (opción A):** escribe el reporte canónico en
  `knowledge/tech/audits/AUD-xxx.md` **tras confirmación humana**; `--yes` omite el
  prompt; sin confirmación no se escribe nada canónico.
- **Honestidad:** herramienta ausente/que falla → run `partial`/`failed`, reflejado
  en resumen y reporte; nunca un resultado limpio; sin reclasificar hallazgos.
- **Testeable:** la orquestación se separa en una función con dependencias
  inyectadas (runner de comandos, cwd, función de confirmación) para probar sin
  spawnear procesos ni escribir en el repo real.
- Documentación del comando en `apps/docs` (en + es).
- **Release (Gate B):** bump de las 5 versiones, tag y publish de `@kaddo/cli` y
  `@kaddo/mcp`.

## 3. Fuera de alcance

- `kaddo audit report` (consultar/filtrar reportes y hallazgos): AUD-C9.
- Relacionar hallazgos con Work Items existentes + dedup entre ejecuciones con
  aprobación, y la propuesta/asociación a Planning: AUD-C10.
- Seguimiento nuevos/persistentes/resueltos entre dos auditorías: AUD-C11.
- Herramienta MCP y vista Admin de auditoría: fuera del MVP de este comando (se
  pueden añadir después reutilizando el mismo Core).
- Nuevos analizadores (semgrep, eslint-security) o lenguajes: el comando corre los
  analizadores de WI-093; añadir más no cambia el comando.

## 4. Acceptance Criteria

- [ ] **AC-01:** `kaddo audit run` ejecuta el flujo completo: Discover (WI-091) → `resolveAuditScope` (WI-096) → `runAudit` con los analizadores reales (WI-092/093, `execaRunner`) → `correlateFindings` inline (WI-094) → `renderAuditReport` (WI-095) → `writeAuditArtifacts` en `.kaddo/audits`.
- [ ] **AC-02:** `--module <id...>` y `--paths <glob...>` seleccionan el alcance vía `resolveAuditScope`; sin ellas audita el proyecto completo; un módulo desconocido falla con el error del resolver (lista los módulos válidos) y no ejecuta la auditoría.
- [ ] **AC-03:** La correlación es inline: el reporte y los artefactos incluyen hallazgos correlacionados (referencias a ADRs/capacidades/WIs, owners, riesgos y `matchStrength`).
- [ ] **AC-04:** Por defecto escribe solo artefactos derivados en `.kaddo/audits/AUD-xxx.{json,md}` e imprime un resumen humano (estado del run, nº de hallazgos por confianza, cobertura y ruta del reporte); no escribe en `knowledge/`.
- [ ] **AC-05:** `--json` emite el `AuditRun` JSON determinista a stdout (sin el resumen humano).
- [ ] **AC-06:** `--publish` escribe el reporte canónico en `knowledge/tech/audits/AUD-xxx.md` solo tras confirmación humana; `--yes` omite el prompt; si no se confirma, no se escribe ningún artefacto canónico.
- [ ] **AC-07:** Una herramienta ausente o que falla produce un run `partial`/`failed` reflejado en el resumen y el reporte; nunca un resultado limpio, y el comando no reclasifica hallazgos.
- [ ] **AC-08:** Códigos de salida: `0` cuando el run se ejecuta (`completed`/`partial`); distinto de `0` solo cuando el run es `failed` (todas las herramientas fallaron) o ante un error de uso (alcance ambiguo / módulo desconocido). La mera existencia de hallazgos no hace fallar el comando.
- [ ] **AC-09:** La orquestación del comando se expone como una función con dependencias inyectadas (runner de comandos, cwd, confirmación) testeable sin spawnear procesos ni escribir en el repo real; el comando está registrado en la CLI.
- [ ] **AC-10:** El comando queda documentado en `apps/docs` (en + es) y se publica vía Gate B (bump de las 5 versiones, tag, publish de `@kaddo/cli` + `@kaddo/mcp`).

## 5. Validación

- `npx vitest run packages/cli/tests/audit-run-command.test.ts` en verde (flujo con
  runner/confirmación inyectados y directorio temporal).
- `kaddo audit run --module cli` en este repo produce `.kaddo/audits/AUD-xxx.{json,md}`
  y un resumen; `--json` emite el run; `--publish` (confirmado) escribe el canónico.
- `pnpm --filter @kaddo/cli build` y `pnpm test` (gate raíz) sin regresiones.
- CI verde (build-test + mcp-smoke) antes del tag de release.

## 6. Definición de Done

- Comando `kaddo audit run` + función de orquestación inyectable en `cli`,
  componiendo las funciones de Core ya exportadas; registrado en la CLI.
- Las 10 ACs verificadas (unitarias con inyección + comprobación real en el repo).
- Documentación en `apps/docs` (en + es).
- Build y gate raíz en verde; artefactos canónicos solo con `--publish` confirmado.
- Gate B: 5 versiones bumpeadas, tag y publish; CI verde antes del tag.

## 7. Preguntas abiertas

- ¿El `--json` incluye también la correlación (CorrelatedFinding) o solo el
  `AuditRun`? Propuesta: el `AuditRun` (contrato estable); la correlación va en el
  reporte Markdown. Se puede añadir un `--json=correlated` después.
- ¿`--publish` sin TTY (CI)? Propuesta: requiere `--yes` explícito; sin TTY y sin
  `--yes` no publica y lo informa (nunca publica sin confirmación).

## 8. Dependencias

- **AUD-C7 / WI-095** (completado): `renderAuditReport` + `writeAuditArtifacts`.
- **AUD-C3 / WI-096** (completado): `resolveAuditScope`.
- **AUD-C1/C2/C4/C5/C6** (completados): contrato, discover, orquestador,
  analizadores y correlación que el comando cablea.

## 9. Learning

Entregado en **v3.146.0** (módulos `cli` + `docs`): el **primer release** del motor de auditoría (EP-001 /
INI-001). Esta WI cablea las 7 slices de Core que estaban cerradas sin release y las publica
(`@kaddo/cli` + `@kaddo/mcp`).

### Un comando que solo compone
`kaddo audit run` no tiene lógica de negocio: compone las funciones puras de Core ya exportadas (discover,
resolveAuditScope, runAudit, correlateFindings, renderAuditReport, writeAuditArtifacts). La capa de comando
solo inyecta IO real y presenta. Por eso `performAuditRun` se separa del wrapper de CLI: recibe dependencias
(runner, cwd, confirm, reloj, id) y se prueba el flujo entero sin spawnear procesos ni tocar el repo real.

### Honestidad validada en producción
El smoke real sobre este repo lo demostró: `pnpm audit` devolvió **164 advisories** reales (hallazgos
`confirmed`), y como `tsc` no está directamente en el PATH, el run quedó **`partial`** con `tsc` en
`notEvaluated` — nunca un resultado limpio. La cadena de honestidad (analizador→orquestador→reporte) funciona
contra un árbol real, no solo en tests. (Nota: invocar `tsc` vía el binario local del PM es una mejora futura
del analizador, WI-093; no cambia el contrato.)

### Seguridad por defecto
Por defecto el comando solo escribe **derivados** en `.kaddo/audits`; el reporte canónico en
`knowledge/tech/audits` es opt-in (`--publish`) y **confirmado** (sin TTY y sin `--yes` no publica). La
auditoría no altera el conocimiento sin autorización explícita (EP-001 AC-10). Los códigos de salida son
CI-safe: los hallazgos nunca hacen fallar el comando; solo un run `failed` (todas las herramientas fallan) o
un error de uso.

### Release acumulado
Siete slices de Core cerradas sin release y publicadas juntas en v3.146.0 cuando por fin hubo valor de cara al
usuario: releases atados a valor visible, no a cada slice interna. CI verde antes del tag; tag sobre el HEAD
validado; publish por `pnpm publish` con provenance.

### Siguiente
AUD-C9 (`kaddo audit report`: consultar/filtrar reportes), AUD-C10 (relacionar hallazgos con Work Items +
dedup con aprobación) y AUD-C11 (seguimiento nuevos/persistentes/resueltos entre auditorías). El motor y el
primer comando ya están en manos de los usuarios.

