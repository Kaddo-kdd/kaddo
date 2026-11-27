---
type: feature
id: WI-095
title: 'Reporte estructurado + artefactos (knowledge/tech/audits, .kaddo/audits)'
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
        - packages/cli/src/core/audit-report.ts
        - packages/cli/src/core.ts
        - packages/cli/tests/audit-report.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/audit-report.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
        - command: pnpm test
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** `renderAuditReport(run, correlated?)` es una función pura que devuelve un reporte Markdown estructurado con cabecera (id, fecha, commit, scope y estado del run).'
      status: passed
      evidence: 'Test (AC-01): renderAuditReport devuelve Markdown con cabecera ''# Audit Report — AUD-001'' y campos Date, Scope y Status; función pura (sin IO).'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-02:** El reporte distingue en secciones separadas los hallazgos confirmados (`confidence: confirmed`), las inferencias (`likely`/`inferred`) y las áreas no evaluadas (`coverage.notEvaluated`); nunca se mezclan (EP-001 AC-4).'
      status: passed
      evidence: 'Test (AC-02): secciones separadas ''## Confirmed findings'' e ''## Inferences''; un hallazgo confirmed aparece antes de la sección de inferencias y uno inferred después; nunca se mezclan.'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-03:** Cada hallazgo se renderiza con su evidencia, provenance, severidad, confianza, ubicación (`file:line` cuando existe) y recomendación (EP-001 AC-5).'
      status: passed
      evidence: 'Test (AC-03): cada hallazgo renderiza Evidence, Provenance, ubicación `file:line` y Recommendation.'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-04:** Cuando se proveen `CorrelatedFinding`, el reporte incluye sus referencias (ADRs/capacidades/WIs), owners, riesgos y `matchStrength`.'
      status: passed
      evidence: 'Test (AC-04): con CorrelatedFinding se incluyen References (WIs/ADRs/Capabilities), Correlation (matchStrength), Owners y Risks.'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-05:** Un run `partial` o `failed` se marca con claridad y las áreas no evaluadas se listan; nunca se presenta como un resultado limpio.'
      status: passed
      evidence: 'Test (AC-05): un run parcial se marca ''partial — coverage is incomplete'' y lista las áreas no evaluadas (semgrep failed timeout); nunca como resultado limpio.'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-06:** El render es determinista: el mismo `AuditRun` produce un Markdown idéntico byte a byte (orden estable de secciones y hallazgos).'
      status: passed
      evidence: 'Test (AC-06): renderAuditReport(r) === renderAuditReport(r) (Markdown idéntico byte a byte) para el mismo run.'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-07:** Los hallazgos se ordenan de forma determinista por rango de severidad y luego por id, para diffs limpios entre ejecuciones.'
      status: passed
      evidence: 'Test (AC-07): los hallazgos se ordenan por rango de severidad y luego id (crítico antes que bajo).'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-08:** `writeAuditArtifacts(dir, run, { report })` persiste artefactos **derivados** bajo `.kaddo/audits/`: el run JSON (vía `writeAuditRun`) y el reporte `.md`. La publicación canónica en `knowledge/tech/audits/` es una acción aprobada por humano (fuera de alcance aquí).'
      status: passed
      evidence: 'Test (AC-08): writeAuditArtifacts escribe .kaddo/audits/AUD-001.json (vía writeAuditRun) y AUD-001.md; no se crea ningún directorio knowledge/ (sin escritura canónica).'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
    - criterion: '**AC-09:** La lógica de render es pura y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin.'
      status: passed
      evidence: 'La lógica de render es pura y se exporta desde el barrel Core (packages/cli/src/core.ts: renderAuditReport, writeAuditArtifacts); un test las importa desde ../src/core.js.'
      reference: 'packages/cli/src/core.ts'
      method: manual
    - criterion: '**AC-10:** Hay pruebas unitarias con `AuditRun`/correlación de prueba que cubren: separación de secciones (confirmados/inferencias/no evaluadas), evidencia/provenance renderizadas, inclusión de correlación, marcado de run parcial, determinismo y escritura derivada en `.kaddo/audits/`.'
      status: passed
      evidence: 'packages/cli/tests/audit-report.test.ts cubre separación de secciones, evidencia/provenance, correlación, marcado de run parcial, determinismo, orden y escritura derivada en .kaddo/audits (9 tests en verde).'
      reference: 'packages/cli/tests/audit-report.test.ts'
      method: manual
