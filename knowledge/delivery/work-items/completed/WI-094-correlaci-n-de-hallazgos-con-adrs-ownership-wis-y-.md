---
type: feature
id: WI-094
title: 'Correlación de hallazgos con ADRs, ownership, WIs y riesgos'
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
        - packages/cli/src/core/audit-correlation.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/audit-correlation.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-correlation.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Existe un tipo `CorrelatedFinding = AuditFinding & { correlation }` y una función pura `correlateFindings(input)` que, dados los hallazgos y el conocimiento del proyecto (artefactos + ownership), devuelve los hallazgos enriquecidos sin mutar las entradas ni modificar el contrato `AuditFinding`.'
      status: passed
      evidence: 'CorrelatedFinding = AuditFinding & { correlation }; correlateFindings(input) es pura, no muta las entradas (test lo verifica sobre finding.references) y no modifica el contrato AuditFinding (WI-090).'
      reference: 'packages/cli/src/core/audit-correlation.ts'
      method: manual
    - criterion: '**AC-02:** El matching es por módulo/ruta: un hallazgo en un archivo se vincula a los Work Items cuyos `affected_modules` o `codeGlobs` cubren ese archivo, poblando `references.workItems`.'
      status: passed
      evidence: 'Test (AC-02): un hallazgo en packages/cli/src/a.ts se vincula a un WI por codeGlobs (strength ''exact'') y a otro por affected_modules (''cli'', strength ''module''), poblando references.workItems.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-03:** Un hallazgo se correlaciona con los ADRs y capacidades que gobiernan su módulo/dominio, poblando `references.adrs` y `references.capabilities`.'
      status: passed
      evidence: 'Test (AC-03): un artefacto decision con codeGlobs que cubre el archivo puebla references.adrs y sus capabilities pueblan references.capabilities.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-04:** El ownership del hallazgo se resuelve por dominio/módulo (`resolveAffectedOwners`) y se expone en `correlation.owners` como contexto advisory.'
      status: passed
      evidence: 'Test (AC-04): el ownership se resuelve por dominio del artefacto emparejado vía resolveAffectedOwners y se expone en correlation.owners y en las notas.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-05:** Los riesgos documentados del área del hallazgo se exponen en `correlation.risks`.'
      status: passed
      evidence: 'Test (AC-05): un artefacto de tipo ''risk'' que cubre el área del hallazgo se expone en correlation.risks.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-06:** Cada correlación declara su `matchStrength` (`exact` | `module` | `domain` | `none`); un match de dominio es una sugerencia, nunca un vínculo confirmado, y nunca se afirma causalidad.'
      status: passed
      evidence: 'matchStrength se calcula como el match más fuerte (exact>module>domain>none); un match de dominio es sugerencia, no vínculo confirmado; las notas son advisory, nunca afirman causalidad. Tests de exact/module/none.'
      reference: 'packages/cli/src/core/audit-correlation.ts'
      method: manual
    - criterion: '**AC-07:** La correlación es read-only y no mutante: no escribe conocimiento, no crea relaciones y no cambia `severity`/`confidence`/`status` del hallazgo.'
      status: passed
      evidence: 'Test (AC-07): correlateFindings no muta la entrada (finding.references original intacto) y conserva severity/confidence/status del hallazgo.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-08:** Un hallazgo sin coincidencias obtiene referencias vacías y una nota explícita de "sin correlación" (`matchStrength: ''none''`), nunca un vínculo inventado.'
      status: passed
      evidence: 'Test (AC-08): un hallazgo sin coincidencias obtiene references vacías y matchStrength ''none'' con la nota ''No correlation found in project knowledge.'', nunca un vínculo inventado.'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
    - criterion: '**AC-09:** La función es pura, determinista (orden estable de referencias) y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin.'
      status: passed
      evidence: 'La función es pura y determinista (referencias uniq+sorted; test de orden estable y de idempotencia) y se exporta desde el barrel Core (packages/cli/src/core.ts); un test la importa desde ../src/core.js.'
      reference: 'packages/cli/src/core.ts'
      method: manual
    - criterion: '**AC-10:** Hay pruebas unitarias con artefactos y ownership de prueba que cubren: match por módulo/ruta → WIs; match de ADRs/capacidades; ownership resuelto; riesgos; `matchStrength`; sin coincidencias → vacío + nota; no-mutación y determinismo.'
      status: passed
      evidence: 'packages/cli/tests/audit-correlation.test.ts cubre match por glob/módulo→WIs, ADRs/capacidades, ownership, riesgos, matchStrength, sin coincidencias→vacío+nota, no-mutación, determinismo y merge de referencias (10 tests en verde).'
      reference: 'packages/cli/tests/audit-correlation.test.ts'
      method: manual
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

Entregado en `main` (sin release; se publicará junto a `kaddo audit run`, AUD-C8). Módulo `cli` (Core); sin
cambios en otras superficies ni escritura en `knowledge/`.

### Correlación sin tocar el contrato
Para enriquecer hallazgos con contexto (owners, riesgos, fuerza del match) sin modificar el contrato congelado
`AuditFinding` (WI-090), la salida es un `CorrelatedFinding = AuditFinding & { correlation }`. Las referencias
que sí existen en el contrato (`references.adrs/capabilities/workItems`) se **pueblan**; lo demás vive en
`correlation`. Un contrato estable se extiende por composición, no por mutación.

### Matching determinista, no NLP
La correlación es por metadatos: `codeGlobs` (minimatch) del archivo → match `exact`; `affected_modules` del
módulo resuelto → match `module`; dominios de los artefactos emparejados → ownership. Se reutilizan
`discoverKnowledge` (WI-091) y `resolveAffectedOwners`. Es reproducible y auditable; la similitud de texto
libre queda fuera del núcleo.

### Honestidad del vínculo
Cada correlación declara su `matchStrength` (exact|module|domain|none). Un match de dominio es una sugerencia,
nunca un vínculo confirmado, y las notas nunca afirman causalidad. Un hallazgo sin coincidencias obtiene
referencias vacías y una nota explícita de "sin correlación" — nunca un vínculo inventado, que sería la peor
deshonestidad en una auditoría.

### Read-only de verdad
No escribe conocimiento, no crea relaciones y no cambia severity/confidence/status; construye objetos nuevos
sin mutar las entradas. La acción de **relacionar** un hallazgo con un Work Item y deduplicar entre ejecuciones
con aprobación humana es AUD-C10; aquí solo se produce el contexto que esa acción (y el reporte AUD-C7)
consumen.

### Límite
Solo la correlación determinista. El reporte (AUD-C7), el plan/asociación a Planning (AUD-C8) y la
relación/dedup con Work Items (AUD-C10) son candidatos posteriores. El siguiente paso natural es AUD-C7
(reporte) sobre los hallazgos correlacionados, o AUD-C3 (alcance por módulo) en paralelo.

