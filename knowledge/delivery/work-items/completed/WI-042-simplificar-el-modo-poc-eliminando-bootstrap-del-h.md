---
type: feature
id: WI-042
title: >-
  Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech
  + Delivery
status: completed
work_type: feature
created_at: '2026-10-09'
source:
  type: external
  imported_at: '2026-10-09'
  source_format: markdown-frontmatter
  source_hash: 636bcd86873443885a312f2fdcb2895fb8ec5055230de9f5959aeb283a1eb91f
  inferred: false
generated_by: kaddo-admin
domains:
  - Tech
  - Delivery
affected_modules:
  - core
code:
  - packages/cli/src/commands/bootstrap.ts
  - packages/cli/src/commands/init.ts
  - packages/cli/src/commands/project.ts
  - packages/cli/src/core/bootstrap-templates.ts
  - packages/cli/src/core/next-step.ts
  - packages/cli/src/core/poc.ts
  - packages/cli/src/core/project-route.ts
  - packages/cli/src/core/understand.ts
  - packages/cli/src/core/context-pack.ts
  - packages/mcp/src/resources.ts
  - README.md
  - apps/docs/src/content/docs/poc-mode.md
  - apps/docs/src/content/docs/es/poc-mode.md
summary: >-
  Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech
  + Delivery
original_snapshot:
  title: >-
    Simplificar el modo POC eliminando Bootstrap del happy path y priorizando
    Tech + Delivery
  type: feature
  status: draft
scope_confidence:
  level: high
  reasons:
    - >-
      The change is bounded to existing POC projections and preserves standard
      mode behavior.
refined_by: work-item-refinement (manual)
ready_at: '2026-10-09'
implementation_status: completed
validation_status: passed
verified_at: '2026-10-09'
completed_at: '2026-10-09'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/commands/bootstrap.ts
        - packages/cli/src/commands/init.ts
        - packages/cli/src/commands/project.ts
        - packages/cli/src/core/next-step.ts
        - packages/cli/src/core/poc.ts
        - packages/cli/src/core/project-route.ts
        - packages/mcp/src/resources.ts
        - README.md
        - apps/docs/src/content/docs/poc-mode.md
        - apps/docs/src/content/docs/es/poc-mode.md
      validations:
        - command: pnpm test
          status: passed
          reason: Full suite passed except one parallel timeout; isolated rerun passed.
        - command: pnpm --filter @kaddo/cli build && pnpm --filter @kaddo/mcp build && pnpm --filter @kaddo/docs build
          status: passed
          reason: CLI, MCP, and documentation builds passed.
        - command: pnpm npm-readme:check && pnpm agent-plugin:check && git diff --check
          status: passed
          reason: Published README, agent-plugin skills, and whitespace checks passed.
---

# Simplificar el modo POC eliminando Bootstrap del happy path y priorizando Tech + Delivery

## Intent

Kaddo incorporó `project.mode: poc` para ejecutar experimentos acotados orientados a:

```text
Hypothesis
↓
Success Criteria
↓
Minimal Technical Context
↓
Experiment
↓
Evidence
↓
Conclusion
```

La implementación actual ya crea `knowledge/delivery/poc.md` durante:

```bash
kaddo init --mode poc
```

pero todavía conserva `kaddo bootstrap` como parte del flujo recomendado.

Además, el bootstrap POC actual puede crear:

```text
knowledge/business/business.md
knowledge/product/product.md
knowledge/tech/codebase.md
knowledge/tech/current-state.md
knowledge/delivery/poc.md
```

Esto introduce conocimiento Business/Product que no es necesario para el objetivo principal de una POC y agrega un paso adicional después de `init`, aunque el artifact POC canónico ya existe.

El modo POC debe aplicar de forma más estricta el principio de **Minimum Sufficient Knowledge**:

> Una POC necesita suficiente conocimiento para entender la hipótesis, ejecutar el experimento y evaluar evidencia; no necesita modelar un producto completo antes de comenzar.

---

# Goal

Hacer que:

```bash
kaddo init --mode poc
```

deje una POC lista para continuar directamente con su definición y experimentación, sin requerir:

```bash
kaddo bootstrap
```

El happy path pasa de:

```text
init --mode poc
↓
bootstrap
↓
hypothesis
↓
technical context
↓
experiment
```

a:

```text
init --mode poc
↓
hypothesis + success criteria
↓
minimal technical context
↓
Project Resources if needed
↓
experiment / spike
↓
evidence
↓
conclusion
```

---

# Product Principle

## POC is experiment-first, not product-first

En modo estándar:

