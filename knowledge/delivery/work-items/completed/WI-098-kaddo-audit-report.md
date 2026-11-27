---
type: feature
id: WI-098
title: kaddo audit report
knowledge_level: K2
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
released_in: v3.147.0
implementation_evidence:
  repositories:
    cli:
      role: primary
      status: completed
      changed_paths:
        - packages/cli/src/core/audit-query.ts
        - packages/cli/src/commands/audit.ts
        - packages/cli/src/index.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/audit-report-command.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-report-command.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
        - command: node packages/cli/dist/index.js audit report --list
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/commands/audit.md
        - apps/docs/src/content/docs/es/commands/audit.md
      validations:
        - command: pnpm --filter docs build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** `kaddo audit report --list` lista las auditorías persistidas en `.kaddo/audits` (id, fecha, estado, nº de hallazgos) en orden determinista, de solo lectura.'
      status: passed
      evidence: 'Test (AC-01): performAuditReport({list:true}) devuelve los resúmenes de .kaddo/audits en orden determinista (AUD-001, AUD-002) con total/confirmed/inferences; solo lectura. Smoke real: --list muestra AUD-001 con 164 hallazgos.'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-02:** `kaddo audit report [id]` muestra una auditoría (por defecto la última) reutilizando `readAuditRun` (WI-090): resumen y hallazgos.'
      status: passed
      evidence: 'Test (AC-02): sin id muestra la última auditoría; con id muestra esa, reutilizando readAuditRun (WI-090).'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-03:** `queryAuditFindings(findings, filters)` es una función pura de Core que filtra por `severity`, `category` y `confidence` (OR dentro de una dimensión, AND entre dimensiones), preservando el orden.'
      status: passed
      evidence: 'Test (AC-03): queryAuditFindings filtra OR dentro de una dimensión y AND entre dimensiones (severity {critical} AND category {deps} → solo ''a''; severity {critical,low} → a,b,c), preservando el orden.'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-04:** `--module <id...>` filtra los hallazgos por módulo, resolviendo el módulo a su ruta (vía Discover, WI-091) y conservando los hallazgos cuyo `file` cuelga de esa ruta.'
      status: passed
      evidence: 'Test (AC-04): --module ''cli'' resuelve el módulo a su ruta vía Discover y conserva solo los hallazgos cuyo file cuelga de packages/cli.'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-05:** `--severity`, `--category` y `--confidence` filtran los hallazgos mostrados (acepta listas separadas por coma).'
      status: passed
      evidence: 'Test (AC-05): --severity critical filtra a los hallazgos critical; acepta listas separadas por coma (parseList).'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-06:** `--json` emite los hallazgos filtrados (o el run completo) como JSON determinista.'
      status: passed
      evidence: 'runAuditReportCommand emite con --json los hallazgos filtrados (o la lista de runs) como JSON. Smoke real: audit report AUD-001 --category dependency --json.'
      reference: 'packages/cli/src/commands/audit.ts'
      method: manual
    - criterion: '**AC-07:** El comando es de solo lectura: no re-ejecuta la auditoría ni escribe artefactos; un id inexistente da un error claro y no crea nada.'
      status: passed
      evidence: 'Test (AC-07): un id inexistente lanza ''Audit "AUD-999" not found'' y el directorio .kaddo/audits queda intacto; sin auditorías lanza ''No audits found''. Read-only.'
      reference: 'packages/cli/tests/audit-report-command.test.ts'
      method: manual
    - criterion: '**AC-08:** `listAuditRuns` y `queryAuditFindings` son puros y se exportan desde el barrel de Core (`packages/cli/src/core.ts`); el comando está registrado en la CLI.'
      status: passed
      evidence: 'listAuditRuns y queryAuditFindings son puros y se exportan desde el barrel Core (packages/cli/src/core.ts); el comando ''audit report'' está registrado en packages/cli/src/index.ts.'
      reference: 'packages/cli/src/core.ts'
      method: manual
    - criterion: '**AC-09:** Códigos de salida: `0` al listar/mostrar; distinto de `0` solo ante un error de uso (id inexistente o filtro inválido).'
      status: passed
      evidence: 'runAuditReportCommand fija process.exitCode=0 al listar/mostrar y 2 ante error de uso (id inexistente/filtro inválido). Smoke real: exit 2 en --severity nope y en AUD-999; exit 0 en --list.'
      reference: 'packages/cli/src/commands/audit.ts'
      method: manual
    - criterion: '**AC-10:** El comando queda documentado en `apps/docs` (en + es) y hay pruebas unitarias con runs de prueba (listado, filtros por dimensión y combinados, id inexistente, `--json`).'
      status: passed
      evidence: 'Comando documentado en apps/docs/src/content/docs/commands/audit.md (sección kaddo audit report) y su versión es/; 9 tests unitarios con runs de prueba cubren listado, filtros por dimensión y combinados, id inexistente, filtro inválido y determinismo.'
      reference: 'apps/docs/src/content/docs/commands/audit.md'
      method: manual
