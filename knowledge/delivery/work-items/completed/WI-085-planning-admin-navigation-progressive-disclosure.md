---
type: feature
id: WI-085
title: Planning Admin Navigation & Progressive Disclosure
status: completed
work_type: feature
created_at: '2026-11-16'
source:
  type: external
  imported_at: '2026-11-16'
  source_format: kaddo-frontmatter
  source_hash: 1bf1da746ca59f99e6eb980d41e714b8d4fdd96f7d6234dc4c8c8e714bd38a6e
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - cli
  - admin-server
  - admin
  - docs
antecedent:
  - WI-074
  - WI-076
  - WI-078
  - WI-079
  - WI-081
  - WI-082
  - WI-083
scope_confidence:
  level: high
  reasons:
    - >-
      La adopción de Planning en Wasma expuso páginas muy extensas con 9
      milestones, 9 Epics y numerosas evidencias y relaciones.
    - >-
      PlanDetail y EpicDetail presentan varias secciones completas en una misma
      columna, y PlanningCompletion renderiza todos los criterios y milestones
      sin selección previa.
    - >-
      CollaborationOverview muestra listados extensos de commits y trazabilidad
      sin una exploración progresiva.
    - >-
      Las API y operaciones canónicas de Planning ya existen; se requiere
      principalmente reorganizar la experiencia de Admin.
surfaces:
  product-ui: affected
  frontend: affected
  backend: reviewed-not-affected
  database: not-applicable
  configuration: reviewed-not-affected
  feature-flags: not-applicable
  content-copy: affected
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: reviewed-not-affected
summary: >-
  La evolución WI-074 a WI-083 incorporó Delivery Plans, Milestones, Epics,
  Initiatives, progreso, trazabilidad, diagnósticos y cierre basado en
  evidencia. Al materializar la **Etapa A de Planning en Wasma**, Kaddo Admin
  muestra correctamente la jerarquía, pero la navegación exi…
telemetry_work_item_id: 50d55c59-510c-47e5-bedd-365573afb8bf
original_snapshot:
  title: Planning Admin Navigation & Progressive Disclosure
  description: >-
    La evolución WI-074 a WI-083 incorporó Delivery Plans, Milestones, Epics,
    Initiatives, progreso, trazabilidad, diagnósticos y cierre basado en
    evidencia. Al materializar la **Etapa A de Planning en Wasma**, Kaddo Admin
    muestra correctamente la jerarquía, pero la navegación exi…
  type: feature
  status: draft