```text
Business
↓
Product
↓
Tech
↓
Delivery
```

En modo POC:

```text
Question / Problem
↓
Hypothesis
↓
Tech
↓
Experiment
↓
Evidence
↓
Decision
```

El contexto mínimo de problema, valor esperado y escenario a validar debe vivir dentro de `poc.md`.

No debe ser necesario crear capas completas de Business o Product para ejecutar el experimento.

---

# Current Behavior

Actualmente `kaddo init --mode poc` ya crea:

```text
.kaddo/config.yml
knowledge/knowledge.md
knowledge/delivery/poc.md
knowledge/delivery/work-items/
```

y recomienda posteriormente completar el baseline mediante:

```bash
kaddo bootstrap
```

El bootstrap para `mode=poc` contempla actualmente:

```text
Business
Product
Codebase
Current State
POC
```

Las docs y algunos hints MCP también indican ejecutar `kaddo bootstrap` para obtener o completar el artifact POC.

Esto es redundante porque `poc.md` ya se crea durante `init`.

---

# Target Behavior

## New POC

```bash
kaddo init --mode poc
```

debe producir todo lo indispensable para iniciar:

```text
.kaddo/
└── config.yml

knowledge/
└── delivery/
    ├── poc.md
    └── work-items/
```

Artifacts técnicos adicionales se crean o refinan únicamente cuando aportan valor real:

```text
knowledge/tech/current-state.md
knowledge/tech/codebase.md
knowledge/tech/resources/
knowledge/tech/decisions/
```

No son una precondición universal para empezar la POC.

---

# 1. Remove Bootstrap from the POC Happy Path

Eliminar `kaddo bootstrap` de las recomendaciones normales cuando:

```yaml
project:
  mode: poc
```

Después de `init`, el siguiente paso debe ser definir:

```text
Hypothesis
Success Criteria
```

en:

```text
knowledge/delivery/poc.md
```

Ejemplo:

```text
✓ Kaddo initialized in POC mode.

Next:
Define the hypothesis and success criteria in
knowledge/delivery/poc.md.
```

No recomendar:

```text
complete the minimal baseline with kaddo bootstrap
```

---

# 2. POC Artifact Holds the Minimal Business/Product Context

Extender, si hace falta, `knowledge/delivery/poc.md` para concentrar el contexto mínimo requerido.

Estructura objetivo:

```markdown
# Proof of Concept

## Problem

What are we trying to understand or solve?

## Hypothesis

What assumption are we testing?

## Expected Value

Why is validating this worth doing?

## Scenario

What concrete scenario will demonstrate the hypothesis?

## Success Criteria

- [ ] Observable result...

## Constraints

Technical, time, budget or operational constraints.

## Non-goals

What this experiment intentionally will not prove or deliver.

## Evidence

Measurements, observations and Work Items.

## Conclusion

Status: pending
```

No duplicar esta información en `business.md` o `product.md`.

---

# 3. Business/Product Layers Are Not POC Requirements

En `mode=poc`, Kaddo no debe requerir para readiness, route o next-step:

```text
knowledge/business/business.md
knowledge/product/product.md
knowledge/product/capabilities.md
knowledge/delivery/roadmap.md
```

Estos artifacts pueden existir si el proyecto ya los tenía, pero:

- no deben bloquear la POC;
- no deben aparecer como conocimiento faltante necesario;
- no deben ser recomendados antes del experimento;
- no deben ser creados únicamente para satisfacer el modo POC.

---

# 4. Technical Context Is Progressive

La POC debe priorizar contexto técnico únicamente cuando sea necesario.

Ejemplos:

### POC nueva y pequeña

```text
poc.md
↓
spike
```

puede ser suficiente inicialmente.

### POC sobre código existente

```text
poc.md
↓
kaddo scan
↓
current-state / codebase if useful
↓
spike
```

### POC con sistemas externos

```text
poc.md
↓
Project Resources
↓
spike
```

No crear documentación técnica vacía solo porque exista una capa Tech.

---

# 5. POC-aware Next Step

Ajustar `resolveNextStep` / route equivalente para que la prioridad sea:

```text
POC artifact missing
→ create/restore poc.md

Hypothesis missing
→ define hypothesis

Success Criteria missing
→ define success criteria

Existing code requires understanding
→ scan / minimal technical context

Experiment WI missing
→ create/refine spike

Experiment incomplete
→ implement/verify experiment

Evidence insufficient
→ collect evidence

Conclusion pending
→ evaluate

Conclusion recorded
→ POC complete
```

Nunca insertar Business/Product bootstrap entre hypothesis y experiment.

