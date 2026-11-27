---
type: feature
id: WI-098
title: kaddo audit report
knowledge_level: K2
status: in-progress
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
code: []
created_at: '2026-11-27'
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

_What did we learn? Update after completion._
