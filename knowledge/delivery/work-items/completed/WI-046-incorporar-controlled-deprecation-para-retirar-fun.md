---
type: feature
id: WI-046
title: >-
  Incorporar Controlled Deprecation para retirar funcionalidades legacy de forma
  segura y trazable
status: completed
work_type: feature
created_at: '2026-10-10'
source:
  type: external
  imported_at: '2026-10-10'
  source_format: markdown-frontmatter
  source_hash: 804195e61f5e484dd0c2b34e3227d9769e9014567b2f950978c8858224b8dfb7
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
is_epic: true
domains:
  - Tech
  - Delivery
affected_modules:
  - cli
  - mcp
  - admin
  - admin-server
  - docs
scope_confidence:
  level: high
  reasons:
    - >-
      Reutiliza capabilities ya implementadas (Legacy Knowledge, System Graph,
      Project Resources, Multirepo, Work Items, Implementation Handoff,
      Evidence/Verification, Admin) en lugar de crear subsistemas paralelos.
    - >-
      El spec define principios, scope, out-of-scope, 15 ACs, validación y DoD
      de forma explícita.
    - Es una épica: >-
        el riesgo de scope se mitiga dividiéndola en 8 hijos (A-H) antes de
        implementar.
summary: >-
  Workflow Controlled Deprecation para retirar funcionalidades legacy de forma
  segura y trazable: discover candidates, validar uso real, mapear dependencias,
  soft deprecation, retiro en Dev/Test, runbooks de producción con aprobación
  humana y observación post-cambio. Épica — dividir en 8 hijos antes de
  implementar.
implementation_evidence:
  repositories:
    cli:
      role: module
      status: completed
      changed_paths:
        - packages/cli/src/core/deprecation.ts
        - packages/cli/src/core/deprecation-intelligence.ts
        - packages/cli/src/core/deprecation-runbook.ts
        - packages/cli/src/core/graph.ts
      validations:
        - command: >-
            pnpm --filter @kaddo/cli exec vitest run tests/deprecation.test.ts
            tests/deprecation-write.test.ts
            tests/deprecation-observation.test.ts
            tests/deprecation-intelligence.test.ts
            tests/deprecation-integration.test.ts
            tests/deprecation-runbook.test.ts tests/deprecation-graph.test.ts
          status: passed
          reason: >-
            Controlled Deprecation Core, graph, lifecycle, integration, and
            runbook tests pass.
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/routes/Deprecations.tsx
        - packages/admin-server/src/core-adapter.ts
      validations:
        - command: >-
            pnpm --filter @kaddo/admin build && pnpm --filter
            @kaddo/admin-server build
          status: passed
          reason: Admin deprecation views and read-only projections compile.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/deprecation.md
        - apps/docs/src/content/docs/es/deprecation.md
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: Bilingual documentation builds successfully.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-10'
original_snapshot:
  title: >-
    Incorporar Controlled Deprecation para retirar funcionalidades legacy de
    forma segura y trazable
  description: >-
    Kaddo ya comprende y evoluciona sistemas existentes (Legacy Knowledge:
    risks/unknowns/modernization candidates; System Graph; Project Resources;
    Multirepo; Work Items; Evidence; Verification; Learning). Pero no hay un
    workflow explícito para un escenario legacy frecuente: iden…
  type: feature
  status: draft
ready_at: '2026-10-10'
completed_at: '2026-10-10'
---

# Incorporar Controlled Deprecation para retirar funcionalidades legacy de forma segura y trazable

## Intent

Kaddo ya comprende y evoluciona sistemas existentes (Legacy Knowledge: risks/unknowns/modernization
candidates; System Graph; Project Resources; Multirepo; Work Items; Evidence; Verification; Learning).
Pero no hay un workflow explícito para un escenario legacy frecuente: identificar funcionalidades/
endpoints/módulos/procesos/objetos de BD potencialmente sin uso; validar la hipótesis con evidencia de
código/runtime/datos; ordenar su retiro por dependencias y riesgo; hacer primero una **soft
deprecation**; retirarlos progresivamente en Dev/Test; y preparar cambios de producción mediante
runbooks controlados y verificables.