---

# 6. Existing Project → POC

Cuando se ejecute:

```bash
kaddo project mode poc
```

sobre un proyecto existente y `knowledge/delivery/poc.md` no exista, Kaddo debe crear el artifact POC mínimo automáticamente o mediante el mismo Core helper usado por `init`.

Flujo:

```text
standard/pre-ai/legacy project
↓
kaddo project mode poc
↓
preserve all existing knowledge
↓
ensure poc.md exists
↓
POC route becomes active
```

No exigir posteriormente:

```bash
kaddo bootstrap
```

solo para crear `poc.md`.

---

# 7. POC → Standard

Al ejecutar:

```bash
kaddo project mode standard
```

preservar:

```text
poc.md
evidence
Work Items
Resources
technical knowledge
decisions
```

Después del cambio sí puede ser válido recomendar:

```bash
kaddo bootstrap
```

si faltan las capas estándar de Business/Product/Tech/Delivery.

La transición queda:

```text
POC
↓
validated/rejected/inconclusive
↓
human decision
↓
mode standard
↓
standard baseline only if continuing as product
```

---

# 8. `kaddo bootstrap` Behavior in POC Mode

`kaddo bootstrap` continúa existiendo para proyectos estándar.

En `mode=poc` no debe crear automáticamente:

```text
business/business.md
product/product.md
product/capabilities.md
roadmap.md
```

Si el comando se ejecuta explícitamente en una POC, debe comportarse de forma segura y proporcional.

Opciones aceptables para implementación:

```text
A. no-op informativo
   "POC mode does not require a standard bootstrap"

or

B. ensure only POC/minimal technical structure
```

La decisión exacta puede resolverse en Handoff, pero bajo ninguna opción debe regenerarse el baseline product-oriented actual.

---

# 9. Understand and Context

`kaddo understand` y `kaddo context` deben poder operar inmediatamente después de:

```bash
kaddo init --mode poc
```

sin considerar Business/Product como incompletos.

Context Pack para una POC debe priorizar:

```text
Project mode
Hypothesis
Success Criteria
Constraints
Non-goals
Technical context available
Relevant Project Resources
Experiment Work Items
Evidence
Conclusion
```

Si no existe contexto técnico todavía, indicarlo como:

```text
not established yet
```

en vez de convertirlo automáticamente en un error de knowledge completeness.

---

# 10. MCP

Mantener:

```text
kaddo://poc
```

pero actualizar el mensaje cuando el artifact falte.

No:

```text
Set project.mode: poc and run kaddo bootstrap first.
```

Sino algo equivalente a:

```text
POC artifact not found.
Initialize the project in POC mode or switch it with
`kaddo project mode poc`.
```

MCP no debe presentar Bootstrap como requisito del modo POC.

---

# 11. Documentation and README

Actualizar documentación EN/ES y README.

El ejemplo principal debe pasar de:

```bash
kaddo init --mode poc
kaddo bootstrap
kaddo context
kaddo understand
```

a algo equivalente a:

```bash
kaddo init --mode poc

# define hypothesis and success criteria in poc.md

kaddo context
kaddo understand
kaddo create spike
```

Para proyectos existentes:

```bash
kaddo project mode poc
kaddo context
kaddo understand
```

Documentar explícitamente:

> POC mode does not require the standard Business/Product knowledge baseline.

---

# Out of Scope

Este WI no incluye:

```text
eliminar kaddo bootstrap del producto;
cambiar el bootstrap de proyectos standard;
eliminar Business/Product del modelo general de Kaddo;
nuevo tipo de Work Item;
nuevo agente exclusivo de POC;
ejecutar Project Resources;
crear infraestructura automáticamente;
métricas automáticas del experimento;
cambiar project.state;
cambiar el lifecycle general de Work Items;
borrar Business/Product existentes al cambiar un proyecto a POC.
```

---

## Acceptance criteria

