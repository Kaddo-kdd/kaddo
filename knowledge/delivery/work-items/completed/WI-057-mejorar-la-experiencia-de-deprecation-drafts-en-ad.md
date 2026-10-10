---
type: feature
id: WI-057
title: >-
  Mejorar la experiencia de Deprecation drafts en Admin con visualización
  progresiva
status: completed
completed_at: '2026-10-10'
work_type: feature
created_at: '2026-10-10'
source:
  type: external
  imported_at: '2026-10-10'
  source_format: markdown-frontmatter
  source_hash: 37e7add088d862f7a9306bb807dd69aa39c5e53c0e553500c8b695c4c1fcc553
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - admin
code:
  - packages/admin/src/lib/deprecation-view.ts
  - packages/admin/src/routes/DeprecationDetail.tsx
implementation_evidence:
  repositories:
    admin:
      role: core
      status: completed
      changed_paths:
        - packages/admin/src/lib/deprecation-view.ts
        - packages/admin/src/routes/DeprecationDetail.tsx
        - packages/admin/src/routes/Deprecations.tsx
        - packages/admin/tests/deprecation-view.test.ts
        - apps/docs/src/content/docs/deprecation.md
        - apps/docs/src/content/docs/es/deprecation.md
      validations:
        - command: npx vitest run packages/admin/tests/deprecation-view.test.ts
          status: passed
          reason: >-
            4 casos del helper puro deprecationView — 0 targets = empty state
            sin vistas operativas; targets > 0 =
            pipeline/board/environment/targets; waves solo con estructura de
            dependencias relevante (más de una wave o blocked); plan completado
            sin regresión.
        - command: pnpm --filter @kaddo/admin build
          status: passed
          reason: >-
            tsc -b + vite build limpios; detalle renderiza por stages + empty
            state; copy de la página actualizado.
implementation_status: completed
validation_status: passed
summary: >-
  Admin ya captura una intención individual de Controlled Deprecation (New
  Deprecation → Title + Purpose → draft `DEP-NNN` con `targets: []`). Pero al
  abrir un draft **sin targets**, el detalle sigue renderizando las estructuras
  operativas del lifecycle (Pipeline, Retirement Wav…
original_snapshot:
  title: >-
    Mejorar la experiencia de Deprecation drafts en Admin con visualización
    progresiva
  description: >-
    Admin ya captura una intención individual de Controlled Deprecation (New
    Deprecation → Title + Purpose → draft `DEP-NNN` con `targets: []`). Pero al
    abrir un draft **sin targets**, el detalle sigue renderizando las
    estructuras operativas del lifecycle (Pipeline, Retirement Wav…
  type: feature
  status: draft
ready_at: '2026-10-10'
verified_at: '2026-10-10'
---

# Mejorar la experiencia de Deprecation drafts en Admin con visualización progresiva

## Intent

Admin ya captura una intención individual de Controlled Deprecation (New Deprecation → Title + Purpose →
draft `DEP-NNN` con `targets: []`). Pero al abrir un draft **sin targets**, el detalle sigue renderizando
las estructuras operativas del lifecycle (Pipeline, Retirement Waves, Environment Matrix, Board, Targets)
vacías, lo que parece un error o información faltante. Este WI hace la vista **progresiva**: mostrar solo
las representaciones que tengan sentido para el nivel actual de definición del plan. Es un refinamiento de
presentación; no toca el Core de Controlled Deprecation.

## Target behavior

Para un plan sin targets: Intent summary + refinement state + **empty state** de refinamiento; ocultar
Pipeline / Retirement Waves / Environment Matrix / Board / Target list / Dependency view. La UI se deriva
de la información real disponible, no del `status` textual.

## Scope

1. **Progressive Deprecation Detail** — tres stages derivados de los datos:
   - **Stage A — Captured Intent** (`targets.length === 0`): Intent summary + refinement state +
     empty-state guidance. Ocultar Pipeline/Waves/Environment Matrix/Board/Target list/Dependency view.
   - **Stage B — Targets Discovered** (`targets.length > 0`): mostrar Pipeline, Board, Environment Matrix
     y Targets aunque aún no haya dependencies/waves.
   - **Stage C — Dependencies Analyzed** (hay dependency intelligence suficiente): añadir Retirement
     Waves / Dependency View / Blocked Targets. No mostrar waves vacías solo porque el componente exista.
2. **Empty state** específico para un plan pendiente de refinamiento. Copy: "No targets yet / This
   deprecation has not been refined. / Use an MCP-connected agent to discover candidate targets, inspect
   usage evidence, map dependencies, propose removal waves, and define the soft-deprecation strategy."
   Reforzar que `0 targets ≠ 0 dependencies` y `not analyzed ≠ none`.
3. **Keep Captured Intent guidance** — mantener el mensaje "intent captured / refine with an MCP agent /
   creating this plan did not authorize removal". No reemplazarlo por el empty state (tienen propósitos
   distintos: la intent card explica el estado; el empty state explica por qué no hay vistas operativas).
4. **Deprecations page copy** — cambiar "Controlled retirement plans, derived from canonical Kaddo
   knowledge." por "Plan and track controlled retirement of legacy functionality." / ES: "Planifica y
   sigue el retiro controlado de funcionalidades legacy." (Admin ahora también crea planes, no solo
   deriva).
5. **Progressive rendering rules** — las vistas aparecen según información disponible, no por el status:
   `targets = 0 → empty state`; `targets > 0 → pipeline + board + environments + targets`; `dependency
   analysis → dependency view`; `removal waves → retirement waves`; `soft deprecation → observation`;
   `production runbook → runbook`. Evitar `status === "draft" → hide everything` (un draft puede ya tener
   targets descubiertos).