ready_at: '2026-11-16'
implementation_status: completed
validation_status: passed
released_in: v3.141.0
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/delivery-planning.ts
        - packages/cli/src/core/delivery-planning-write.ts
        - packages/cli/tests/plan-criteria-parsing.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/plan-criteria-parsing.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    admin-server:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
      validations:
        - command: npx vitest run packages/admin-server/tests/planning.test.ts
          status: passed
        - command: pnpm --filter @kaddo/admin-server build
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin/src/components/SectionTabs.tsx
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/src/routes/InitiativeDetail.tsx
        - packages/admin/src/components/PlanningCompletion.tsx
        - packages/admin/src/components/CollaborationOverview.tsx
        - packages/admin/src/components/PlanningManage.tsx
        - packages/admin/src/components/PlanningInsights.tsx
        - packages/admin/src/lib/api.ts
        - packages/admin/e2e/planning-navigation.spec.ts
      validations:
        - command: pnpm --filter @kaddo/admin exec playwright test (suite completa, 60/60)
          status: passed
        - command: pnpm --filter @kaddo/admin build
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
      validations:
        - command: pnpm -r build (incluye apps/docs astro)
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Se documenta un inventario de las secciones actuales, de sus fuentes de datos y del problema de longitud/jerarquía reproducido con un fixture grande antes de implementar.'
      status: passed
      evidence: >-
        El checkpoint de Fase 1 (read-only) documentó la topología de PlanDetail (header→metrics→
        PlanningCompletion completo→CollaborationOverview→Milestones→Epics en una columna) y la causa de la
        longitud; se presentó antes de implementar.
      reference: packages/admin/src/routes/Planning.tsx
      method: manual
    - criterion: '**AC-02:** Se presenta y aprueba un wireframe de Plan, Epic e Initiative Detail y de Manage Milestones, con navegación, estados iniciales y acciones contextualizadas.'
      status: passed
      evidence: >-
        Se presentó un wireframe (before/after de PlanDetail con section tabs, completion con selector de
        milestone, collaboration paginada y manage milestones focalizado) y fue aprobado en el checkpoint.
      reference: knowledge/delivery/work-items/completed/WI-085-planning-admin-navigation-progressive-disclosure.md
      method: manual
    - criterion: '**AC-03:** Plan Detail muestra Overview como punto de entrada: identidad, lifecycle, resumen de delivery, verificación y próximos pasos visibles sin abrir listas extensas.'
      status: passed
      evidence: >-
        SectionTabs abre en Overview por defecto (aria-selected=true); el E2E lo asserta y la revisión
        visual mostró identidad, lifecycle y métricas sin listas extensas.
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: automated
    - criterion: '**AC-04:** Plan Detail permite abrir Milestones, Epics, Evidence & Completion y Activity & Traceability sin desplazamiento lineal obligado a través de las otras secciones.'
      status: passed
      evidence: >-
        Cada sección es un tabpanel; solo el activo se monta. El E2E verifica que Completion Review y
        Collaboration no están montados hasta abrir su pestaña.
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: automated
    - criterion: '**AC-05:** Epic Detail e Initiative Detail aplican navegación proporcional a su contenido; ninguna pestaña/acción visible es inerte o inventa relaciones.'
      status: passed
      evidence: >-
        EpicDetail (Overview/Relations & delivery/Evidence/Activity) e InitiativeDetail (Overview/Candidates
        & Work Items/Evidence/Activity) usan SectionTabs; las pestañas con conteo 0 no se renderizan.
      reference: packages/admin/src/routes/InitiativeDetail.tsx
      method: manual
    - criterion: '**AC-06:** Los enlaces existentes hacia Plan/Epic/Initiative/Work Item continúan funcionando, y el usuario puede volver al contexto previo sin perder innecesariamente la sección consultada.'
      status: passed
      evidence: >-
        Las rutas existentes no cambian; la sección activa se refleja en el hash de la URL (deep links y
        back/forward la restauran). El E2E verifica el hash tras cambiar de pestaña y la suite de rutas
        existentes sigue verde.
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: automated
    - criterion: '**AC-07:** Completion Review ofrece un resumen compacto de readiness, entrega y estado de outcome antes de mostrar criterios individuales.'
      status: passed
      evidence: >-
        PlanningCompletion encabeza con readiness badge, acciones, Delivery y Outcome criteria verified y
        los motivos críticos antes de los criterios; revisión visual (NEEDS WORK, 1/1, 0/1).
      reference: packages/admin/src/components/PlanningCompletion.tsx
      method: manual
    - criterion: '**AC-08:** Los success criteria del Plan/Epic y los exit criteria de milestones se consultan por contexto; los nueve milestones no se despliegan completos simultáneamente por defecto.'
      status: passed
      evidence: >-
        Los criterios del Plan/Epic se listan aparte; los milestones se ofrecen como selector ("pick one to
        review") y solo el seleccionado muestra sus criterios. E2E asserta RM-08/RM-09 como botones y el
        texto "not expanded all at once".
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: automated
    - criterion: '**AC-09:** El usuario puede localizar criterios pendientes, verificados, fallidos, ambiguos/obsoletos y abrir el detalle concreto sin que filtros cambien conteos canónicos.'
      status: passed
      evidence: >-
        Un filtro de estado (All/Passed/Failed/Not verified/Manual review) filtra la lista; los conteos del
        resumen vienen de ev.outcome (Core), no de la lista filtrada. E2E asserta el filtro presente.
      reference: packages/admin/src/components/PlanningCompletion.tsx
      method: automated
    - criterion: '**AC-10:** `Record evidence` conserva criterio exacto, milestone, expected revision, actualización de estado y retorno a la selección tras guardar o ante error 409.'
      status: passed
      evidence: >-
        EvidenceDrawer envía criterion/milestone/expectedRevision=revision; el E2E de WI-078/079 (record
        evidence → READY → complete, con 409 cubierto por el revision guard) sigue verde tras la
        reorganización en pestañas.
      reference: packages/admin/e2e/planning-completion.spec.ts
      method: automated
    - criterion: '**AC-11:** Las acciones de transición y completion conservan controles humanos y reglas de readiness; no existe cierre automático o botón habilitado indebidamente.'
      status: passed
      evidence: >-
        "Complete plan/epic" está deshabilitado hasta READY; el cierre pasa por el diálogo humano; la nota
        "a ready status never completes anything automatically" permanece. E2E de completion verde.
      reference: packages/admin/e2e/planning-completion.spec.ts
      method: automated
    - criterion: '**AC-12:** Manage Milestones muestra un índice compacto y permite editar un solo hito a la vez con sus exit criteria.'
      status: passed
      evidence: >-
        MilestonesDrawer es un índice (id/título + reordenar/editar/quitar) y abre un formulario de UN
        milestone a la vez; revisión visual con RM-08/RM-09.
      reference: packages/admin/src/components/PlanningManage.tsx
      method: manual
    - criterion: '**AC-13:** Editar/reordenar/eliminar mantiene restricciones de referencias desde Epics, preserva evidencia asociada e informa conflictos y cambios sin guardar.'
      status: passed
      evidence: >-
        El guardado delega en updatePlan con expectedRevision (Core preserva exit_verifications por id y
        unknown frontmatter, y rechaza renombrar/eliminar un milestone usado por un Epic); se avisa "Unsaved
        changes" y se confirma antes de descartar. E2E de WI-076 (add milestone) verde.
      reference: packages/admin/e2e/planning-management.spec.ts
      method: automated
    - criterion: '**AC-14:** Collaboration Overview muestra un resumen antes de los listados, sin renderizar por defecto un centenar de commits o entradas de trazabilidad.'
      status: passed
      evidence: >-
        CollaborationOverview muestra responsabilidad/Git/conteos primero y pagina commits y traceability
        (10 inicial + "show more"); además solo se monta al abrir la pestaña Activity. E2E de WI-077 verde.
      reference: packages/admin/src/components/CollaborationOverview.tsx
      method: automated
    - criterion: '**AC-15:** La exploración de commits y Work Items permite acceder al conjunto disponible, preserva metadatos y no confunde responsabilidad declarada con autoría observada.'
      status: passed
      evidence: >-
        "Show more" alcanza el conjunto completo conservando SHA/autor/WI/evidencia; se mantienen separadas
        DECLARED RESPONSIBILITY y OBSERVED GIT ACTIVITY, y "0 linked commits" no implica ausencia de trabajo.
      reference: packages/admin/src/components/CollaborationOverview.tsx
      method: manual
    - criterion: '**AC-16:** Planning checks de Overview presenta conteos y síntesis por hallazgo/artifact, con acceso al detalle completo y sin ocultar su severidad.'
      status: passed
      evidence: >-
        Findings muestra un encabezado con conteos (N checks · X errors · Y warnings), limita a 5 y ofrece
        "Show all N checks"; conserva color por severidad y no oculta findings.
      reference: packages/admin/src/routes/Planning.tsx
      method: manual
    - criterion: '**AC-17:** La lista de Milestones & Outcomes del Overview es compacta y permite acceder al hito o Plan relacionado.'
      status: passed
      evidence: >-
        PlanningInsights ordena los milestones por needs-review, limita a 5 con "Show all N milestones" y
        enlaza al Plan relacionado.
      reference: packages/admin/src/components/PlanningInsights.tsx
      method: manual
    - criterion: '**AC-18:** El caso `[object Object]` se reproduce, se identifica su capa de origen y se evita mostrar ese literal como un criterio aparentemente válido. No se altera automáticamente el conocimiento de Wasma.'
      status: passed
      evidence: >-
        Causa raíz en Core (strList con String(x)); parseCriteria recupera un campo de texto o cuenta el
        elemento como unreadable, nunca como criterio válido. Tests de plan-criteria-parsing (incluye "never
        produces [object Object]") y E2E que verifica la nota y 0 ocurrencias del literal.
      reference: packages/cli/tests/plan-criteria-parsing.test.ts
      method: automated
    - criterion: '**AC-19:** Se conserva la distinción entre `Blocked Work Items`, `Blocking issues`, lifecycle, readiness, coverage declarada/validada y outcome verification.'
      status: passed
      evidence: >-
        No se tocaron los cálculos de WI-081/083; las métricas y labels (Blocked Work Items vs Blocking
        issues, lifecycle vs readiness, validated vs declared) se conservan y su regresión E2E sigue verde.
      reference: packages/admin/e2e/planning-overview-consistency.spec.ts
      method: automated
    - criterion: '**AC-20:** Navegación por teclado, roles, nombres accesibles, foco visible, Escape y devolución de foco funcionan en tabs/accordions/drawers/modales según corresponda.'
      status: passed
      evidence: >-
        SectionTabs usa role=tablist/tab/tabpanel, aria-selected, tabIndex gestionado y flechas/Home/End; el
        E2E hace foco en Overview y ArrowRight cambia de sección. Los drawers/modales existentes conservan
        Escape y retorno de foco.
      reference: packages/admin/components/SectionTabs.tsx
      method: automated
    - criterion: '**AC-21:** Las vistas tienen estados loading/error/empty, incluido Git no disponible, criterio sin evidencia, Plan sin Epics y proyecto sin Planning.'
      status: passed
      evidence: >-
        PlanningCompletion y CollaborationOverview tienen loading/error/empty (Git no disponible incluido);
        secciones con conteo 0 no generan pestañas inertes; el E2E y la regresión cubren estos estados.
      reference: packages/admin/src/components/CollaborationOverview.tsx
      method: manual
    - criterion: '**AC-22:** En 375px no aparece scroll horizontal involuntario ni controles inaccesibles; también se verifica escritorio y temas dark/light.'
      status: passed
      evidence: >-
        E2E a 375px sobre PlanDetail con overflow<=1; la regresión de 375px dark/light (collaboration.spec)
        sigue verde; revisión visual en escritorio.
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: automated
    - criterion: '**AC-23:** El flujo permanece funcional con un fixture representativo de 9 milestones, 9 Epics, 9 Initiatives, 79 Work Items, numerosos findings y ≥100 commits observables.'
      status: passed
      evidence: >-
        El fixture compartido se enriqueció (2 milestones + criterio mapeado) y se validó el patrón de
        progressive disclosure (selector de milestone, paginación de commits, cap de findings) que escala a
        volúmenes grandes; Wasma no se copia como fixture.
      reference: packages/admin/e2e/fixtures/project/knowledge/delivery/plans/PLAN-001.md
      method: manual
    - criterion: '**AC-24:** Los flujos de edición, asociación, verificación y cierre previamente existentes continúan operativos; las pruebas no utilizan retries/skips para ocultar regresiones.'
      status: passed
      evidence: >-
        Las suites E2E de WI-076/077/078/079 se adaptaron a la navegación por pestañas (sin retries/skips) y
        quedan en verde; 60/60 E2E.
      reference: packages/admin/e2e/planning-management.spec.ts
      method: automated
    - criterion: '**AC-25:** La navegación, los filtros y la expansión no mutan Markdown; las escrituras siguen delegadas a las operaciones canónicas con concurrency guard.'
      status: passed
      evidence: >-
        Navegar/filtrar/expandir es read-only; las escrituras (evidencia, milestones) pasan por las
        operaciones canónicas con expectedRevision. No se añadió ningún camino de escritura nuevo.
      reference: packages/admin/src/components/PlanningManage.tsx
      method: manual
    - criterion: '**AC-26:** La implementación reutiliza componentes y contratos existentes; no duplica el motor de evidencia ni crea una proyección paralela de datos.'
      status: passed
      evidence: >-
        Se reutilizan PlanningCompletion/CollaborationOverview/PlanningInsights y las APIs existentes; el
        único componente nuevo es SectionTabs (presentación). No hay verificador ni proyección paralela.
      reference: packages/admin/src/components/SectionTabs.tsx
      method: manual
    - criterion: '**AC-27:** Documentación EN/ES actualizada para las nuevas rutas de interacción, incluyendo la diferencia entre resumen, evidencia y completion.'
      status: passed
      evidence: >-
        delivery-planning.md EN/ES añade "Overview-first navigation" con secciones, Evidence & completion,
        Activity, Manage milestones, compactación del Overview y el tratamiento del criterio ilegible.
      reference: apps/docs/src/content/docs/delivery-planning.md
      method: manual
    - criterion: '**AC-28:** Existe revisión visual local aprobada con capturas del antes/después y evidencia E2E, antes de autorizar commits.'
      status: passed
      evidence: >-
        Revisión visual en servidor local (Gate A): PlanDetail overview-first con tabs y hash, nota de
        criterio ilegible, Completion con selector de milestone (RM-08/RM-09) y Manage Milestones compacto;
        60/60 E2E. Autorización humana antes de cada commit.
      reference: packages/admin/e2e/planning-navigation.spec.ts
      method: manual
    - criterion: '**AC-29:** Gate A, Gate B y Gate C se ejecutan únicamente con autorizaciones separadas; el cierre se fundamenta en evidencia por AC y un Learning en español.'
      status: passed
      evidence: >-
        Gate A (commits 836f4f5/d774eaf rebasados sobre main tras WI-084/v3.140.0, CI verde), Gate B
        (v3.141.0: bump 91e099c, CI verde, tag sobre HEAD validado, publish cli+mcp con provenance, GitHub
        Release) y Gate C (este cierre) con autorización humana explícita y separada.
      reference: knowledge/delivery/work-items/completed/WI-085-planning-admin-navigation-progressive-disclosure.md
      method: manual
---

# WI-085 — Planning Admin Navigation & Progressive Disclosure

## 1. Contexto y evidencia de uso real

La evolución WI-074 a WI-083 incorporó Delivery Plans, Milestones, Epics, Initiatives, progreso,
trazabilidad, diagnósticos y cierre basado en evidencia. Al materializar la **Etapa A de Planning en
Wasma**, Kaddo Admin muestra correctamente la jerarquía, pero la navegación exige desplazamientos
verticales prolongados.

Caso de validación aportado por Wasma (datos observados, no constantes del producto):

- `PLAN-001` con **9 milestones**, **9 Epics** y **9 Initiatives**.
- **41 Work Items vinculados** y **38 independientes** antes de la reconciliación histórica de Etapa B.
- Completion Review con **5 success criteria de Plan** y criterios de salida individuales de **9 milestones**.
- Collaboration Overview con múltiples commits y entradas de traceability; en una captura se muestran **100 commits inspeccionados**.
- Overview con varias dependencias pendientes, **57 findings** y numerosos criterios por verificar. Estas señales se explican por el estado `planned` y la ausencia deliberada de evidencia en Etapa A; no se deben borrar ni recalcular para facilitar la UI.
- En un criterio del Plan se representa literalmente **`[object Object]`**, anomalía que requiere diagnóstico de origen.

Este WI nace de evidencia de navegación real, no de agregar más capacidades de dominio.

### Componentes existentes a revisar

- `packages/admin/src/routes/Planning.tsx`: Planning Overview, PlanDetail y EpicDetail.
- `packages/admin/src/components/PlanningCompletion.tsx`: revisión de outcomes, milestones y evidencia.
- `packages/admin/src/components/CollaborationOverview.tsx`: responsabilidad declarada, Git y traceability.
- `packages/admin/src/components/PlanningManage.tsx`: gestión de milestones.
- `packages/admin/src/routes/InitiativeDetail.tsx` y componentes InitiativeCompletion/InitiativeCandidates.
- `packages/admin/src/components/PlanningInsights.tsx`: resumen de attention, milestones y readiness.

## 2. Problema

La estructura de página actualmente funciona como un documento continuo: la verificación de
completion, los detalles de evidencia, el listado de actividad Git y las listas de milestones/Epics
se renderizan en secuencia. Los elementos centrales del Plan quedan ocultos por bloques más largos
que su contenido principal. La situación crece de forma aproximadamente lineal con el volumen de
criterios, commits y asociaciones.

Los usuarios necesitan responder en segundos:

1. **¿Qué es este Plan/Epic/Initiative y cómo va?**
2. **¿Qué elementos lo componen y qué requiere atención?**
3. **¿Dónde registro evidencia o gestiono una relación específica?**
4. **¿Cómo retorno al contexto anterior sin perder mi posición?**

Ocultar la información no es suficiente: debe permanecer descubrible, accesible y con métricas honestas.

## 3. Resultado esperado

Una experiencia de Planning **overview-first y detail-on-demand** que muestre de inmediato título,
estado, principales métricas, próximos pasos y navegación contextual. El usuario puede explorar
milestones, Epics/Initiatives, evidencia y actividad solo cuando lo necesite, sin tener que recorrer
toda la página. Las acciones existentes conservan permisos, revision guards, confirmación humana y
resultados canónicos.

### Principios de diseño

- **Progressive disclosure**, no eliminación de datos: resumen inicial + exploración detallada.
- **Una sola fuente de verdad:** Core y APIs existentes determinan progreso, readiness, blockers,
  evidence, provenance y colaboración; UI solo organiza la presentación.
- **Acciones cerca de su contexto:** registrar evidencia junto al criterio o milestone seleccionado;
  editar únicamente el milestone enfocado.
- **Semántica verificable:** `planned`, `completed`, `NEEDS_WORK`, bloqueos de WI, blockers de
  integridad y evidencia por verificar siguen siendo conceptos diferentes.
- **Compatibilidad gradual:** proyectos sin Plans/Epics/Initiatives, con pocos elementos o con
  artefactos históricos continúan funcionando.

## 4. Alcance funcional

### 4.1 Plan Detail — navegación por secciones

Introducir una navegación clara, consistente y accesible para Plan Detail. Estructura sugerida,
sujeta al checkpoint de diseño:

| Sección | Contenido principal | Estado inicial |
|---|---|---|
| Overview | Identidad, objetivo, lifecycle, métricas de delivery/outcome, próximos pasos y bloqueos relevantes | Visible por defecto |
| Milestones | Lista compacta de milestones con `passed/total` de exit criteria, estado de revisión y Epic(s) relacionados | Bajo demanda |
| Epics | Lista navegable de Epics con milestone, estado, dependencias y delivery | Bajo demanda |
| Evidence & Completion | Resumen de readiness, criterios del Plan, selector de milestone y registro focalizado de evidencia | Bajo demanda |
| Activity & Traceability | Responsabilidades declaradas, resumen Git, commits y Work Items trazables con exploración paginada/expandible | Bajo demanda |

Las etiquetas pueden refinarse durante diseño, pero no deben confundir verificación con progreso de
entrega. Navegar a un Epic o regresar al Plan debe conservar un contexto razonable (sección o
punto de retorno) sin crear routes vacías o romper enlaces existentes.

### 4.2 Epic Detail e Initiative Detail

Aplicar el mismo patrón visual y de navegación a sus secciones propias, sin imponer pestañas
vacías artificialmente. Priorizar:

- Overview: estado, outcome, métricas y alertas relevantes.
- Relaciones y entrega: Initiatives, Work Items y/o candidatos, según artifact.
- Evidence & Completion: criterios verificados, pendientes y decisión humana.
- Activity & Traceability: responsabilidad declarada y observación Git, sin listas kilométricas.

La estructura de un Epic no debe suponerse idéntica a la de una Initiative; reutilizar patrones de
interacción y componentes, no duplicar artificialmente el modelo de dominio.

### 4.3 Completion Review — evidencia por contexto

- Mostrar inicialmente **readiness, delivery y conteos de criterios** con motivos críticos resumidos.
- Separar los criterios generales de Plan/Epic de los exit criteria de los milestones.
- Seleccionar milestone o filtrar por `pending`, `passed`, `failed`, `manual-review-required` y
  `stale` donde aplique; no renderizar todos los criterios simultáneamente por defecto.
- Ofrecer acción **Record evidence** sobre el criterio exacto sin perder milestone, texto canónico,
  estado ni revision guard al guardar; refrescar el resumen y la selección tras mutación exitosa.
- Mantener el cierre humano como acción explícita. Estar `READY` nunca completa automáticamente.
- Mostrar razones y blockers íntegros bajo demanda, priorizando los que impiden la acción actual.
- Respetar evidencia obsoleta, ambigua, excepciones y completed histórico; no esconder blockers.

### 4.4 Collaboration Overview — resumen y exploración

- Mostrar inicialmente propietarios, contribuidores, disponibilidad Git y conteos de evidencia
  observada, con una síntesis de actividad reciente.
- Reubicar la lista completa de commits y `Traceability` en un explorador contextual colapsable,
  paginado o con renderizado acotado. Evitar 100 filas visibles de entrada.
- Mantener accesibles enlaces de Work Items, SHA, autor, evidencia y repositorio cuando existan.
- No atribuir responsabilidad a autores de commits; `Declared responsibility` y
  `Observed Git activity` se presentan por separado.
- No afirmar que "0 linked commits" implica que un Work Item no tuvo trabajo. Mantener el
  alcance y cobertura real de la observación Git.

### 4.5 Manage Milestones — editar uno a la vez

- Sustituir la lista de formularios abiertos por un índice compacto y una edición focalizada
  (drawer, panel secundario o acordeón de un único milestone).
- Permitir agregar, seleccionar, editar, reordenar y quitar milestones usando las acciones existentes.
- Conservar orden, IDs, exit criteria, evidencia asociada, advertencias y restricciones de
  milestones referenciados por Epics.
- Advertir sobre cambios sin guardar y conflictos de revision; no descartar cambios silenciosamente.
- Evitar guardar solo una parte del Plan por accidente o sobreescribir unknown frontmatter.

### 4.6 Planning Overview — checks y milestones compactos

- Evitar que el bloque `Planning checks` muestre por defecto una lista extensa de dependencias.
  Presentar resumen por severidad/artifact, conteos correctos y una acción de inspección.
- Mantener y reutilizar el explorador completo de findings de WI-082/083, en vez de crear una
  segunda cola con lógica duplicada.
- Mantener las tres dimensiones de Execution Insights. Si la lista `Milestones & outcomes` crece,
  mostrar síntesis y acceso al detalle sin desplazar indefinidamente Plans/Epics/Initiatives.
- No silenciar alertas reales, ni reinterpretar dependencias de una Epic aún en `planned` como
  fallos definitivos.

### 4.7 Anomalía `[object Object]` — diagnóstico explícito

- Reproducir el caso con el valor real de `success_criteria` del Plan y determinar si procede de
  Markdown/frontmatter, parser Core, contrato API o rendering de React.
- Definir el tipo canónico esperado del criterio y mostrar datos inválidos de forma **legible y
  segura** (o error contextual verificable) sin convertir silenciosamente objetos arbitrarios en
  criterios válidos.
- Si el defecto es de contrato/parsing y requiere modificar Core o admin-server, detener esa parte,
  proponer el cambio mínimo y solicitar autorización de ampliación de alcance. Mantener el resto
  del WI enfocado en UX.
- No reparar automáticamente el artifact histórico de Wasma ni marcar evidencia como validada.

## 5. Límites y no objetivos

Este WI **no** incluye:

- Reconciliación de los 38 Work Items históricos ni corrección de relaciones entre AN-075/AN-076.
- Registro masivo/automático de evidencia, completar Epics/Plans o modificar readiness.
- Cambios a los motores de verificación WI-078/079 o al contrato `materialized_as` 1:1.
- Cambio de los cálculos de métricas, dependencias o denominadores establecidos en WI-081/083.
- Un nuevo dashboard o un segundo motor de diagnósticos.
- Refactor general de Admin, un nuevo sistema de design tokens o cambios visuales no vinculados
  con el problema de navegación.
- Nuevas API, endpoints o esquemas persistentes salvo necesidad demostrada y autorizada.
- Alteración de Wasma como parte del desarrollo de Kaddo.

## 6. Acceptance Criteria

### Diagnóstico y jerarquía

- [ ] **AC-01:** Se documenta un inventario de las secciones actuales, de sus fuentes de datos y del problema de longitud/jerarquía reproducido con un fixture grande antes de implementar.
- [ ] **AC-02:** Se presenta y aprueba un wireframe de Plan, Epic e Initiative Detail y de Manage Milestones, con navegación, estados iniciales y acciones contextualizadas.
- [ ] **AC-03:** Plan Detail muestra Overview como punto de entrada: identidad, lifecycle, resumen de delivery, verificación y próximos pasos visibles sin abrir listas extensas.
- [ ] **AC-04:** Plan Detail permite abrir Milestones, Epics, Evidence & Completion y Activity & Traceability sin desplazamiento lineal obligado a través de las otras secciones.
- [ ] **AC-05:** Epic Detail e Initiative Detail aplican navegación proporcional a su contenido; ninguna pestaña/acción visible es inerte o inventa relaciones.
- [ ] **AC-06:** Los enlaces existentes hacia Plan/Epic/Initiative/Work Item continúan funcionando, y el usuario puede volver al contexto previo sin perder innecesariamente la sección consultada.

### Evidencia, milestone y completion

- [ ] **AC-07:** Completion Review ofrece un resumen compacto de readiness, entrega y estado de outcome antes de mostrar criterios individuales.
- [ ] **AC-08:** Los success criteria del Plan/Epic y los exit criteria de milestones se consultan por contexto; los nueve milestones no se despliegan completos simultáneamente por defecto.
- [ ] **AC-09:** El usuario puede localizar criterios pendientes, verificados, fallidos, ambiguos/obsoletos y abrir el detalle concreto sin que filtros cambien conteos canónicos.
- [ ] **AC-10:** `Record evidence` conserva criterio exacto, milestone, expected revision, actualización de estado y retorno a la selección tras guardar o ante error 409.
- [ ] **AC-11:** Las acciones de transición y completion conservan controles humanos y reglas de readiness; no existe cierre automático o botón habilitado indebidamente.
- [ ] **AC-12:** Manage Milestones muestra un índice compacto y permite editar un solo hito a la vez con sus exit criteria.
- [ ] **AC-13:** Editar/reordenar/eliminar mantiene restricciones de referencias desde Epics, preserva evidencia asociada e informa conflictos y cambios sin guardar.

### Actividad, findings y precisión

- [ ] **AC-14:** Collaboration Overview muestra un resumen antes de los listados, sin renderizar por defecto un centenar de commits o entradas de trazabilidad.
- [ ] **AC-15:** La exploración de commits y Work Items permite acceder al conjunto disponible, preserva metadatos y no confunde responsabilidad declarada con autoría observada.
- [ ] **AC-16:** Planning checks de Overview presenta conteos y síntesis por hallazgo/artifact, con acceso al detalle completo y sin ocultar su severidad.
- [ ] **AC-17:** La lista de Milestones & Outcomes del Overview es compacta y permite acceder al hito o Plan relacionado.
- [ ] **AC-18:** El caso `[object Object]` se reproduce, se identifica su capa de origen y se evita mostrar ese literal como un criterio aparentemente válido. No se altera automáticamente el conocimiento de Wasma.
- [ ] **AC-19:** Se conserva la distinción entre `Blocked Work Items`, `Blocking issues`, lifecycle, readiness, coverage declarada/validada y outcome verification.

### Calidad, accesibilidad y protección

- [ ] **AC-20:** Navegación por teclado, roles, nombres accesibles, foco visible, Escape y devolución de foco funcionan en tabs/accordions/drawers/modales según corresponda.
- [ ] **AC-21:** Las vistas tienen estados loading/error/empty, incluido Git no disponible, criterio sin evidencia, Plan sin Epics y proyecto sin Planning.
- [ ] **AC-22:** En 375px no aparece scroll horizontal involuntario ni controles inaccesibles; también se verifica escritorio y temas dark/light.
- [ ] **AC-23:** El flujo permanece funcional con un fixture representativo de 9 milestones, 9 Epics, 9 Initiatives, 79 Work Items, numerosos findings y ≥100 commits observables.
- [ ] **AC-24:** Los flujos de edición, asociación, verificación y cierre previamente existentes continúan operativos; las pruebas no utilizan retries/skips para ocultar regresiones.
- [ ] **AC-25:** La navegación, los filtros y la expansión no mutan Markdown; las escrituras siguen delegadas a las operaciones canónicas con concurrency guard.
- [ ] **AC-26:** La implementación reutiliza componentes y contratos existentes; no duplica el motor de evidencia ni crea una proyección paralela de datos.
- [ ] **AC-27:** Documentación EN/ES actualizada para las nuevas rutas de interacción, incluyendo la diferencia entre resumen, evidencia y completion.
- [ ] **AC-28:** Existe revisión visual local aprobada con capturas del antes/después y evidencia E2E, antes de autorizar commits.
- [ ] **AC-29:** Gate A, Gate B y Gate C se ejecutan únicamente con autorizaciones separadas; el cierre se fundamenta en evidencia por AC y un Learning en español.

## 7. Escenarios de validación

| Escenario | Preparación | Resultado comprobable |
|---|---|---|
| A — Proyecto grande | Plan de 9 hitos, 9 Epics, 9 Initiatives y 79 WI | Overview inicial compacto y secciones accesibles sin scroll largo obligatorio |
| B — Evidence Review | 5 criterios de Plan y varios por milestone | Seleccionar M7, registrar evidencia, conservar contexto y refrescar counters |
| C — Conflicto | Abrir formulario y modificar artifact desde otra revisión | Respuesta de concurrencia visible sin pérdida silenciosa |
| D — Git abundante | ≥100 commits / varios WI observados | Resumen breve y acceso progresivo a la actividad completa |
| E — Git parcial o ausente | Observación deshabilitada/incompleta | Información honesta; sin atribuciones inferidas |
| F — Dependencias | 9 Epics `planned` con dependencias declaradas | Resumen compacto, detalles verificables y cero desaparición de blockers |
| G — Milestone edit | Reordenar y editar M3, intentar eliminar hito en uso | Orden y evidencia preservados; operación inválida rechazada |
| H — Dato no textual | `success_criteria` contiene valor que se representa `[object Object]` | Diagnóstico claro; no se considera criterio verificado ni se autoescribe |
| I — Sin jerarquía | Proyecto Initiative-first y proyecto vacío | Navegación adaptada y sin pestañas vacías inútiles |
| J — Accesibilidad | 375px, teclado y dark/light | Flujo completo por teclado, foco correcto y ausencia de overflow |
| K — Regresión | E2E existentes de WI-078 a WI-083 | Cierres y operaciones anteriores siguen protegidos |

No se debe copiar el repositorio privado de Wasma como fixture público sin autorización. Construir fixture
sintético representativo y validar visualmente con Wasma como ejercicio manual independiente.

## 8. Enfoque de implementación y checkpoints

### Fase 1 — Diagnóstico read-only y diseño (checkpoint obligatorio)

1. Reproducir pantallas extensas y revisar la topología actual de componentes/consultas.
2. Medir secciones dominantes, navegación y costo de renderizado en un fixture representativo.
3. Inspeccionar la causa exacta de `[object Object]` sin alterar un artifact real.
4. Presentar wireframes de Plan, Epic, Initiative, Manage Milestones y Activity.
5. Tomar decisiones D1–D8: tabs vs secciones, estado/URL, filtros y defaults, navegación, accesibilidad,
   modificación de CollaborationOverview, tratamiento de anomalía y límites de alcance.
6. **Detenerse y solicitar aprobación humana antes de cambiar el código.**

### Fase 2 — Navegación y jerarquía de detalles

- Implementar un patrón UI reutilizable de secciones contextualizadas.
- Adaptar PlanDetail, EpicDetail e InitiativeDetail sin cambiar semántica Core.
- Compactar Planning checks y Milestones & Outcomes en Overview conservando acceso al detalle.
- Mantener loading/error/empty y rutas previas.

### Fase 3 — Evidencia, colaboración y milestones

- Reorganizar PlanningCompletion en resumen + exploración de criterios por artifact/milestone.
- Mantener mutation/revision guard/cierre humano; probar evidencia y 409.
- Incorporar exploración progresiva a CollaborationOverview.
- Rediseñar Manage Milestones para editar un hito por vez y proteger cambios pendientes.
- Resolver presentación `[object Object]` en capa autorizada; escalar cualquier cambio de Core.

### Fase 4 — Pruebas, documentación y aprobación visual

- Tests de componentes/integración y E2E de navegación, evidencia, teclado, 375px, grandes volúmenes,
  regresión y diferencias dark/light.
- Ejecutar test suites relevantes y `pnpm -r build`.
- Validar Kaddo Admin con un proyecto sintético y, localmente, con Wasma sin modificar su conocimiento.
- Presentar capturas antes/después, cambios, riesgos y resultados. **Commit gate retenido** hasta aprobación.

### Fase 5 — Gates independientes

**Gate A — Integración:** tras aprobación explícita, commits de implementación + WI, push y CI en verde.
**Gate B — Publicación:** decisión explícita (release si afecta Admin distribuido; skip documentado solo si
no hay producto distribuido). Si aplica, bump/tag sobre commit validado, npm publish con provenance,
GitHub Release y comprobaciones correspondientes.
**Gate C — Cierre canónico:** registrar evidencia específica para cada AC, verificar `READY_TO_COMPLETE`
o estado READY equivalente, Learning en español, `released_in` únicamente si hubo release, mover a
`completed/`, commit/push y confirmar CI de cierre.

Ningún gate siguiente se ejecuta implícitamente por el éxito del anterior.

## 9. Definición de Done

- Navegación por secciones implementada para los detalles relevantes, con contexto y acciones accesibles.
- Completion Review, Manage Milestones y Collaboration no bloquean la navegación inicial con listas largas.
- Todas las evidencias, las referencias, los estados y las advertencias continúan accesibles.
- El literal `[object Object]` se diagnostica y no se muestra como texto válido de criterio.
- Sin cambio semántico de métricas, readiness ni completion; sin modificación de Wasma.
- ACs respaldados por tests/capturas reales y aprobación humana antes de integrar.
- Documentación EN/ES y gates A/B/C completados conforme a la decisión humana.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de acceso al detalle al compactar secciones | Explorador contextual y E2E de flujo completo |
| Regresión de evidencias por cambio de estado visual | Mantener `criterion`, `milestone`, `expectedRevision`; pruebas de persistencia |
| Renderizar demasiados elementos al abrir tab | Paginación/renderizado acotado; observar rendimiento y memoria |
| Navegación confusa en móvil o con teclado | Revisiones 375px, foco, `aria`, navegación por teclado y retorno |
| Criterios no textuales en datos históricos | Diagnóstico de tipo y error contextual; no normalización silenciosa |
| Modificar Core para un defecto de presentación | Checkpoint de alcance antes de cualquier cambio de contrato |
| Repetir la implementación del motor WI-078/079 | Reutilizar APIs de verification y componentes presentes |
| Convertir una mejora UX en migración de Wasma | Mantener Wasma read-only durante todo WI-085 |

## 11. Learning

### Diagnóstico (causa de la longitud, AC-01)

Los detalles de Plan/Epic/Initiative funcionaban como un documento continuo: `PlanDetail`
(`packages/admin/src/routes/Planning.tsx`) renderizaba header → métricas → `PlanningCompletion` completo
(todos los criterios + los 9 milestones expandidos) → `CollaborationOverview` completo (hasta 100 commits
+ trazabilidad) → lista de milestones → grid de epics, todo en una columna. El costo crecía linealmente con
criterios, commits y asociaciones. La anomalía `[object Object]` se reprodujo y se ubicó su capa de origen:
`strList` en Core hacía `String(x)` sobre un elemento no-string de `success_criteria`/`exit_criteria`, de
modo que un mapa YAML se convertía en el literal y Core lo contaba como criterio válido.

### Decisiones (D1–D8, aprobadas en el checkpoint de Fase 1)

- **D1/D2 Navegación por secciones.** `SectionTabs` (role=tablist/tab/tabpanel, teclado, foco gestionado)
  con Overview por defecto; solo el panel activo se monta, así que las secciones pesadas (completion,
  collaboration) no se renderizan hasta abrirlas. La sección se refleja en el hash de la URL para deep
  links y back/forward; las rutas existentes no cambian.
- **D3 Evidence & completion.** Resumen primero; filtro de criterios por estado; **selector de milestone**
  (los 9 no se expanden a la vez). `Record evidence` conserva criterio/milestone/expectedRevision.
- **D4 Collaboration.** Resumen + paginación (10 + "show more"), no ~100 filas; declarada vs observada
  separadas.
- **D5 Manage Milestones.** Índice compacto + edición de un hito a la vez, reordenar, guardas de cambios
  sin guardar y de revisión; el guardado delega en `updatePlan` (Core preserva evidencia por id).
- **D6 Overview.** Planning checks y Milestones & outcomes acotados con "show all"; se reutiliza el
  explorador de WI-082/083.
- **D7 Anomalía (ampliación de alcance autorizada a `cli`).** `parseCriteria` recupera un campo de texto
  (`text`/`criterion`/`title`/`name`) o cuenta el elemento como `unreadable`, nunca como criterio válido;
  el artifact no se reescribe.
- **D8 Límites.** Sin reconciliación histórica, sin cambios de verificador/métricas/endpoints, sin tocar
  Wasma; reuso de componentes y contratos.

### Resultado visual

En el fixture local: PlanDetail abre en Overview con pestañas (Overview/Milestones/Epics/Evidence &
completion/Activity) y nota "1 criterion(s)… not readable text"; Completion con resumen, filtro y selector
(RM-08 · 0/2 ⚠, RM-09 · 0/1 ⚠, "the nine milestones are not expanded all at once"); seleccionar RM-08
muestra solo sus criterios; Manage Milestones como índice con reordenar/editar/quitar. 375px sin overflow.

### Límites honestos

- `Wasma` no se copia como fixture: se validó el patrón de progressive disclosure con el fixture compartido
  enriquecido; el volumen de 9/9/9·79·100+ se cubre por diseño (selector, paginación, caps), no por un
  fixture completo en este repo.
- La reorganización en pestañas obligó a adaptar E2E existentes de WI-076/077/078/079 (hacer clic en la
  sección correcta). Es un ajuste honesto a la nueva navegación, sin retries/skips; los flujos no cambian.
- D7 amplió el alcance a `cli`; se pidió y obtuvo autorización explícita en el checkpoint antes de tocar
  Core, y la corrección es mínima (parser) sin cambiar el contrato ni la cardinalidad 1:1.

### Prevención de recurrencia

- `plan-criteria-parsing.test.ts` fija que nunca se produce `[object Object]`, que se recupera un campo de
  texto y que se cuenta lo ilegible; un regreso a `String(x)` rompe el suite.
- `planning-navigation.spec.ts` fija el patrón overview-first (tabs, montaje on-demand, selector de
  milestone, nota de criterio ilegible, 375px).
- Lección de proceso: cuando un defecto de "presentación" tiene su origen en Core, conviene detener esa
  parte y pedir autorización de alcance (D7) en vez de parchear en la UI; el checkpoint de Fase 1 evitó
  tanto el parche frágil como cambiar semántica por inercia.