- [ ] **AC-01 — Init Is Sufficient:** `kaddo init --mode poc` deja el proyecto listo para definir y ejecutar la POC sin requerir `kaddo bootstrap`.
- [ ] **AC-02 — POC Artifact:** `poc.md` contiene o soporta Problem, Hypothesis, Expected Value, Scenario, Success Criteria, Constraints, Non-goals, Evidence y Conclusion sin depender de Business/Product.
- [ ] **AC-03 — No Business/Product Requirement:** Business, Product, Capabilities y Roadmap no bloquean route, understand, context ni experiment delivery en POC mode.
- [ ] **AC-04 — Progressive Tech:** Tech knowledge es progresivo; la falta de `current-state.md` o `codebase.md` solo genera una recomendación cuando el contexto técnico realmente es necesario.
- [ ] **AC-05 — POC Next Step:** el flujo recomendado avanza hypothesis → criteria → technical context/resources when relevant → experiment → evidence → conclusion.
- [ ] **AC-06 — Mode Switch:** `kaddo project mode poc` garantiza que exista el artifact POC sin requerir Bootstrap y preserva todo el conocimiento existente.
- [ ] **AC-07 — Bootstrap Isolation:** ejecutar `kaddo bootstrap` en una POC no genera automáticamente Business/Product/Capabilities/Roadmap.
- [ ] **AC-08 — Standard Unchanged:** el comportamiento de `kaddo bootstrap` para `mode=standard` permanece sin cambios.
- [ ] **AC-09 — Understand/Context:** `kaddo understand` y `kaddo context` funcionan inmediatamente sobre una POC recién inicializada.
- [ ] **AC-10 — MCP:** `kaddo://poc` no indica Bootstrap como requisito para obtener el artifact.
- [ ] **AC-11 — Docs:** README y docs EN/ES muestran el nuevo happy path sin Bootstrap.

---

# Validation

## Fresh POC

```bash
mkdir poc-demo
cd poc-demo
kaddo init --mode poc
```

Expected:

```text
.kaddo/config.yml
knowledge/delivery/poc.md
knowledge/delivery/work-items/
```

y el siguiente paso no menciona `kaddo bootstrap`.

Ejecutar:

```bash
kaddo context
kaddo understand
```

Expected:

```text
POC mode recognized
next step = define hypothesis / success criteria
```

sin bloquear por ausencia de Business/Product.

---

## Existing Project

```bash
kaddo project mode poc
```

Expected:

```text
mode changed to poc
knowledge/delivery/poc.md exists
existing knowledge preserved
no bootstrap required
```

---

## Explicit Bootstrap in POC

```bash
kaddo bootstrap
```

Expected:

```text
business/business.md          NOT created
product/product.md            NOT created
product/capabilities.md       NOT created
delivery/roadmap.md           NOT created
```

y no se pierde ningún artifact existente.

---

## Experiment Flow

Completar hypothesis y criteria, luego:

```bash
kaddo create spike
```

Expected route:

```text
experiment Work Item
↓
implementation/evidence
↓
evaluation
↓
conclusion
```

sin insertar pasos de Product/Business.

---

## Graduation

```bash
kaddo project mode standard
```

Expected:

```text
poc.md preserved
WIs preserved
evidence preserved
Resources preserved
```

y solo entonces puede recomendarse el baseline estándar si falta.

---

# Definition of Done

El WI está completo cuando:

- una POC recién inicializada no necesita Bootstrap;
- `poc.md` concentra el contexto mínimo del experimento;
- Business/Product/Capabilities/Roadmap dejan de ser requisitos del modo POC;
- Tech se incorpora progresivamente y con propósito;
- `project mode poc` crea/garantiza el artifact POC;
- route y next-step siguen el lifecycle experimental;
- context/understand funcionan sin baseline product-oriented;
- MCP no recomienda Bootstrap para POC;
- Bootstrap estándar permanece intacto;
- cambiar de POC a Standard preserva todo el conocimiento obtenido;
- tests cubren fresh POC, existing-project transition, bootstrap isolation y graduation;
- README y docs EN/ES reflejan el flujo corregido.

---

# Implementation Handoff Guidance

Partir de la implementación de POC entregada en WI-041 y simplificarla; no rediseñar `project.mode`.

Puntos principales actualmente existentes:

```text
packages/cli/src/commands/init.ts
→ ya crea poc.md durante init

packages/cli/src/commands/bootstrap.ts
→ POC_FILE_TARGETS todavía incluye Business + Product + Tech + POC

packages/cli/src/core/next-step.ts
→ ya tiene lógica POC dedicada

packages/cli/src/core/project-route.ts
→ route POC existente

packages/cli/src/core/understand.ts
→ flow POC ya prioriza architecture-agent + work-item-agent

packages/cli/src/core/context-pack.ts
→ incluye mode/POC context

packages/mcp/src/resources.ts
→ kaddo://poc todavía referencia bootstrap en el missing hint

apps/docs/.../poc-mode.md
README.md
→ todavía muestran bootstrap dentro del flujo POC
```

La simplificación esperada es:

```text
BEFORE

init --mode poc
↓
poc.md
↓
bootstrap
↓
Business + Product + Tech
↓
experiment


AFTER

init --mode poc
↓
poc.md
↓
hypothesis + success criteria
↓
Tech only when useful
↓
Resources when relevant
↓
experiment
↓
evidence
↓
conclusion
```