source: initiative
source_id: AUD-C9
source_initiative: INI-001
affected_modules:
  - cli
  - docs
source_signals:
  - EP-001 AC-10
dependencies:
  - AUD-C8
scope_confidence:
  level: high
  reasons:
    - >-
      Comando de solo lectura sobre artefactos ya persistidos (.kaddo/audits);
      no re-ejecuta la auditoría ni escribe nada. El filtrado es una función
      pura de Core testeable con runs de prueba.
    - >-
      Reutiliza readAuditRun/AUDITS_DIR (WI-090) y renderAuditReport (WI-095);
      la única lógica nueva es listar runs y filtrar hallazgos por severidad,
      categoría, confianza y módulo.
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

# kaddo audit report

> Materialized from Initiative INI-001, candidate AUD-C9.

## 1. Problema y valor

**Actor:** quien consulta auditorías previas desde la CLI.

**Comportamiento actual:** `kaddo audit run` (WI-097) ejecuta auditorías y persiste
los runs en `.kaddo/audits/AUD-xxx.{json,md}`, pero no hay forma de **consultarlos**
después: ni listar las auditorías, ni ver una, ni filtrar sus hallazgos.

**Comportamiento objetivo:** un comando `kaddo audit report` de **solo lectura**
que: lista las auditorías persistidas (`--list`), muestra una auditoría (por id, o
la última por defecto) reutilizando `readAuditRun` (WI-090), y **filtra** sus
hallazgos por severidad, categoría, confianza y módulo (EP-001: hallazgos
filtrables por módulo, severidad y categoría). Con `--json` emite los hallazgos
filtrados (o el run) de forma determinista. No re-ejecuta la auditoría ni escribe
artefactos.

**Valor (EP-001 AC-10):** herramientas para consultar reportes y hallazgos; cierra
el par `run` + `report` de la superficie de comandos de auditoría.

**Completitud observable:** `kaddo audit report --list` lista los runs de
`.kaddo/audits`; `kaddo audit report AUD-001 --severity critical,high` muestra solo
esos hallazgos; `--json` los emite como JSON; un id inexistente da un error claro y
no escribe nada.

## 2. Alcance

- Core puro:
  - `listAuditRuns(dir)`: lee `.kaddo/audits/*.json` (vía `readAuditRun`) y
    devuelve resúmenes `{ id, createdAt, status, total, confirmed, inferences }`,
    en orden determinista.
  - `queryAuditFindings(findings, filters)`: filtra por `severity[]`,
    `category[]`, `confidence[]` y `pathPrefix[]` (OR dentro de una dimensión, AND
    entre dimensiones), preservando el orden; pura y determinista.
- Comando `kaddo audit report [id]` (subcomando de `audit`):
  - `--list` lista las auditorías; sin id muestra la última; con id muestra esa.
  - `--severity`, `--category`, `--confidence` filtran los hallazgos mostrados.
  - `--module <id...>` filtra por módulo: resuelve el módulo a su ruta (vía
    Discover, WI-091) y filtra los hallazgos cuyo `file` cuelga de esa ruta.
  - `--json` emite los hallazgos filtrados (o el run) como JSON determinista.
- **Read-only:** no re-ejecuta la auditoría ni escribe artefactos; un id/ruta
  inexistente da un error claro sin crear nada.
- La orquestación del comando se expone como una función testeable (dir + opciones)
  sin depender de la CLI.
- Documentación en `apps/docs` (en + es).

## 3. Fuera de alcance

- Ejecutar o re-ejecutar auditorías (eso es `kaddo audit run`, WI-097).
- Relacionar hallazgos con Work Items + dedup entre ejecuciones con aprobación
  (AUD-C10) y el seguimiento nuevos/persistentes/resueltos entre dos auditorías
  (AUD-C11): aquí solo se consulta una auditoría.
- Herramienta MCP y vista Admin de reportes de auditoría: fuera del MVP de este
  comando.
- Publicación canónica (`--publish`): es de `kaddo audit run`; `report` no escribe.

## 4. Acceptance Criteria

