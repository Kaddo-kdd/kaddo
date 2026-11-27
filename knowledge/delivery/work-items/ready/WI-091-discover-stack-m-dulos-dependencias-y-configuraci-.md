---
type: feature
id: WI-091
title: 'Discover: stack, módulos, dependencias y configuración'
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
source_id: AUD-C2
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-1
dependencies:
  - AUD-C1
scope_confidence:
  level: medium
  reasons:
    - >-
      Es la base factual del flujo (Discover → Analyze → Correlate); la forma
      del inventario condiciona qué pueden consumir el orquestador (AUD-C4) y la
      correlación (AUD-C6).
    - >-
      Debe ser honesto: lo que no se puede leer se registra como limitación, no
      se omite en silencio (misma regla que el contrato de AuditRun, WI-090).
    - >-
      El inventario de conocimiento existente (ADRs, capabilities, Work Items)
      se limita a localizar y referenciar; la correlación semántica es trabajo
      posterior (AUD-C6).
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
ready_at: '2026-11-27'
---

# Discover: stack, módulos, dependencias y configuración

> Materialized from Initiative INI-001, candidate AUD-C2.

## 1. Problema y valor

**Actor:** el flujo de auditoría de Kaddo (y, más adelante, CLI/MCP/Admin a
través del contrato Core).

**Comportamiento actual:** el contrato de auditoría (`AuditRun`/`AuditFinding`,
WI-090) existe, pero no hay forma de construir la **base factual** del proyecto
sobre la que operan el análisis y la correlación. El `AuditScope` se puede
expresar, pero nada descubre qué módulos, dependencias y configuración existen
realmente.

**Comportamiento objetivo:** una función pura de Core descubre, de forma
determinista y de solo lectura, el inventario del proyecto —stack/toolchain,
módulos del monorepo con sus rutas, dependencias por módulo, configuración
presente y conocimiento existente— y lo devuelve como un resultado serializable.
Todo lo que no se pueda leer queda registrado como limitación.

**Valor (EP-001 AC-1):** base factual para análisis y correlación. Es la primera
etapa del flujo funcional (Discover) y alimenta al orquestador (AUD-C4) y a la
correlación (AUD-C6).

**Completitud observable:** `discoverProject(dir)` devuelve, para este monorepo,
los 5 paquetes del workspace con sus rutas, sus dependencias, la configuración
detectada y un inventario del árbol `knowledge/`, con round-trip de serialización
verificado por pruebas.

## 2. Alcance

- Un tipo `ProjectDiscovery` en Core (`cli`) que captura: `stack` (lenguaje/es y
  gestor de paquetes), `modules` (id + ruta + rol), `dependencies` (por módulo y
  raíz, prod y dev), `configs` (presencia de tsconfig, lint, test, CI), `knowledge`
  (inventario de artefactos bajo `knowledge/`: tipo + id + ruta) y `limitations`.
- `discoverProject(dir): ProjectDiscovery` — detecta el layout del monorepo
  (gestor de paquetes + módulos del workspace con sus rutas) desde los manifiestos
  del proyecto (`pnpm-workspace.yaml` / `workspaces` en `package.json`), de solo
  lectura.
- Recolección de dependencias por módulo y raíz desde cada `package.json`
  (dependencies + devDependencies), sin acceso a red.
- Detección de **presencia** de configuración (tsconfig, lint, test, CI),
  reportada como presente/ausente, nunca inferida.
- Inventario del conocimiento existente bajo `knowledge/` (ADRs, capabilities,
  Work Items…) como referencias (tipo + id + ruta), para dar base factual a la
  correlación posterior.
- Honestidad: cualquier manifiesto/archivo ilegible se registra en `limitations`,
  nunca se omite en silencio.
- Serialización determinista (orden de claves estable) con round-trip, exportada
  desde el barrel de Core y reutilizable por CLI/MCP/Admin.
- Pruebas unitarias de detección de layout/módulos, dependencias por módulo,
  presencia de configuración, inventario de conocimiento, limitaciones y
  serialización.

## 3. Fuera de alcance