Esto **no** es un nuevo `project.mode`: la deprecación es una capability que convive con mantenimiento,
bugs, features y modernización (`project: {state: legacy, mode: standard}` + workflow "Controlled
Deprecation").

## Goal

Guiar un proceso completo de retiro seguro: discover candidates → validate actual usage → map
dependencies → assess risk/reversibility → plan removal order → soft deprecate → observe → remove in
Dev/Test → verify → prepare Production Runbook → human approval → production change → post-change
observation → complete + Learning. Principio rector: **Kaddo nunca concluye que algo puede eliminarse
solo porque no encontró referencias en código.**

## Product principles

1. **Deprecation es un workflow, no un project mode** (nada de `mode: deprecation`); invocable sobre
   legacy/pre-ai/ai-assisted, conviviendo con delivery normal.
2. **Soft deprecation antes del retiro físico**: Active → Soft Deprecated → Disabled/Isolated →
   Observed → Removed. El borrado físico nunca es el primer paso recomendado.
3. **No-reference-found ≠ unused**: la confianza se construye con varias señales (static, runtime, data
   dependencies, external consumers, human confirmation); la ausencia de una señal no basta.
4. **Code y data son superficies de retiro distintas** (code decommission vs database/data
   decommission), aunque compartan objetivo funcional.
5. **Producción permanece controlada**: Dev/Test admite cambios destructivos dentro de los boundaries
   de Project Resources; producción prioriza Runbook → aprobación humana → ejecución controlada →
   evidence. Sin ejecución autónoma de cambios destructivos.

## Scope

1. **Deprecation Plan** (artifact first-class): `knowledge/legacy/deprecations/DEP-xxx-<slug>.md`
   (`type: deprecation-plan`). Representa qué/por qué/evidencia/dependencias/orden/retirados/pendientes.
   Planifica; NO sustituye Work Items (el plan orquesta; los WIs ejecutan).
2. **Deprecation Targets**: unidad de análisis/seguimiento (`DEP-TGT-xxx`), tipada: module, route,
   function, ui, job, database-object, integration, config, other. `locator` específico por tipo (una
   ruta/SP no se modela como un archivo de código).
3. **Multirepo**: el Plan pertenece al Core Project; los targets pueden apuntar a módulos distintos y a
   Project Resources; ids de módulo validados contra `.kaddo/modules.yml`. No copiar el plan a repos
   secundarios.
4. **Usage evidence** (estructurada por target): static/runtime/database/external_consumers/
   human_review. Distinguir explícitamente observed-fact / unknown / not-evaluated / human-confirmed.
   No convertir `unknown` en `none`.
5. **Assessment**: `unused_confidence`, `blast_radius`, `reversibility` (orientativos, influyen en la
   planificación). No calcular un score absoluto falso si la evidencia no lo soporta.
6. **Dependency-aware removal**: `depends_on_removal: [...]` (no retirar físicamente hasta que sus
   dependientes se hayan retirado o dejen de depender). Core deriva **waves** explicables; no basar el
   orden solo en un `priority` manual.
7. **Soft deprecation lifecycle** (target): candidate → usage-validated → soft-deprecated → disabled →
   removed-devtest → production-ready → production-changed → observing → completed; + `deprecated-
   retained` para elementos que no deben usarse pero deben conservarse (historical/audit/legal/
   reporting/support).
8. **Environment-aware state**: estado por ambiente (development/test/production) separado del estado
   global; no marcar `removed` global mientras producción siga activa.
9. **Soft deprecation strategy** (por target): strategy/mechanism (feature-flag, hide UI, disable
   route, deprecation warning, stop scheduler, remove caller, stop writes, read-only, telemetry,
   manual…) + observation_window_days + exit_criteria. No obligar a que todo sistema soporte feature
   flags.
10. **Observation window**: soft deprecation puede incluir ventana + criterios; al cumplirse el target
    queda **eligible for removal review** (no "automatically approved"; la eliminación es humana).
11. **Project Resources & database analysis**: targets de database/cloud/queue/api/storage se vinculan
    a un Project Resource (`resource: RES-...`); Kaddo usa sus interfaces/boundaries declarados para
    construir contexto (prod write/destructive requieren approval/runbook). Sin un segundo modelo de
    recursos.
12. **Plan → Work Items**: el plan produce WI candidates por wave; un WI materializado referencia los
    targets (`deprecation_targets: [...]`) y, cuando aplique, `resources: [{id, role}]`. No copiar la
    definición del target en el WI.
13. **Dev/Test decommission**: el Implementation Handoff conoce si un WI pertenece a un plan e incluye
    target/dependencies/soft-state/evidence/blast-radius/reversibility/environments/resources/rollback.
    En Dev/Test puede remover código/endpoints/schema dev/test data cuando el boundary del Resource lo
    permita y haya confirmación. Evidence registra lo realizado.
14. **Production Runbook**: para cambios sensibles de producción, artifact versionable
    `knowledge/delivery/runbooks/RB-xxx-<slug>.md` con Purpose/Preconditions/Dependencies/Backup-
    Recovery/Impact/Execution Order/Commands/Expected Results/Validation/Rollback/Abort Conditions/
    Observation Window/Evidence/Approval. No puede ser solo comandos destructivos.
15. **Controlled production execution**: un agente puede proponer el siguiente paso → humano confirma →
    tool/persona ejecuta → resultado capturado → validación → siguiente. Prohibido: DROP/DELETE/schema
    mutation no atendidos y runbook de producción totalmente autónomo.
16. **Post-change observation**: tras `production-changed` → `observing` hasta cumplir criterios; luego
    `completed`.
17. **Data retention**: distinguir `unused` de `safe to physically delete`; considerar retention/
    audit/historical/legal/support/backup. Puede terminar `deprecated-retained` (p. ej. stop writes +
    retener histórico) sin bloquear el plan.
18-23. **Admin**: sección de primer nivel **Deprecations** con: resumen de planes (targets/soft-
    deprecated/dev-test-removed/prod-pending/completed), **pipeline view** (conteo por estado),
    **board view** (por estado, sin drag-and-drop en el MVP), **dependency view** (topología de retiro
    desde Core/Graph, no recalculada en frontend), **environment matrix** (Dev/Test/Prod por target,
    obligatoria), **target detail** (identity/type/module-resource/locator/lifecycle/env-states/usage-
    evidence/confidence/blast-radius/reversibility/deps/wave/soft-deprecation/related WIs-Resources/
    evidence/runbook/graph).
24. **CLI/MCP surfaces**: `kaddo deprecation create|list|show|analyze|plan|status <DEP>` (naming final
    en Handoff); MCP para leer plan, proponer candidatos, add/update target con confirmación, preparar
    análisis, inspeccionar dependencias/estado. Mutaciones: proposal → preview → confirmación humana →
    Core.
25. **Agent-assisted candidate discovery**: legacy/architecture agents proponen candidatos desde
    codebase/routes/ui/jobs/Graph/Legacy Knowledge/Resources/runtime evidence/db metadata; discovery ≠
    materialización; el agente explica siempre por qué algo es candidato.

## Out of scope

`project.mode: deprecation`; eliminación automática por análisis estático; acceso autónomo a
producción; ejecución automática completa de runbooks; DROP/DELETE de producción sin confirmación;
provisionar backups automáticamente; crear un feature-flag system; observabilidad específica por
plataforma; inventar runtime usage sin telemetría; migrar datos históricos automáticamente; resolver
obligaciones legales de retención; convertir modernization candidates en targets automáticamente;
drag-and-drop del lifecycle; reemplazar Work Items o Project Resources.

## Acceptance criteria

- [x] AC-01 — Deprecation Plan: Core soporta artifacts `DEP-xxx` bajo `knowledge/legacy/deprecations/`.
- [x] AC-02 — Targets: tipados (module/route/function/ui/job/database-object/integration/config/other) con locators apropiados.
- [x] AC-03 — Multirepo: targets apuntan a módulos de `.kaddo/modules.yml`; un plan abarca múltiples repos.
- [x] AC-04 — Resources: targets database/external se relacionan con Project Resources y respetan sus boundaries.
- [x] AC-05 — Evidence & Assessment: usage evidence + unused_confidence/blast_radius/reversibility sin convertir unknown en no-usage.
- [x] AC-06 — Dependency Planning: Core representa dependencias de retiro y deriva waves/blocked targets de forma explicable.
- [x] AC-07 — Soft Deprecation: lifecycle con soft-deprecated/disabled/dev-test removal/prod readiness-change/observation/completion antes de decommission.
- [x] AC-08 — Environments: estado Dev/Test/Production separado del estado general.
- [x] AC-09 — Observation: observation window + exit criteria; cumplirlos deja al target eligible (no auto-removido).
- [x] AC-10 — Work Items: targets → WI candidates/materializados con trazabilidad WI → DEP → target.
- [x] AC-11 — Runbook: cambios sensibles de prod generan un Production Runbook (preconditions/backup/execution/validation/rollback/abort/evidence).
- [x] AC-12 — Production Safety: ninguna operación destructiva de prod se ejecuta en silencio o por inferencia autónoma.
- [x] AC-13 — Retention: un target puede terminar `deprecated-retained`.
- [x] AC-14 — Admin: seguir planes con resumen, pipeline, dependency view, environment view y target detail.
- [x] AC-15 — Documentation: docs EN/ES del lifecycle completo, multirepo, Resources, soft deprecation, runbooks y fronteras de seguridad.

## Validation

- **VB function** (`type: function`, locator path+symbol): discovered → usage evidence → soft
  deprecation → Dev/Test removal → producción visible por separado.
- **Endpoint** (`POST /legacy/credit`, static=0, runtime=0/90d, external=none-known): high-confidence
  candidate, NO auto-remove.
- **Database dependency** (Function A → sp_OldCredit → OLD_CREDIT_RULES): plan Wave1 función, Wave2 SP,
  Wave3 tabla; no recomendar retirar la tabla primero.
- **Multirepo** (web/api/legacy-vb/RES-main-database): un solo DEP-001 con targets de las 4 superficies,
  WIs por módulo/resource, sin duplicar el plan.
- **Soft deprecation** (soft-deprecated, window 30d, exit cumplidos): eligible for removal review, no
  auto-removido.
- **Environment tracking**: tras WI de Dev/Test → dev/test removed, production active; Admin muestra
  Production pending.
- **Production DB change** (sp_OldCredit): Dev/Test verificado → Runbook generado (backup/commands/
  rollback) → aprobación humana; sin ejecución destructiva implícita.
- **Retention**: objeto sin uso pero con retención obligatoria → `deprecated-retained`, sin bloquear el
  plan.

## Definition of Done

Kaddo recorre un caso legacy real: identify → validate → soft deprecate → observe → order by
dependencies → remove Dev/Test → verify → prepare production runbook → change production under human
control → observe → complete. Además: Plan versionable; targets con identidad estable; rutas/funciones/
módulos/objetos DB sin ambigüedad; multirepo desde el Core Project; Resources para databases/external;
CLI/MCP/Admin convergen en Core; absence-of-reference ≠ unused; soft deprecation en el lifecycle;
ambientes independientes; waves explicables; Dev/Test y Prod no se confunden; prod usa Runbook cuando
corresponde; rollback/abort/recovery en el cambio sensible; retention → deprecated-retained; Admin
visualiza la evolución; WIs trazables a sus targets; Evidence/Verification registran lo ejecutado;
tests (single/multirepo, code/database target, soft deprecation, dependency planning, runbooks,
environment states); docs EN/ES; dogfooding sobre un caso legacy real.

## Entry points (grounding técnico)

Capacidades ya existentes sobre las que se construye cada superficie nueva (reusar, no duplicar):

- **Artifact read model** — `packages/cli/src/core/resources.ts` (patrón `getResources`/`getResource`/
  `parseScope`/`purposeFromBody`) y `work-items.ts` como referencia para el read model del
  Deprecation Plan y los Targets (frontmatter tipado + body).
- **Mutation contract** — `packages/cli/src/core/resource-write.ts` (create/update no-lossy/delete con
  preview de referencias, `nextResourceId`, `buildFrontmatter`, `atomicWrite`, `sanitizeRefs`) como
  plantilla para `deprecation-write` (plan + target proposal → preview → confirm).
- **CLI** — `packages/cli/src/commands/resources.ts` como molde de `kaddo deprecation …`.
- **MCP** — `packages/mcp/src/tools.ts` + `server.ts`, patrón confirm ausente/false → preview;
  confirm=true → apply (mirror de `markWorkItemReady`).
- **Legacy Knowledge** — risks/unknowns/modernization candidates ya modelados: fuente de candidate
  discovery; `modernization candidate` NO se convierte en target automáticamente.
- **System Graph** — `packages/cli/src/core/graph.ts` (`GraphNodeType`/`GraphEdgeType`,
  `RESOURCE_ROLE_EDGE`, edges module→resource `depends_on`): añadir nodos `deprecation-target` y
  edges target↔module/resource/WI y `depends_on_removal` para derivar waves/blast-radius.
- **Project Resources** — `knowledge/tech/resources/` + scope system/module: targets database/cloud/
  external se vinculan por `resource: RES-…` y respetan sus boundaries declarados (prod write/
  destructive → approval/runbook).
- **Multirepo** — `.kaddo/modules.yml` + `loadMappedModules`: validar ids de módulo de los targets; el
  plan vive en el Core Project.
- **Work Items** — `packages/cli/src/core/work-items.ts` (`WorkItemDetail`, `resources:[{id,role}]`,
  relaciones parent/child): añadir `deprecation_targets:[…]` y materialización de WI candidates por wave.
- **Implementation Handoff** — `packages/cli/src/core/implementation-handoff.ts` (sección "Relevant
  Resources"): añadir contexto de target/soft-state/evidence/blast-radius/reversibility/environments/
  rollback cuando el WI pertenece a un plan.
- **Evidence/Verification** — pipeline existente: registrar lo retirado en Dev/Test y validar ACs.
- **Admin** — patrón de secciones `Resources.tsx`/`ResourceDetail.tsx` + `Sidebar.tsx` + `App.tsx` +
  `lib/api.ts` + admin-server `core-adapter.ts`/`statusForCode`: nueva sección "Deprecations" (summary/
  pipeline/board/dependency/environment-matrix/target-detail), vistas derivadas en Core, no en frontend.
- **Runbooks** — nuevo artifact `knowledge/delivery/runbooks/RB-xxx.md` (no existe aún); patrón de
  artifact versionable como los WI.

## Suggested delivery split (épica — dividir antes de implementar)

- **A. Deprecation Core Model** — Plan + Targets + locators + lifecycle + environment state + assessments.
- **B. Discovery + Dependency Intelligence** — usage evidence + Graph relationships + dependency ordering + removal waves + legacy-agent guidance.
- **C. CLI + MCP** — plan CRUD/read + target mutation + analyze/plan/status + preview+confirm.
- **D. Work Item + Project Resource Integration** — deprecation_targets + WI candidate materialization + Resource boundaries + Handoff/Evidence.
- **E. Soft Deprecation + Observation** — strategy + observation window + exit criteria + environment transitions + retained outcome.
- **F. Production Runbooks** — runbook artifact + generation context + approval boundary + evidence/rollback/abort.
- **G. Admin** — Deprecations section + pipeline + board + dependency view + environment matrix + target detail.
- **H. Graph + Docs + Dogfooding** — target/module/resource edges + docs EN/ES + real legacy validation.

El parent conserva el outcome global; cada hijo = un outcome coherente (One WI → One Branch → One PR).

## Implementation handoff guidance

Reutilizar lo existente en vez de crear subsistemas paralelos: Legacy Knowledge (candidate discovery/
risks/unknowns), System Graph (dependencies/blast-radius), Project Resources (boundaries de database/
cloud/external), Multirepo (ownership/location), Work Items (ejecución), Implementation Handoff
(plan controlado), Evidence+Verification (prueba de retiro), Admin (visualización). La capa nueva es
Controlled Deprecation (Legacy/Graph/Modules/Resources/Runtime/DB-metadata → Deprecation Plan →
Targets → topología de dependencias → waves → Work Items → Dev/Test & Production → Verification/Runbook/
Approval → Observation → Decommissioned o Retained). No asumir que todo proyecto legacy tiene runtime
telemetry, feature flags o acceso automatizable a su BD: degradar seguro (evidence unavailable →
unknown → human investigation required), nunca (evidence unavailable → unused). **Soft deprecation
primero; decommission físico solo tras evidencia suficiente, comprensión de dependencias, evaluación
de reversibilidad y decisión humana explícita.**

## Learning

El workflow de deprecacion debe construirse como una capacidad transversal: Core establece hechos y limites, mientras CLI, MCP, Admin, grafo, docs y runbooks proyectan el mismo conocimiento sin automatizar decisiones destructivas.