source: initiative
source_id: AUD-C7
source_initiative: INI-001
affected_modules:
  - cli
source_signals:
  - EP-001 AC-4
  - EP-001 AC-5
dependencies:
  - AUD-C6
scope_confidence:
  level: medium
  reasons:
    - >-
      El reporte es la cara revisable de la auditoría; debe distinguir
      confirmados, inferencias y áreas no evaluadas (EP-001 AC-4) y ser
      reproducible/determinista para diffs limpios entre ejecuciones.
    - >-
      Separación canónico/derivado: el run JSON y el reporte se escriben como
      DERIVADOS bajo .kaddo/audits (auto); el reporte humano canónico bajo
      knowledge/tech/audits se publica solo con aprobación humana (UX en
      AUD-C8).
    - >-
      Es un renderizador puro: no re-analiza ni recalcula; transforma un
      AuditRun (y sus hallazgos correlacionados) en Markdown.
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

# Reporte estructurado + artefactos (knowledge/tech/audits, .kaddo/audits)

> Materialized from Initiative INI-001, candidate AUD-C7.

## 1. Problema y valor

**Actor:** quien revisa una auditoría (y, más adelante, `kaddo audit run`/`report`,
AUD-C8/C9).

**Comportamiento actual:** el flujo produce un `AuditRun` con hallazgos
correlacionados (WI-090/092/093/094), pero no hay un **reporte** legible ni
artefactos persistidos. El `AuditRun` serializa a JSON (WI-090), pero nadie lo
convierte en un documento estructurado para revisión humana.

**Comportamiento objetivo:** un renderizador puro de Core que transforma un
`AuditRun` (y, cuando se proveen, sus `CorrelatedFinding`) en un **reporte
Markdown estructurado** que distingue hallazgos **confirmados**, **inferencias** y
**áreas no evaluadas** (EP-001 AC-4), con evidencia, prioridades y recomendaciones
por hallazgo (EP-001 AC-5). El reporte es **determinista** (mismo run → mismo
Markdown byte a byte) para diffs limpios. Además, una función de persistencia
escribe los **artefactos derivados** (`.kaddo/audits/AUD-xxx.json` reutilizando
`writeAuditRun`, y `.kaddo/audits/AUD-xxx.md` el reporte). El **reporte humano
canónico** en `knowledge/tech/audits/AUD-xxx.md` se publica **solo con aprobación
humana** (la UX de aprobación es AUD-C8); aquí se produce su contenido pero no se
escribe automáticamente en el conocimiento canónico.

**Valor:** una auditoría reproducible y revisable, con artefactos derivados
automáticos y un reporte humano listo para publicar con aprobación.

**Completitud observable:** dado un `AuditRun` parcial con hallazgos confirmados e
inferidos, el reporte tiene secciones separadas para confirmados, inferencias y
áreas no evaluadas, marca el run como parcial, y `writeAuditArtifacts` deja
`.kaddo/audits/AUD-xxx.json` y `.md`; dos renders del mismo run son idénticos.

## 2. Alcance

- `renderAuditReport(run, correlated?)`: función **pura** que devuelve el reporte
  Markdown con cabecera (id, fecha, commit, scope, estado del run).
- **Separación honesta** (EP-001 AC-4): secciones distintas para hallazgos
  **confirmados** (`confidence: confirmed`), **inferencias** (`likely`/`inferred`)
  y **áreas no evaluadas** (`coverage.notEvaluated`); nunca se mezclan.
