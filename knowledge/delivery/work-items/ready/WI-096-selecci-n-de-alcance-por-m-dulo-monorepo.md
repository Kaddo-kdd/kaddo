---
type: feature
id: WI-096
title: Selección de alcance por módulo (monorepo)
knowledge_level: K2
status: ready
phase: now
priority: high
initiative: INI-001
domains:
  - Tech
code: []
created_at: '2026-11-27'
source: initiative
source_id: AUD-C3
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-3
dependencies:
  - AUD-C2
scope_confidence:
  level: high
  reasons:
    - >-
      Resolver acotado: convierte la selección del usuario (proyecto / módulos /
      rutas) en el AuditScope del contrato (WI-090) que consume el orquestador
      (WI-092); su forma ya está fijada por el contrato.
    - >-
      Reutiliza el inventario de módulos del Discover (WI-091) para validar; la
      única decisión de diseño es el emparejamiento de ids (nombre vs id corto)
      y el manejo honesto de un módulo desconocido.
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

# Selección de alcance por módulo (monorepo)

> Materialized from Initiative INI-001, candidate AUD-C3.

## 1. Problema y valor

**Actor:** quien lanza una auditoría (más adelante `kaddo audit run --module <id>`
/ `--paths <globs>`, AUD-C8).

**Comportamiento actual:** el contrato define `AuditScope` (`project` | `module` |
`paths`, WI-090) y el orquestador lo consume (WI-092), pero no hay forma de
**resolver** la selección de un usuario en un `AuditScope` válido. En un monorepo
no se puede acotar la auditoría a un módulo o a unas rutas.

**Comportamiento objetivo:** una función pura de Core que, dada la selección del
usuario (proyecto completo / módulos / rutas) y el inventario de módulos del
Discover (WI-091), devuelve un `AuditScope` **validado**: por defecto `project`;
con módulos, los resuelve contra el inventario (emparejando por nombre o por id
corto) y devuelve `{ kind: 'module', modules }`; con rutas, `{ kind: 'paths',
paths }` normalizadas. Un módulo desconocido es un **error honesto** que lista los
módulos válidos (nunca audita el proyecto entero en su lugar); módulos y rutas son
**mutuamente excluyentes** (una selección ambigua es un error).

**Valor (EP-001 AC-3):** un monorepo permite seleccionar el alcance por módulo o
por rutas, de forma determinista y validada, para alimentar al orquestador.

**Completitud observable:** `resolveAuditScope({ modules: ['cli'] }, inventario)`
sobre este repo devuelve `{ kind: 'module', modules: ['@kaddo/cli'] }`; un id
desconocido lanza un error con la lista de módulos válidos; sin selección devuelve
`{ kind: 'project' }`.

## 2. Alcance

- `resolveAuditScope(selection, modules)`: función **pura** que devuelve un
  `AuditScope` del contrato (WI-090).
- **Por defecto / proyecto:** sin selección (o selección explícita de proyecto) →
  `{ kind: 'project' }`.
- **Por módulo:** resuelve cada id contra el inventario del Discover (WI-091),
  emparejando por `name` (p. ej. `@kaddo/cli`) o por id corto (basename / segmento
  tras `/`, p. ej. `cli`); devuelve `{ kind: 'module', modules }` con los nombres
  canónicos, en orden estable.
- **Por rutas:** `{ kind: 'paths', paths }` con rutas normalizadas (POSIX,
  deduplicadas y ordenadas).
- **Honestidad:** un módulo desconocido lanza un error que lista los módulos
  válidos; nunca degrada silenciosamente a proyecto completo.
- **Exclusión mutua:** proveer módulos y rutas a la vez es un error (alcance
  ambiguo).
- Determinista; de solo lectura; exportado desde el barrel de Core; el
  `AuditScope` resultante enchufa en el orquestador (`runAudit`, WI-092) y en el
  `context` de los analizadores.
- Pruebas unitarias con un inventario de módulos de prueba.

