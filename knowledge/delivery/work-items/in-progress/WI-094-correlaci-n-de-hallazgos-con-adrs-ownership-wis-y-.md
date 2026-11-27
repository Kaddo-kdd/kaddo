---
type: feature
id: WI-094
title: 'Correlación de hallazgos con ADRs, ownership, WIs y riesgos'
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
source_id: AUD-C6
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-5
dependencies:
  - AUD-C5
scope_confidence:
  level: medium
  reasons:
    - >-
      Es la primera etapa que usa el inventario de conocimiento del Discover
      (WI-091) de forma semántica (por módulo/ruta/dominio), no solo para
      localizar; su salida alimenta el reporte (AUD-C7) y el plan (AUD-C8).
    - >-
      Debe ser read-only y advisory: enriquece referencias y contexto, nunca
      crea relaciones ni afirma causalidad; un match débil es una sugerencia con
      su fuerza declarada, no un vínculo confirmado.
    - >-
      No modifica el contrato congelado de AuditFinding (WI-090): devuelve un
      CorrelatedFinding (finding + correlación) en lugar de cambiar el tipo
      base.
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

# Correlación de hallazgos con ADRs, ownership, WIs y riesgos

> Materialized from Initiative INI-001, candidate AUD-C6.

## 1. Problema y valor

**Actor:** el flujo de auditoría de Kaddo (más adelante el reporte AUD-C7 y el
plan AUD-C8).

**Comportamiento actual:** los analizadores (WI-093) producen hallazgos con
evidencia, pero **aislados**: no se contrastan con el conocimiento ya documentado
del proyecto (ADRs, estándares, ownership, Work Items, riesgos). El inventario del
Discover (WI-091) solo localiza esos artefactos; nadie los usa para dar contexto
a un hallazgo.

**Comportamiento objetivo:** una función pura de Core que, dado un conjunto de
hallazgos y el conocimiento del proyecto (artefactos con módulo/globs/decisiones/
capacidades/dominios y el mapa de ownership), **correlaciona** cada hallazgo con
los ADRs, capacidades y Work Items relacionados y con su ownership y riesgos
documentados, por módulo/ruta/dominio. Es **read-only y advisory**: enriquece
referencias y añade una nota de correlación con la **fuerza del match**; nunca
crea relaciones, nunca afirma causalidad y nunca cambia severidad/confianza/estado
del hallazgo. Un hallazgo sin coincidencias obtiene referencias vacías y una nota
explícita de "sin correlación", nunca un vínculo inventado.

**Valor (EP-001 AC-5, "Correlate"):** cada hallazgo llega al reporte y al plan con
referencias a ADRs, capacidades y Work Items existentes y con su ownership, para
una revisión informada y para evitar trabajo duplicado (la relación/dedup concreta
con Work Items y su aprobación son AUD-C10).

**Completitud observable:** un hallazgo en un archivo de un módulo se correlaciona
con los Work Items cuyos `affected_modules`/`codeGlobs` cubren ese archivo y con
los ADRs/capacidades que gobiernan ese módulo, con su owner resuelto; un hallazgo
sin coincidencias queda con referencias vacías y nota de "sin correlación".

## 2. Alcance

- Un tipo `CorrelatedFinding = AuditFinding & { correlation }` donde `correlation`
  aporta: `owners` (del ownership por dominio/módulo), `risks` (artefactos de
  riesgo relacionados), `matchStrength` (`exact` | `module` | `domain` | `none`)
  y `notes`. **No** se modifica el contrato congelado `AuditFinding` (WI-090).
- Una función pura `correlateFindings(input): CorrelatedFinding[]` que recibe
  `findings`, los artefactos de conocimiento (de `discoverKnowledge`, WI-091) y el
  mapa de ownership, y devuelve los hallazgos enriquecidos **sin mutar las
  entradas**.
- **Matching por módulo/ruta/dominio:** un hallazgo en un archivo se vincula a los
  Work Items cuyos `affected_modules` o `codeGlobs` cubren ese archivo, y a los
  ADRs/capacidades que gobiernan ese módulo; el ownership se resuelve por dominio
  (`resolveAffectedOwners`).
- **Referencias:** se pueblan `references.adrs`, `references.capabilities` y
  `references.workItems` del hallazgo (campos ya existentes en el contrato), en
  orden estable.
- **Honestidad:** cada correlación declara su `matchStrength`; un match débil
  (dominio) es una sugerencia, no un vínculo confirmado; nunca se afirma
  causalidad. Sin coincidencias → referencias vacías + nota de "sin correlación".
- **Read-only:** no escribe conocimiento, no crea relaciones, no toca
  severidad/confianza/estado del hallazgo.