- Cada hallazgo se renderiza con evidencia, provenance, severidad, confianza,
  ubicación (`file:line`) y recomendación (EP-001 AC-5).
- Cuando se proveen `CorrelatedFinding`, se incluyen sus referencias
  (ADRs/capacidades/WIs), owners, riesgos y `matchStrength`.
- **Cobertura:** un run `partial`/`failed` se marca con claridad y se listan las
  áreas no evaluadas; nunca se presenta como limpio.
- **Determinismo:** mismo run → Markdown idéntico; orden estable de secciones y de
  hallazgos (por rango de severidad y luego id).
- `writeAuditArtifacts(dir, run, { report })`: persiste **derivados** bajo
  `.kaddo/audits/` — el run JSON (`writeAuditRun`, WI-090) y el reporte `.md`.
- Exportado desde el barrel de Core; reutilizable por CLI/MCP/Admin.
- Pruebas unitarias con `AuditRun`/correlación de prueba.

## 3. Fuera de alcance

- La **escritura canónica** automática en `knowledge/tech/audits/`: el contenido
  se produce aquí, pero publicarlo en el conocimiento es una **acción aprobada por
  humano** cuya UX vive en AUD-C8 (y respeta "knowledge/ es fuente de verdad").
- El comando `kaddo audit run`/`report` de cara al usuario (AUD-C8/C9) — aquí no
  hay CLI nueva; el renderizador y la persistencia derivada se prueban directo.
- Ejecutar analizadores o correlacionar: esta etapa **consume** un `AuditRun` ya
  construido (WI-092/093/094), no re-analiza.
- La relación/asociación a Planning y la propuesta de remediación (AUD-C8/C10).
- Formatos de salida alternativos (HTML, SARIF): el MVP produce Markdown + el JSON
  ya existente; añadir formatos no cambia el modelo.

## 4. Acceptance Criteria

- [ ] **AC-01:** `renderAuditReport(run, correlated?)` es una función pura que devuelve un reporte Markdown estructurado con cabecera (id, fecha, commit, scope y estado del run).
- [ ] **AC-02:** El reporte distingue en secciones separadas los hallazgos confirmados (`confidence: confirmed`), las inferencias (`likely`/`inferred`) y las áreas no evaluadas (`coverage.notEvaluated`); nunca se mezclan (EP-001 AC-4).
- [ ] **AC-03:** Cada hallazgo se renderiza con su evidencia, provenance, severidad, confianza, ubicación (`file:line` cuando existe) y recomendación (EP-001 AC-5).
- [ ] **AC-04:** Cuando se proveen `CorrelatedFinding`, el reporte incluye sus referencias (ADRs/capacidades/WIs), owners, riesgos y `matchStrength`.
- [ ] **AC-05:** Un run `partial` o `failed` se marca con claridad y las áreas no evaluadas se listan; nunca se presenta como un resultado limpio.
- [ ] **AC-06:** El render es determinista: el mismo `AuditRun` produce un Markdown idéntico byte a byte (orden estable de secciones y hallazgos).
- [ ] **AC-07:** Los hallazgos se ordenan de forma determinista por rango de severidad y luego por id, para diffs limpios entre ejecuciones.
- [ ] **AC-08:** `writeAuditArtifacts(dir, run, { report })` persiste artefactos **derivados** bajo `.kaddo/audits/`: el run JSON (vía `writeAuditRun`) y el reporte `.md`. La publicación canónica en `knowledge/tech/audits/` es una acción aprobada por humano (fuera de alcance aquí).
- [ ] **AC-09:** La lógica de render es pura y se exporta desde el barrel de Core (`packages/cli/src/core.ts`), reutilizable por CLI, MCP y Admin.
- [ ] **AC-10:** Hay pruebas unitarias con `AuditRun`/correlación de prueba que cubren: separación de secciones (confirmados/inferencias/no evaluadas), evidencia/provenance renderizadas, inclusión de correlación, marcado de run parcial, determinismo y escritura derivada en `.kaddo/audits/`.