## 3. Fuera de alcance

- El comando `kaddo audit run` y su parseo de flags de CLI (AUD-C8): aquí se
  resuelve una selección ya parseada, no se define la CLI.
- **Filtrar** hallazgos por módulo/severidad/categoría en el reporte o la consulta
  (eso es parte de AUD-C9 `kaddo audit report`); esta etapa acota **qué se
  audita**, no cómo se consulta después.
- Ejecutar analizadores o construir el run (AUD-C4/C5): el `AuditScope` solo se
  **entrega** al orquestador.
- Descubrir módulos: el inventario viene del Discover (WI-091); aquí solo se
  valida contra él.
- Globs avanzados / exclusiones (`!pattern`): el MVP acepta rutas y módulos; la
  sintaxis de exclusión se puede añadir después sin cambiar el contrato.

## 4. Acceptance Criteria

- [ ] **AC-01:** `resolveAuditScope(selection, modules)` es una función pura que devuelve un `AuditScope` del contrato (`project` | `module` | `paths`).
- [ ] **AC-02:** Sin selección (o con selección explícita de proyecto) devuelve `{ kind: 'project' }`.
- [ ] **AC-03:** Una selección por módulo resuelve cada id contra el inventario del Discover (WI-091), emparejando por nombre (`@kaddo/cli`) o por id corto (`cli`), y devuelve `{ kind: 'module', modules }` con los nombres canónicos en orden estable.
- [ ] **AC-04:** Un id de módulo desconocido lanza un error que lista los módulos válidos; nunca degrada silenciosamente a auditar el proyecto completo.
- [ ] **AC-05:** Una selección por rutas devuelve `{ kind: 'paths', paths }` con rutas normalizadas (POSIX, deduplicadas y ordenadas).
- [ ] **AC-06:** Módulos y rutas son mutuamente excluyentes: proveer ambos es un error (alcance ambiguo).
- [ ] **AC-07:** La resolución es determinista: la misma selección produce el mismo `AuditScope` (orden estable de módulos y rutas).
- [ ] **AC-08:** La función es de solo lectura y pura, se exporta desde el barrel de Core (`packages/cli/src/core.ts`), y el `AuditScope` resultante es compatible con el orquestador (`runAudit`, WI-092).
- [ ] **AC-09:** Hay pruebas unitarias con un inventario de módulos de prueba que cubren: proyecto por defecto, match por nombre y por id corto, módulo desconocido → error, normalización de rutas, exclusión mutua y determinismo.

## 5. Validación

- `npx vitest run packages/cli/tests/audit-scope.test.ts` en verde (nuevos tests).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.

## 6. Definición de Done

- `resolveAuditScope` en Core (`cli`), reutilizando el inventario de módulos del
  Discover (WI-091) y produciendo el `AuditScope` del contrato (WI-090), exportado
  desde el barrel.
- Las 9 ACs verificadas con pruebas unitarias.
- Build y gate raíz en verde; sin cambios en otras superficies ni escritura en
  `knowledge/`.

## 7. Preguntas abiertas

- ¿El nombre canónico almacenado en `scope.modules` es el `name` del paquete
  (`@kaddo/cli`) o el id corto (`cli`)? Propuesta: el `name` del inventario del
  Discover, que es el identificador estable; el id corto es solo para el match.
- ¿Validar que las rutas existan? Propuesta: no en el MVP (son globs; su
  cobertura real la reporta el run), solo normalizar; validar existencia se puede
  añadir después.

## 8. Dependencias

- **AUD-C2 / WI-091** (completado): `discoverProject` aporta el inventario de
  módulos (`name` + `path`) contra el que se valida la selección.
- **AUD-C1 / WI-090** (completado): el tipo `AuditScope` que se devuelve.
- Habilita **AUD-C8** (`kaddo audit run`), que parsea los flags y llama a este
  resolver.

## 9. Learning

_What did we learn? Update after completion._