Mantener como principio rector:

> **Una POC existe para reducir incertidumbre, no para anticipar la documentación de un producto que todavía no sabemos si debe existir.**

## Refinement

### Current behavior verified

- `kaddo init --mode poc` already creates `knowledge/delivery/poc.md`, but its single-repository
  guidance still directs the user to run `kaddo bootstrap`.
- `bootstrap()` selects `POC_FILE_TARGETS`, which currently writes Business, Product, Codebase,
  Current State, and POC artifacts. This conflicts with the proportional POC baseline.
- The POC project route includes the standard `bootstrapBaseline` step, and `resolveNextStep()`
  recommends Bootstrap whenever `poc.md` is missing.
- `kaddo project mode poc` only updates configuration; it does not ensure `poc.md` exists.
- `README.md`, EN/ES POC docs, and the MCP missing-artifact message still present Bootstrap as a
  POC prerequisite.

### Target journey

1. A new POC runs `kaddo init --mode poc` and receives configuration, `poc.md`, and the Work Item
   directory.
2. The user records Problem, Hypothesis, Expected Value, Scenario, and Success Criteria in
   `poc.md`; no Business/Product baseline is requested.
3. `kaddo context` and `kaddo understand` recommend only the next evidence-relevant action.
4. Technical documentation, scan, and Project Resources enter the path only when the experiment
   requires them.
5. The user creates a `spike`, gathers evidence, and records a conclusion.
6. Switching back to `standard` preserves all POC knowledge and may then recommend the standard
   baseline.

### Technical approach

1. Extract or reuse the canonical POC template so `init` and `project mode poc` can ensure
   `knowledge/delivery/poc.md` without routing through Bootstrap.
2. Make `kaddo bootstrap` in POC mode an informative no-op after ensuring only safe POC structure;
   it must never create Business, Product, Capabilities, Roadmap, or empty Tech artifacts.
3. Replace the POC route's standard bootstrap step with an explicit missing-POC-artifact step.
   Keep Hypothesis and Success Criteria as the first normal recommendations.
4. Update POC next-step, context pack, and understand output so missing Business/Product/roadmap
   is not a gap, and missing Tech is advisory only where existing-code signals justify it.
5. Update the MCP missing-artifact message, README, and EN/ES docs to remove Bootstrap from the
   POC happy path.

### Design decisions

- **Bootstrap behavior:** use an informative no-op for POC mode. This is safest because `init` and
  mode switching own POC artifact creation, and an explicit Bootstrap command cannot accidentally
  expand the experiment into a product baseline.
- **Mode switching:** switching to `poc` must create only a missing `poc.md`; it must not alter or
  remove existing knowledge.
- **Technical context:** do not infer that every POC requires codebase documentation. Existing-code
  and external-resource signals can recommend technical work, but no empty artifact is a gate.

### Affected and reviewed areas

Affected: CLI initialization, project-mode mutation, bootstrap behavior, POC route and next-step
resolver, POC template/parser, context/understand projections, MCP resource messaging, README,
EN/ES docs, and focused CLI/MCP tests.

Reviewed, not expected to change: Admin UI/API (they already expose the shared mode field), Work
Item lifecycle, Project Resources execution, project state taxonomy, and the standard bootstrap
path.

### Validation plan

- Fresh POC: initialize in a temporary directory, assert no standard Business/Product/Roadmap
  artifacts exist, then run `context` and `understand` and assert the first step is hypothesis.
- Existing project: change a standard fixture to POC, assert `poc.md` is created and its existing
  knowledge remains untouched.
- Explicit bootstrap: run it in a POC fixture, assert it creates no product-oriented or empty Tech
  artifacts and emits the informative outcome.
- Graduation: switch POC to standard and assert POC artifact, Work Items, resources, and technical
  knowledge remain; standard baseline recommendations resume only in standard mode.
- MCP/context/route: assert no Bootstrap prerequisite in the POC missing-artifact guidance and no
  Business/Product completeness finding for a fresh POC.
- Regression: run focused CLI/MCP tests plus the standard bootstrap suite, package builds, docs
  build, README synchronization, agent-plugin synchronization, and staged Guard.

### Implementation handoff

Implement the smallest shared helper for ensuring the POC artifact, then update its projections in
CLI/Core/MCP/docs. Do not redesign `project.mode`, change Work Item lifecycle, or broaden standard
bootstrap behavior. Preserve every existing artifact when changing modes.