- Ejecución de análisis o herramientas estáticas (AUD-C4 orquestador, AUD-C5
  analizadores).
- Selección de alcance por módulo/rutas como operación de usuario (AUD-C3).
- **Correlación semántica** de hallazgos con ADRs/ownership/Work Items: aquí solo
  se localizan y referencian los artefactos (AUD-C6 hace la correlación).
- Adaptadores para otros lenguajes (p. ej. Rust): el MVP descubre el stack
  TypeScript/monorepo; la extensibilidad se aborda después.
- Comando `kaddo audit discover` de cara al usuario (se expone con AUD-C8/C9).
- Escritura o modificación de artefactos canónicos de `knowledge/`.

## 4. Acceptance Criteria

- [ ] **AC-01:** El tipo `ProjectDiscovery` captura stack (lenguaje/es y gestor de paquetes), módulos (id, ruta, rol), dependencias (por módulo y raíz, prod y dev), configuración (presencia de tsconfig/lint/test/CI), conocimiento existente (inventario de artefactos de `knowledge/`: tipo, id, ruta) y una lista de `limitations`.
- [ ] **AC-02:** `discoverProject(dir)` detecta el layout del monorepo —gestor de paquetes y módulos del workspace con sus rutas— a partir de los manifiestos del proyecto (`pnpm-workspace.yaml` o `workspaces` de `package.json`), sin red y de solo lectura.
- [ ] **AC-03:** Las dependencias se recolectan por módulo y raíz desde cada `package.json` (dependencies + devDependencies), sin acceso a red.
- [ ] **AC-04:** La presencia de configuración (tsconfig, lint, test, CI) se detecta y se reporta como presente/ausente, nunca inferida ni inventada.
- [ ] **AC-05:** El conocimiento existente bajo `knowledge/` se inventaría como referencias (tipo, id, ruta), de modo que la correlación posterior disponga de una base factual.
- [ ] **AC-06:** Cualquier manifiesto o archivo que no se pueda leer se registra en `limitations` (discovery parcial honesto), nunca se omite en silencio.
- [ ] **AC-07:** `ProjectDiscovery` serializa de forma determinista (orden de claves estable) y hace round-trip (serializar → parsear → serializar produce el mismo texto).
- [ ] **AC-08:** La función es pura (sin LLM ni red) y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin desde la misma implementación.
- [ ] **AC-09:** Hay pruebas unitarias que cubren detección de layout/módulos, dependencias por módulo, presencia de configuración, inventario de conocimiento, registro de limitaciones y round-trip de serialización.

## 5. Validación

- `npx vitest run packages/cli/tests/discovery.test.ts` en verde (nuevos tests).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.
- Comprobación factual sobre este propio repo: `discoverProject(repoRoot)`
  devuelve los 5 paquetes del workspace (`cli`, `admin`, `admin-server`, `mcp`,
  `integrations`) con sus rutas y dependencias, y un inventario no vacío de
  `knowledge/`.

## 6. Definición de Done

- Tipo `ProjectDiscovery` + `discoverProject` + serialización determinista en
  Core (`cli`), exportados desde el barrel.
- Las 9 ACs verificadas con pruebas unitarias.
- Build y gate raíz en verde; sin cambios en otras superficies ni escritura en
  `knowledge/`.

## 7. Preguntas abiertas

- ¿El resultado de discovery se persiste como artículo propio bajo `.kaddo/`
  (p. ej. `.kaddo/audits/discovery-*.json`) o se incrusta dentro del `AuditRun`?
  Propuesta: por ahora solo serializable + round-trip; la persistencia la decide
  el orquestador (AUD-C4) al construir el run.
- ¿Qué profundidad de inventario de `knowledge/` necesita Correlate? Propuesta:
  referencias ligeras (tipo + id + ruta); el parseo semántico es de AUD-C6.

## 8. Dependencias

- **AUD-C1 / WI-090** (completado): el contrato `AuditRun`/`AuditFinding` ya en
  `main`; esta etapa produce la base factual que su `scope`/orquestación consumen.

## 9. Learning

_What did we learn? Update after completion._