## 5. Validación

- `npx vitest run packages/cli/tests/audit-report.test.ts` en verde (nuevos tests).
- `pnpm --filter @kaddo/cli build` sin errores de tipos.
- `pnpm test` (gate raíz) sin regresiones.

## 6. Definición de Done

- `renderAuditReport` + `writeAuditArtifacts` en Core (`cli`), reutilizando
  `writeAuditRun`/`serializeAuditRun` (WI-090) y consumiendo `CorrelatedFinding`
  (WI-094), exportados desde el barrel.
- Las 10 ACs verificadas con pruebas unitarias.
- Build y gate raíz en verde; sin escritura automática en `knowledge/` ni cambios
  en otras superficies.

## 7. Preguntas abiertas

- ¿El reporte canónico se nombra `knowledge/tech/audits/AUD-xxx.md` (como propone
  EP-001)? Propuesta: sí, pero su escritura es la acción aprobada de AUD-C8; aquí
  solo se genera el contenido y se persisten los derivados en `.kaddo/audits`.
- ¿Prioridades en el reporte por severidad sola o severidad×confianza? Propuesta:
  ordenar por severidad y separar por confianza (confirmados primero), de modo que
  una inferencia crítica no se presente como un hecho crítico.

## 8. Dependencias

- **AUD-C6 / WI-094** (completado): aporta los `CorrelatedFinding` con referencias
  y contexto.
- **AUD-C1 / WI-090** (completado): `AuditRun`, `serializeAuditRun`, `writeAuditRun`
  y `.kaddo/audits` para la persistencia derivada.
- **AUD-C4/C5** (completados): el `AuditRun` con hallazgos que el reporte consume.

## 9. Learning

Entregado en `main` (sin release; se publicará junto a `kaddo audit run`, AUD-C8). Módulo `cli` (Core); sin
cambios en otras superficies ni escritura automática en `knowledge/`.

### Separar es la honestidad
La regla de EP-001 (distinguir confirmados, inferencias y áreas no evaluadas) se materializa como **secciones
separadas** del reporte, no como un campo más: una inferencia crítica nunca aparece en la misma lista que un
hecho crítico. El run parcial se marca explícitamente y lista lo no evaluado — leer el reporte deja claro qué
se verificó y qué no.

### Renderizador puro y determinista
`renderAuditReport` consume un `AuditRun` ya construido (no re-analiza) y produce Markdown idéntico byte a
byte para el mismo run: orden estable de secciones y de hallazgos (severidad y luego id), y todas las fechas
salen de `run.createdAt`. Esto hace el reporte reproducible y sus diffs limpios entre ejecuciones (base del
seguimiento nuevos/persistentes/resueltos).

### Canónico vs derivado
`writeAuditArtifacts` escribe solo **derivados** bajo `.kaddo/audits/` (el run JSON reutilizando
`writeAuditRun`, y el reporte `.md`). El reporte humano canónico en `knowledge/tech/audits/` que propone
EP-001 se **genera** aquí pero se **publica** solo con aprobación humana (UX en AUD-C8), respetando
"knowledge/ es fuente de verdad". El test confirma que no se crea ningún directorio `knowledge/`.

### Límite
Solo el render y la persistencia derivada. El comando `kaddo audit run`/`report` (AUD-C8/C9), la publicación
canónica aprobada y la propuesta/asociación a Planning (AUD-C8/C10) son candidatos posteriores. El siguiente
paso natural es AUD-C8 (`kaddo audit run`): el primer comando de cara al usuario, que cablea de verdad el
flujo Discover→Analyze→Correlate→Report y donde por fin se publica el release acumulado.