- [ ] **AC-01:** `kaddo audit report --list` lista las auditorías persistidas en `.kaddo/audits` (id, fecha, estado, nº de hallazgos) en orden determinista, de solo lectura.
- [ ] **AC-02:** `kaddo audit report [id]` muestra una auditoría (por defecto la última) reutilizando `readAuditRun` (WI-090): resumen y hallazgos.
- [ ] **AC-03:** `queryAuditFindings(findings, filters)` es una función pura de Core que filtra por `severity`, `category` y `confidence` (OR dentro de una dimensión, AND entre dimensiones), preservando el orden.
- [ ] **AC-04:** `--module <id...>` filtra los hallazgos por módulo, resolviendo el módulo a su ruta (vía Discover, WI-091) y conservando los hallazgos cuyo `file` cuelga de esa ruta.
- [ ] **AC-05:** `--severity`, `--category` y `--confidence` filtran los hallazgos mostrados (acepta listas separadas por coma).
- [ ] **AC-06:** `--json` emite los hallazgos filtrados (o el run completo) como JSON determinista.
- [ ] **AC-07:** El comando es de solo lectura: no re-ejecuta la auditoría ni escribe artefactos; un id inexistente da un error claro y no crea nada.
- [ ] **AC-08:** `listAuditRuns` y `queryAuditFindings` son puros y se exportan desde el barrel de Core (`packages/cli/src/core.ts`); el comando está registrado en la CLI.
- [ ] **AC-09:** Códigos de salida: `0` al listar/mostrar; distinto de `0` solo ante un error de uso (id inexistente o filtro inválido).
- [ ] **AC-10:** El comando queda documentado en `apps/docs` (en + es) y hay pruebas unitarias con runs de prueba (listado, filtros por dimensión y combinados, id inexistente, `--json`).

## 5. Validación

- `npx vitest run packages/cli/tests/audit-report-command.test.ts` en verde.
- `kaddo audit run` seguido de `kaddo audit report --list` y
  `kaddo audit report --severity critical` en este repo producen salida coherente.
- `pnpm --filter @kaddo/cli build`, `pnpm test` (gate raíz) y build de docs sin
  regresiones.

## 6. Definición de Done

- `listAuditRuns` + `queryAuditFindings` en Core (`cli`) + comando
  `kaddo audit report` registrado, de solo lectura, reutilizando
  `readAuditRun`/`renderAuditReport`.
- Las 10 ACs verificadas con pruebas unitarias.
- Documentación en `apps/docs` (en + es).
- Build y gate raíz en verde.
- Release (Gate B): se decide en su momento si va en su propio release o se
  agrupa con AUD-C10/C11 (misma superficie de usuario).

## 7. Preguntas abiertas

- ¿`--json` emite los hallazgos filtrados o el `AuditRun` completo con los
  hallazgos filtrados? Propuesta: por defecto los hallazgos filtrados; `--json`
  junto a sin filtros emite el run completo (ya serializable, WI-090).
- ¿El `report` por defecto (sin id, sin `--list`) muestra el reporte Markdown o un
  resumen + hallazgos? Propuesta: resumen + hallazgos filtrables; el Markdown
  completo ya está en `.kaddo/audits/AUD-xxx.md`.

## 8. Dependencias

- **AUD-C8 / WI-097** (completado): escribe los runs en `.kaddo/audits` que este
  comando lee.
- **AUD-C1 / WI-090** (completado): `readAuditRun`, `AUDITS_DIR`, los tipos y el
  filtrado sobre `AuditFinding`.
- **AUD-C7 / WI-095** (completado): `renderAuditReport` para mostrar una auditoría.
- **AUD-C2 / WI-091** (completado): Discover para resolver `--module` a su ruta.

## 9. Learning

Entregado en **v3.147.0** (módulos `cli` + `docs`). Completa el par `run` + `report` de la superficie de
comandos de auditoría de cara al usuario.

### Lectura pura sobre datos ya persistidos
`report` no re-ejecuta nada: lee los runs que `kaddo audit run` dejó en `.kaddo/audits`. La lógica nueva son
dos funciones puras de Core —`listAuditRuns` y `queryAuditFindings`— testeables con runs de fixture, más una
capa de comando delgada (`performAuditReport`) separada de la CLI para probar el flujo sin la terminal.

### Semántica de filtros explícita
El filtrado es OR dentro de una dimensión y AND entre dimensiones (p. ej. `--severity critical,high` AND
`--category dependency`), con orden preservado. `--module` se resuelve a la ruta del módulo vía Discover
(WI-091) y filtra por prefijo del `file`, reutilizando el mismo inventario que el resolver de alcance.

### Read-only y honesto
No escribe nada; un id inexistente o un filtro inválido es un error claro con código de salida ≠0, mientras que
listar/mostrar salen con 0. Un test confirma que un error de id no toca `.kaddo/audits`. La validación real
sobre este repo mostró 164 hallazgos y filtró 5 CVEs `critical` reales (Vitest UI RCE, Astro AVIF RCE,
proxy-addr IP spoofing…), demostrando el valor de consulta.

### Release
Se publicó en su propio release (v3.147.0) en vez de agruparse con C10/C11: el comando ya aporta valor de cara
al usuario por sí mismo. Mismo ritual de Gate B: CI verde antes del tag, tag sobre HEAD validado, publish con
provenance.

### Siguiente
AUD-C10 (relacionar hallazgos con Work Items existentes + dedup entre ejecuciones, con aprobación) y AUD-C11
(seguimiento nuevos/persistentes/resueltos entre dos auditorías) cierran el MVP de la iniciativa.