- Determinista; exportada desde el barrel de Core; componible con el contrato
  (hallazgos entran, hallazgos correlacionados salen).
- Pruebas unitarias con artefactos y ownership de prueba.

## 3. Fuera de alcance

- La **acción de planning** de relacionar hallazgos con Work Items existentes y
  deduplicar entre ejecuciones con aprobación humana: AUD-C10.
- El reporte estructurado (AUD-C7) y el plan/asociación a Planning (AUD-C8) —
  esta etapa solo produce la correlación que ellos consumen.
- Correlación semántica por NLP/embeddings: el MVP correlaciona por
  módulo/ruta/dominio y metadatos de los artefactos (determinista), no por
  similitud de texto libre.
- Revisión arquitectónica asistida por agentes (parte de "Analyze" con agentes),
  fuera del núcleo determinista.
- Escritura de relaciones o mutación de artefactos de `knowledge/`.

## 4. Acceptance Criteria

- [ ] **AC-01:** Existe un tipo `CorrelatedFinding = AuditFinding & { correlation }` y una función pura `correlateFindings(input)` que, dados los hallazgos y el conocimiento del proyecto (artefactos + ownership), devuelve los hallazgos enriquecidos sin mutar las entradas ni modificar el contrato `AuditFinding`.
- [ ] **AC-02:** El matching es por módulo/ruta: un hallazgo en un archivo se vincula a los Work Items cuyos `affected_modules` o `codeGlobs` cubren ese archivo, poblando `references.workItems`.
- [ ] **AC-03:** Un hallazgo se correlaciona con los ADRs y capacidades que gobiernan su módulo/dominio, poblando `references.adrs` y `references.capabilities`.
- [ ] **AC-04:** El ownership del hallazgo se resuelve por dominio/módulo (`resolveAffectedOwners`) y se expone en `correlation.owners` como contexto advisory.
- [ ] **AC-05:** Los riesgos documentados del área del hallazgo se exponen en `correlation.risks`.
- [ ] **AC-06:** Cada correlación declara su `matchStrength` (`exact` | `module` | `domain` | `none`); un match de dominio es una sugerencia, nunca un vínculo confirmado, y nunca se afirma causalidad.
- [ ] **AC-07:** La correlación es read-only y no mutante: no escribe conocimiento, no crea relaciones y no cambia `severity`/`confidence`/`status` del hallazgo.
- [ ] **AC-08:** Un hallazgo sin coincidencias obtiene referencias vacías y una nota explícita de "sin correlación" (`matchStrength: 'none'`), nunca un vínculo inventado.
- [ ] **AC-09:** La función es pura, determinista (orden estable de referencias) y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin.
- [ ] **AC-10:** Hay pruebas unitarias con artefactos y ownership de prueba que cubren: match por módulo/ruta → WIs; match de ADRs/capacidades; ownership resuelto; riesgos; `matchStrength`; sin coincidencias → vacío + nota; no-mutación y determinismo.

## 5. Validación

- `npx vitest run packages/cli/tests/audit-correlation.test.ts` en verde (nuevos
  tests, con artefactos y ownership de prueba).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.

## 6. Definición de Done

- Tipo `CorrelatedFinding` + `correlateFindings` en Core (`cli`), reutilizando
  `discoverKnowledge` (WI-091) y `resolveAffectedOwners`, exportados desde el
  barrel, sin modificar el contrato `AuditFinding` (WI-090).
- Las 10 ACs verificadas con pruebas unitarias (artefactos/ownership de prueba).
- Build y gate raíz en verde; sin cambios en otras superficies ni escritura en
  `knowledge/`.

## 7. Preguntas abiertas

- ¿Cómo se resuelve el **módulo** de un hallazgo a partir de su archivo? Propuesta:
  por prefijo de ruta contra los módulos del Discover (WI-091) y por `codeGlobs`
  de los artefactos; si no hay módulo, se intenta por dominio.
- ¿La correlación vive junto al hallazgo (`CorrelatedFinding`) o como estructura
  aparte referenciada por id? Propuesta: `CorrelatedFinding` (finding + correlación)
  para que el reporte lo consuma directo, sin romper el contrato base.

## 8. Dependencias

- **AUD-C5 / WI-093** (completado): produce los hallazgos a correlacionar.
- **AUD-C2 / WI-091** (completado): `discoverKnowledge` aporta los artefactos
  (módulo/globs/decisiones/capacidades/dominios) sobre los que se correlaciona.
- **AUD-C1 / WI-090** (completado): el tipo `AuditFinding` y sus `references`.

## 9. Learning

_What did we learn? Update after completion._
