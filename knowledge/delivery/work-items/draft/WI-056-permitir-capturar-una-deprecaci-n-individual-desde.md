---
type: feature
id: WI-056
title: >-
  Permitir capturar una deprecación individual desde Admin y orientar la
  creación múltiple al flujo LLM/MCP
status: draft
work_type: feature
created_at: '2026-10-10'
source:
  type: external
  imported_at: '2026-10-10'
  source_format: markdown-frontmatter
  source_hash: 3f35d30506304e4ec5d2dedad9ee7b8a332f9a13e18eb3bacd061e3b23dd93d9
  inferred: false
generated_by: kaddo-admin
knowledge_level: K2
domains: [Tech, Delivery]
affected_modules: [admin, admin-server, cli]
scope_confidence:
  level: high
  reasons:
    - Reutiliza createPlan (WI-049) y la superficie Admin Deprecations (WI-053) ya completadas; solo añade captura individual.
    - Alcance acotado por UX (un plan por flujo; sin bulk) y ACs explícitos.
relates_to: [WI-053, WI-049, WI-046]
summary: >-
  Controlled Deprecation ya está completo (Plan → Targets → Usage Evidence →
  Dependency Analysis → Removal Waves → Soft Deprecation → Work Items → Dev/Test
  → Production Runbook → Observation → Completion). Core, CLI y MCP
  crean/modifican planes (MCP con `proposal → preview → con…
original_snapshot:
  title: >-
    Permitir capturar una deprecación individual desde Admin y orientar la
    creación múltiple al flujo LLM/MCP
  description: >-
    Controlled Deprecation ya está completo (Plan → Targets → Usage Evidence →
    Dependency Analysis → Removal Waves → Soft Deprecation → Work Items →
    Dev/Test → Production Runbook → Observation → Completion). Core, CLI y MCP
    crean/modifican planes (MCP con `proposal → preview → con…
  type: feature
  status: draft
---

# Permitir capturar una deprecación individual desde Admin y orientar la creación múltiple al flujo LLM/MCP

## Intent

Controlled Deprecation ya está completo (Plan → Targets → Usage Evidence → Dependency Analysis →
Removal Waves → Soft Deprecation → Work Items → Dev/Test → Production Runbook → Observation →
Completion). Core, CLI y MCP crean/modifican planes (MCP con `proposal → preview → confirm`), y Admin ya
visualiza planes, targets, pipeline, waves y estados por ambiente. Lo que falta: Admin **no** ofrece
capturar una **nueva intención de deprecación**. Este WI permite crear desde Admin **una deprecación
individual en estado inicial** (Minimum Sufficient Knowledge) para refinarla luego vía agente MCP.

Separación de responsabilidades: Admin captura una intención puntual → LLM/MCP descubre/agrupa/refina
una o varias deprecaciones → Core valida y persiste → Admin permite revisar y seguir el lifecycle.

## Product principle — Admin captura una intención; el agente razona sobre muchas

- Admin optimiza "sé una cosa que quiero retirar" (crea **una** a la vez).
- LLM/MCP optimiza "tengo varias cosas legacy que quizá retirar → analizar → agrupar → proponer planes".
- Restricción de UX, no del dominio: Core soporta muchos planes; Admin crea de a uno; LLM/MCP orquesta
  múltiples propuestas. **No** implementar creación masiva en Admin.

## Current behavior

Admin ya expone Deprecations (plan list, plan detail con pipeline/removal waves/environment matrix/
board/targets) y Admin Server la lectura `GET /api/v1/admin/deprecations` y
`GET /api/v1/admin/deprecations/:planId`. La creación existe en Core/CLI/MCP pero no en Admin. El
contrato de creación ya soporta `title / purpose / status / id`; reutilizarlo — no introducir una
segunda forma de serializar planes.

## Target experience

En Admin → Deprecations: botón `[ + New Deprecation ]`. Formulario mínimo: **Title** + **What do you
want to retire?** (purpose) → `[ Create draft ]`. Resultado: `DEP-NNN created`, Status Draft, Targets 0,
y guidance "Refine this deprecation with an MCP-connected agent." La captura inicial **no** pide target
ids, dependency graph, removal waves, blast radius, reversibility, runtime evidence, soft-deprecation
mechanism, observation window ni production runbook — eso es refinamiento.

## Scope

1. **Single Deprecation Creation from Admin** — mutación Admin `POST /api/v1/admin/deprecations` con
   input mínimo `{ title, purpose }`. Core asigna `DEP-NNN` con la lógica existente; el artifact vive en
   `knowledge/legacy/deprecations/`. Admin Server **no** genera Markdown directamente.
2. **Draft as Captured Intent** — el plan nace `status: draft`, puede tener cero targets. Representa
   Captured Intent, no Approved Deprecation. Crear el plan NO autoriza soft deprecation, code removal,
   database mutation ni production execution.
3. **Minimum Sufficient Knowledge** — el formulario requiere solo Title + Purpose/intent (descripción
   opcional si el contrato lo soporta sin duplicar). No convertirlo en el formulario completo del Target
   model; el usuario no necesita conocer DEP-TGT ids, locators, module/resource ids, depends_on_removal,
   usage evidence ni assessment schema.
4. **No Bulk Creation in Admin** — nada de bulk create, multi-row editor, CSV import, selección masiva.
   Un plan por flujo de creación.
5. **Multiple Deprecations → LLM/MCP** — cuando hay varias cosas potencialmente obsoletas, la
   experiencia recomendada es LLM/MCP (analizar relaciones → agrupar por outcome coherente → proponer
   DEP A/B/C → revisión humana → persistir vía MCP). No asumir "1 ítem mencionado = 1 plan".
6. **Plan vs Target grouping** — docs y agent guidance: mismo outcome de retiro → un plan con varios
   targets; outcomes independientes → planes separados. La agrupación no depende solo del repo.
7. **Admin guidance after creation** — tras crear el draft, Admin muestra que requiere refinamiento
   (Targets 0, Analysis Not performed, Dependencies Unknown, Removal waves Not calculated) + mensaje
   "intent captured; refine with an MCP-connected agent before any removal work". No marcar warnings
   estructurales solo porque un draft no tenga targets.
8. **Refinement through LLM/MCP** — "Refina DEP-NNN": el agente lee el plan y usa Legacy Knowledge +
   Codebase + Modules + System Graph + Project Resources + usage evidence → candidate targets →
   dependency/usage analysis → removal waves → soft-deprecation proposal. Materialización vía las
   mutations MCP existentes (`proposal → preview → human confirmation → Core`).
9. **Explicit safety message** — la UI de creación comunica: "Creating a Deprecation Plan records an
   intent to investigate retirement. It does not authorize removal." (localizado). Evita leer "Create
   Deprecation" como "Approve deletion".
10. **Admin remains the primary review surface** — tras el refinamiento, Admin sigue siendo la
    superficie para seguir targets/pipeline/waves/environment/soft deprecation/observation/Work Items/
    production readiness/completion. La creación no convierte Admin en agente ni duplica discovery.
11. **LLM natural-language entry** — guidance del agente reconoce "vamos a deprecar X", "queremos
    retirar esta funcionalidad", "esta pantalla ya no debería existir", "apagar este job viejo", etc.
    como intención de iniciar/proponer Controlled Deprecation, interpretada como "investigate safe
    retirement", nunca "delete immediately".
12. **Multiple-intent agent behavior** — ante varias posibles deprecaciones, el agente primero decide
    si son targets del mismo outcome o planes separados, y muestra la propuesta de agrupación para
    revisión humana antes de materializar.

## Out of scope

Bulk-create UI en Admin; CSV import; editor tipo spreadsheet; LLM embebido dentro de Admin; discovery
técnico ejecutado por el navegador; crear Targets automáticamente desde el formulario; aprobar una
deprecación al crearla; cambiar lifecycle de Targets / soft deprecation / removal-wave intelligence /
Production Runbooks; crear un nuevo Core model; ejecutar código o infraestructura desde Admin.

## Acceptance criteria

- [ ] AC-01 — Admin Create: la vista Deprecations permite iniciar la creación de un único plan.
- [ ] AC-02 — Minimum Input: el formulario requiere solo title y purpose/intent.
- [ ] AC-03 — Core-owned Mutation: Admin Server usa el contrato Core existente; no genera Markdown.
- [ ] AC-04 — Draft Plan: una deprecación creada desde Admin existe válidamente con status draft y 0 targets.
- [ ] AC-05 — No Approval Semantics: crear el plan no cambia targets/código/Resources/ambientes ni autoriza removal.
- [ ] AC-06 — Refinement Guidance: tras crear, Admin muestra que requiere análisis/refinamiento vía LLM/MCP.
- [ ] AC-07 — No Bulk Admin: no se introduce creación masiva, CSV import ni editor tabular.
- [ ] AC-08 — Multiple Intent Guidance: agent/docs explican plan único con varios targets vs varios planes.
- [ ] AC-09 — Natural Language: guidance reconoce solicitudes naturales de retiro como intención (no autorización de borrado).
- [ ] AC-10 — Existing MCP Safety: creación/refinamiento múltiple vía MCP conserva proposal → preview → confirm.
- [ ] AC-11 — Existing Views: planes creados desde Admin aparecen en listado y detalle existentes.
- [ ] AC-12 — Backward Compatibility: planes existentes y superficies CLI/MCP siguen funcionando sin migración.
- [ ] AC-13 — Documentation: docs EN/ES explican cuándo usar Admin vs LLM/MCP para iniciar deprecaciones.

## Validation

- **Single Admin capture**: Admin → Deprecations → New Deprecation con Title + Purpose → `DEP-NNN`
  creado, status draft, targets 0, artifact en `knowledge/legacy/deprecations/`.
- **Admin detail**: muestra Draft / Targets 0 / Dependencies Not analyzed / Removal waves Not
  calculated + guidance de refinamiento; no se presenta como "ready for removal".
- **Agent refinement** (MCP): "Refina DEP-NNN sin materializar sin confirmación" → read DEP → candidate
  targets → preview → human confirmation → persist.
- **Multiple intent**: "retirar créditos legacy, reportes antiguos y el sincronizador viejo" → el LLM
  analiza agrupación y propone uno o varios planes; no crea tres artifacts a ciegas.
- **Same outcome, multiple components**: "retirar la pantalla vieja de créditos, su endpoint y sus
  tablas" → propone un plan con varios targets cuando el contexto lo soporta.

## Definition of Done

Admin registra una deprecación individual sin detalles técnicos; la creación produce un plan draft
válido (puede empezar sin targets); Core sigue siendo source of truth de mutations/serialization; Admin
no incluye bulk creation; múltiples deprecaciones se orientan a LLM/MCP; el agente analiza grouping antes
de crear múltiples planes; crear un plan nunca se interpreta como aprobar eliminación; el refinamiento
posterior descubre Targets/dependencies/evidence/waves; los planes creados en Admin aparecen en las
vistas existentes; CLI/MCP compatibles; tests cubren create/validation/empty draft/list-detail/
regresión; docs EN/ES explican el reparto Admin vs LLM/MCP.

## Implementation handoff guidance

Partir de lo existente, sin crear subsistemas paralelos:

- Core: `packages/cli/src/core/deprecation-write.ts` → `createPlan(...)` (mutación Markdown canónica +
  asignación DEP id).
- MCP: `kaddo_create_deprecation` (proposal → preview → confirm).
- Admin Server: `GET /api/v1/admin/deprecations` y `/:planId` (lectura ya existente).
- Admin UI: `packages/admin/src/routes/Deprecations.tsx` (list + tracking visual ya existente).

Agregar solo: Admin UI "New Deprecation" (intent mínimo) → endpoint Admin Server de creación →
`Core.createPlan` → DEP draft → detalle Admin existente. No crear: Admin Markdown writer, modelo de
deprecación específico de Admin, endpoint batch, ni dependency intelligence en Admin.

Principio rector: Admin hace fácil **capturar** una intención de deprecación; el agente hace fácil
**comprender y organizar** la complejidad de una o muchas deprecaciones.

## Relación

Depende de WI-053 (Admin Deprecations, slice G de la épica WI-046) ya completado: extiende esa
superficie con captura individual. Reutiliza el contrato de WI-049 (CLI+MCP, createPlan) sin duplicarlo.