6. **Progressive disclosure** — no mostrar headings sin contenido (p. ej. RETIREMENT WAVES solo con
   `waves.length > 0`/información significativa). Igual para Dependency View / Observation / Runbook. Una
   sección sin contenido no ocupa espacio solo por preservar el layout.
7. **Completed plans remain unchanged** — un plan con targets/lifecycle completed/waves conserva la
   experiencia actual. Este WI no rediseña las vistas; solo cambia **cuándo** aparecen.
8. **Multirepo compatibility** — comportamiento idéntico single-repo y multirepo; sin lógica de empty
   state por repositorio.

## Out of scope

Cambiar el modelo/lifecycle/Core de Controlled Deprecation; persistir un refinement_status; cambiar
Targets/dependency intelligence/waves/soft deprecation/Production Runbooks; crear targets desde Admin;
LLM embebido en Admin; rediseñar Pipeline/Board/Environment Matrix.

## Acceptance criteria

- [x] AC-01 — Zero-target UX: un plan con `targets.length === 0` muestra empty state de refinamiento y no renderiza vistas operativas vacías.
- [x] AC-02 — Intent Guidance: el mensaje de intención capturada (no autoriza removal) permanece visible.
- [x] AC-03 — No False Semantics: `Analysis: Not performed`, `Dependencies: Unknown`, `Removal waves: Not calculated` mantienen su semántica.
- [x] AC-04 — Progressive Targets: con ≥1 target aparecen Pipeline, Board, Environment Matrix y Target list.
- [x] AC-05 — Progressive Waves: Retirement Waves solo aparece cuando existen waves derivadas relevantes.
- [x] AC-06 — No Empty Headings: Admin no muestra secciones operativas vacías solo para mantener la estructura.
- [x] AC-07 — Existing Plans: planes activos/completados con información siguen mostrando las vistas actuales sin regresiones.
- [x] AC-08 — Copy: la descripción general de Deprecations refleja planificar y seguir, no solo visualizar derivados.
- [x] AC-09 — Multirepo: el progressive rendering funciona igual single-repo y multirepo.
- [x] AC-10 — Documentation: docs explican la diferencia entre Captured Intent y un plan refinado.

## Validation

- **Fresh draft** (targets 0): Intent captured card + empty state; sin Pipeline/Waves/Environment
  Matrix/Board/Target section.
- **First target added**: Pipeline/Board/Environment Matrix/Targets visibles; Retirement Waves oculto si
  aún no hay waves relevantes.
- **Dependency analysis** (cadena TGT-001→002→003): Retirement Waves con Wave 1/2/3 visible.
- **Existing completed plan**: experiencia detallada actual sin cambios.

## Definition of Done

Un draft recién creado se siente intencional y no vacío; Admin comunica que requiere refinamiento; no se
muestran estructuras operativas antes de tener datos; las vistas aparecen progresivamente; ninguna
ausencia de análisis se lee como ausencia de dependencias; planes refinados/completados mantienen la
experiencia; sin cambios al Core; single-repo y multirepo iguales; tests cubren draft vacío / first
target / waves / completed; docs reflejan el comportamiento progresivo.

## Implementation handoff guidance

Refinamiento de presentación sobre lo existente. Punto principal: `packages/admin/src/routes/
DeprecationDetail.tsx` (y copy en `Deprecations.tsx`). Reutilizar los datos ya expuestos por Core/Admin
Server (targets, lifecycle counts, waves, environment state) y derivar la representación por
`targets.length` y por disponibilidad de waves/dependencias. No introducir un persisted state para
resolver una condición de UI derivable. Principio: Admin muestra la complejidad de una deprecación a
medida que se descubre, no antes.

## Relación

Continúa WI-056 (captura individual desde Admin) sobre la superficie Admin Deprecations (WI-053).

## Learning

Cambio de presentación puro, sin tocar el Core ni persistir estado: toda la decisión de qué mostrar se
derivó de datos ya expuestos (`targets.length` y `dependency.waves/blocked`) mediante un helper puro
`deprecationView(plan)`. Extraerlo a `packages/admin/src/lib/deprecation-view.ts` permitió **testearlo
sin DOM** (vitest sobre lógica), evitando montar React/jsdom — el paquete admin no tenía runner de
componentes y no valía la pena introducirlo para esto.

La regla no trivial fue "waves relevantes": `deriveRemovalWaves` siempre devuelve al menos una wave (cada
target cae en alguna), así que mostrar la sección por `waves.length > 0` la dejaría casi siempre visible
y vacía de significado. El criterio correcto es `waves.length > 1 || blocked.length > 0`: una sola wave
no aporta ordenamiento (no hay dependencias), varias waves o targets bloqueados sí. Esto cumple las
validaciones del spec (first target → waves oculto; cadena de 3 → waves visible) y el principio rector:
mostrar complejidad a medida que se descubre, no antes.

Se mantuvieron **dos piezas distintas** en el stage de intención: la *intent card* (explica el estado:
intención capturada, no autoriza removal) y el *empty state* (explica por qué no hay vistas operativas y
orienta al refinamiento por MCP) — el spec pedía explícitamente no fusionarlas. Las vistas operativas se
condicionan individualmente (`view.showX`), de modo que no aparecen headings sin contenido y los planes
completados conservan la experiencia completa sin tocar su render.
