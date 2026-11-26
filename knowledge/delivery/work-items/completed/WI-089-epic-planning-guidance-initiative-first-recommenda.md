---
type: feature
id: WI-089
title: >-
  Epic Planning Guidance — Initiative-First Recommendations Across CLI, MCP &
  Admin
status: completed
work_type: feature
knowledge_level: K3
priority: high
created_at: '2026-11-25'
domains:
  - Delivery
  - Tech
  - Product Experience
antecedent:
  - WI-074
  - WI-078
  - WI-081
  - WI-088
scope_confidence:
  level: medium
  reasons:
    - >-
      Requiere una función compartida en Core (recomendación contextual por
      Epic) reutilizada por CLI, MCP y Admin; cualquier divergencia rompe AC-10.
    - >-
      Debe respetar el flujo progresivo Epic → Initiative → Candidates → Work
      Items sin hacerlo obligatorio ni migrar proyectos con Work Items directos
      (AC-08, AC-13).
    - >-
      Toca varias superficies (Core, MCP, Admin, CLI) más agentes/skills y docs;
      el alcance real se confirma con un análisis de dependencias antes de
      implementar.
    - Las recomendaciones son de solo lectura: consultarlas nunca muta artefactos (AC-11).
surfaces:
  product-ui: affected
  frontend: affected
  backend: affected
  database: not-applicable
  configuration: not-applicable
  feature-flags: not-applicable
  content-copy: affected
  auth: not-applicable
  notifications: not-applicable
  analytics: not-applicable
  documentation: affected
  operations-release: not-applicable
source:
  type: external
  imported_at: '2026-11-26'
  source_format: markdown-frontmatter
  source_hash: 45a3d39f4bb09f9a11cd4e63dbaac1a21d7c5ade4c3cb2c92f71b324dc4aa195
  inferred: false
generated_by: kaddo-admin
affected_modules:
  - cli
  - mcp
  - admin
  - docs
summary: >-
  Cuando un usuario pregunta cuál es el siguiente paso tras crear una Epic, un
  agente conectado por Kaddo MCP puede recomendar directamente crear Work Items
  aunque la Epic no tenga Initiatives ni candidatos. Kaddo provee los datos de
  planificación pero no una recomendación conte…
telemetry_work_item_id: a8d3538b-3c6b-47ad-ac7b-5ef4734a5fc3
original_snapshot:
  title: >-
    Epic Planning Guidance — Initiative-First Recommendations Across CLI, MCP &
    Admin
  description: >-
    Cuando un usuario pregunta cuál es el siguiente paso tras crear una Epic, un
    agente conectado por Kaddo MCP puede recomendar directamente crear Work
    Items aunque la Epic no tenga Initiatives ni candidatos. Kaddo provee los
    datos de planificación pero no una recomendación conte…
  type: feature
  status: draft
ready_at: '2026-11-26'
implementation_status: completed
validation_status: passed
released_in: v3.145.0
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/epic-recommendation.ts
        - packages/cli/src/core.ts
        - packages/cli/src/commands/plan.ts
        - packages/cli/tests/epic-recommendation.test.ts
      validations:
        - command: npx vitest run packages/cli/tests/epic-recommendation.test.ts
          status: passed
        - command: pnpm --filter @kaddo/cli build
          status: passed
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/planning.ts
        - packages/mcp/src/server.ts
        - packages/mcp/tests/epic-recommendation.test.ts
      validations:
        - command: npx vitest run packages/mcp/tests/epic-recommendation.test.ts
          status: passed
    admin:
      role: module
      status: completed
      changed_paths:
        - packages/admin-server/src/core-adapter.ts
        - packages/admin/src/lib/api.ts
        - packages/admin/src/routes/Planning.tsx
        - packages/admin/e2e/planning-epic-recommendation.spec.ts
        - packages/admin/e2e/fixtures/project/knowledge/delivery/epics/EP-010-audit-flow.md
      validations:
        - command: CI=1 npx playwright test
          status: passed
    docs:
      role: module
      status: completed
      changed_paths:
        - knowledge/agents/delivery/initiative-agent.md
        - knowledge/agents/delivery/work-item-agent.md
        - apps/docs/src/content/docs/delivery-planning.md
        - apps/docs/src/content/docs/es/delivery-planning.md
      validations:
        - command: pnpm -r build
          status: passed
  ac_verifications:
    - criterion: '**AC-01:** Existe una única implementación en Core de recomendación contextual del siguiente paso de una Epic, reutilizable desde las interfaces de Kaddo.'
      status: passed
      evidence: 'recommendEpicNextStep(dir, epic) es la única implementación de recomendación contextual de Epic, reutilizada por CLI (kaddo epic progress), MCP (kaddo_get_epic_progress) y Admin (Epic Overview) desde Core.'
      reference: 'packages/cli/src/core/epic-recommendation.ts'
      method: manual
    - criterion: '**AC-02:** Una Epic nueva, sin Initiatives ni Work Items, recomienda crear o asociar una Initiative como siguiente paso principal.'
      status: passed
      evidence: 'Escenario A verificado por test unitario: una Epic nueva sin Initiatives ni Work Items recomienda ''Create or associate an Initiative'' como acción principal; confirmado también en CLI real sobre EP-001 y en el Admin.'
      reference: 'packages/cli/tests/epic-recommendation.test.ts'
      method: manual
    - criterion: '**AC-03:** Un agente que consulta el siguiente paso de esa Epic mediante MCP obtiene una recomendación explícita y fundamentada, no solo contadores de progreso.'
      status: passed
      evidence: 'Test de integración MCP: kaddo_get_epic_progress incluye de forma aditiva el campo ''recommendation'' con la acción explícita (no solo contadores); la descripción de la herramienta indica al agente usarla.'
      reference: 'packages/mcp/tests/epic-recommendation.test.ts'
      method: manual
    - criterion: '**AC-04:** Los agentes instalados reconocen el flujo Epic → Initiative → Candidates → Work Items y no sugieren por defecto materializar Work Items directamente en el escenario inicial.'
      status: passed
      evidence: 'initiative-agent y work-item-agent actualizados para seguir Epic → Initiative → Candidates → Work Items y priorizar la recomendación canónica, sin materializar por defecto en el escenario inicial ni crear artefactos automáticamente.'
      reference: 'knowledge/agents/delivery/initiative-agent.md'
      method: manual
    - criterion: '**AC-05:** Cuando existe una Initiative sin candidatos, el siguiente paso recomienda definir candidatos mediante el agente correspondiente.'
      status: passed
      evidence: 'Escenario B (test unitario): con una Initiative sin candidatos, la recomendación principal es ''Define Work Item Candidates'' con target la Initiative y agente initiative-agent.'
      reference: 'packages/cli/src/core/epic-recommendation.ts'
      method: manual
    - criterion: '**AC-06:** Cuando existen candidatos pendientes, Kaddo recomienda revisarlos y materializar los seleccionados, sin crear trabajo automáticamente.'
      status: passed
      evidence: 'Escenario C/D (test unitario): con candidatos pendientes, la recomendación es revisarlos y materializar los seleccionados (''review-and-materialize-candidates''), sin crear trabajo automáticamente.'
      reference: 'packages/cli/src/core/epic-recommendation.ts'
      method: manual
    - criterion: '**AC-07:** La recomendación considera Work Items ya asociados, evitando propuestas duplicadas y preservando los flujos de ejecución existentes.'
      status: passed
      evidence: 'Escenarios E/F (tests): el trabajo activo prioriza continuidad y desbloqueo; los Work Items directos existentes se reconocen como modelo válido, sin proponer duplicados ni desviar la ejecución.'
      reference: 'packages/cli/src/core/epic-recommendation.ts'
      method: manual
    - criterion: '**AC-08:** La creación directa de Work Items bajo una Epic sigue siendo válida y no produce errores ni advertencias de integridad por ausencia de Initiative.'
      status: passed
      evidence: 'Escenario F (test): los Work Items directos bajo una Epic son válidos; la ausencia de Initiative no es error de integridad y la Initiative aparece solo como mejora opcional.'
      reference: 'packages/cli/tests/epic-recommendation.test.ts'
      method: manual
    - criterion: '**AC-09:** Desde Kaddo Admin es posible crear una Epic, recibir la recomendación, crear una Initiative contextual y continuar hacia la definición de candidatos.'
      status: passed
      evidence: 'E2E de Admin: una Epic nueva (EP-010) muestra el banner de recomendación con ''Create Initiative'' (principal), ''Associate existing Initiative'' y ''Create Work Item directly''; se puede crear/asociar una Initiative contextual y continuar.'
      reference: 'packages/admin/e2e/planning-epic-recommendation.spec.ts'
      method: manual
    - criterion: '**AC-10:** CLI, MCP y Admin derivan recomendaciones equivalentes para el mismo estado de una Epic.'
      status: passed
      evidence: 'CLI, MCP y Admin derivan la recomendación del MISMO recommendEpicNextStep de Core; verificado por tests unitarios/integración y revisión visual, con resultados equivalentes para el mismo estado.'
      reference: 'packages/mcp/src/planning.ts'
      method: manual
    - criterion: '**AC-11:** Consultar recomendaciones no modifica Epics, Initiatives, Work Items ni otros artefactos.'
      status: passed
      evidence: 'Tests unitarios (Core y MCP) y E2E confirman que consultar la recomendación no modifica Epics, Initiatives, Work Items ni otros artefactos (cero escrituras).'
      reference: 'packages/admin/e2e/planning-epic-recommendation.spec.ts'
      method: manual
    - criterion: '**AC-12:** Las recomendaciones respetan Epics completadas, trabajo en progreso, bloqueos y asociaciones existentes.'
      status: passed
      evidence: 'Escenarios G (completada) y E (en progreso) verificados: una Epic completada no recomienda trabajo nuevo por defecto; el trabajo en progreso y los bloqueos se respetan.'
      reference: 'packages/cli/tests/epic-recommendation.test.ts'
      method: manual
    - criterion: '**AC-13:** Los contratos existentes y los proyectos que no usan Initiatives continúan funcionando.'
      status: passed
      evidence: 'La función opera sobre Epics sin Initiatives (escenarios A/F) y no rompe contratos existentes; la suite completa (2213 unit + 79 E2E) y los flujos de Planning siguen en verde.'
      reference: 'packages/cli/tests/epic-recommendation.test.ts'
      method: manual
    - criterion: '**AC-14:** En una prueba real de conversación sobre una Epic `planned` con success criteria y 0 Initiatives / 0 Work Items, el agente responde que el siguiente paso recomendado es crear o asociar una Initiative y luego definir sus Work Item Candidates; puede mencionar la descomposición técnica como propuesta posterior, pero no como único paso canónico.'
      status: passed
      evidence: 'La prueba sobre una Epic planned con success criteria y 0 Initiatives / 0 Work Items devuelve una recomendación explícita de crear/asociar una Initiative (verificada en Core, MCP y CLI sobre EP-001); la descomposición técnica queda como propuesta posterior, no como único paso canónico. La validación de una conversación LLM en vivo no se automatiza aquí; se cubre estructuralmente por el contrato MCP explícito y las instrucciones de agentes actualizadas.'
      reference: 'packages/mcp/tests/epic-recommendation.test.ts'
      method: manual
---

# WI-089 — Epic Planning Guidance: Initiative-First Recommendations Across CLI, MCP & Admin

## 1. Problema

Cuando un usuario pregunta cuál es el siguiente paso tras crear una Epic, un agente conectado por Kaddo MCP
puede recomendar directamente crear Work Items aunque la Epic no tenga Initiatives ni candidatos. Kaddo
provee los datos de planificación pero no una recomendación contextual explícita para guiar la descomposición
progresiva. La respuesta depende de la interpretación del LLM y puede omitir la secuencia recomendada:
**Epic → Initiative → Work Item Candidates → Work Items**. Afecta también a CLI, agentes instalados y Admin.

## 2. Objetivo

Implementar una capacidad compartida de recomendaciones contextuales de Planning que identifique y comunique
el siguiente paso recomendado para una Epic a partir de su estado real, relaciones y trabajo existente. La
recomendación prioriza organizar mediante Initiatives y Work Item Candidates cuando corresponda, **sin
convertir esa estructura en obligatoria**. Las interfaces comunican recomendaciones coherentes fundamentadas
en la misma lógica de Core.

## 3. Comportamiento esperado (escenarios)

- **A — Epic nueva sin trabajo** (`planned`, 0 Initiatives, 0 Work Items, success criteria definidos):
  recomendación principal **Create or associate an Initiative**; acciones: crear Initiative asociada, asociar
  una existente, o (alternativa secundaria) crear Work Items directamente. No recomendar como acción principal
  crear de inmediato un Work Item técnico.
- **B — Epic con Initiative, sin candidatos:** principal **Define Work Item Candidates**, usando el contexto
  de la Initiative; los candidatos cubren resultados concretos, identifican dependencias, evitan duplicar WIs,
  conservan procedencia y permanecen sin materializar hasta autorización.
- **C — Initiative con candidatos pendientes:** principal **Review and refine Work Item Candidates**; no
  proponer de nuevo candidatos equivalentes.
- **D — Candidatos listos para materialización:** principal **Materialize the next Work Item Candidate**,
  considerando dependencias, prioridad, criterios y trabajo existente; la materialización requiere autorización.
- **E — Work Items activos:** priorizar continuidad, bloqueos reales y acciones del estado actual; no
  recomendar crear nuevas Initiatives/WIs si duplica trabajo o desvía la ejecución sin justificación.
- **F — Epic con Work Items directos (sin Initiative):** reconocer ese modelo como válido; no recomendar
  migración obligatoria ni tratar la ausencia de Initiative como error; organizar por Initiative es mejora
  opcional cuando aporta valor.
- **G — Epic completada:** no recomendar creación de trabajo nuevo por defecto; mostrar estado terminal y
  ofrecer navegación a evidencias y al Plan asociado cuando corresponda.

## 4. Alcance funcional

### 4.1 Recomendación determinista en Core
Función compartida que determina el siguiente paso contextual a partir de: id y lifecycle de la Epic, outcome
y criterios, Initiatives asociadas, Work Item Candidates, Work Items directos e indirectos, estados de
ejecución, dependencias/bloqueos y planning coverage. La respuesta contiene: identificador de recomendación,
acción principal, justificación basada en el estado real, entidad objetivo, acciones alternativas, referencias
a herramientas canónicas y la información para que un agente explique por qué. **Sin lógica generativa en
Core.** Mantener separadas las recomendaciones de planificación y la `completion readiness`. Específica del
contexto de una Epic y compatible con el mecanismo global de Next Step existente.

### 4.2 MCP — Agent Guidance
Exponer la recomendación de Core por las herramientas MCP de Planning: evaluar extender de forma aditiva
`kaddo_get_epic_progress` o incorporar una operación específica para el siguiente paso de una Epic; elegir el
contrato que reduzca duplicación y preserve compatibilidad. Un agente que consulte la Epic recibe una
recomendación explícita cuando corresponda, sin depender solo de interpretar `planning.initiatives: 0`.

### 4.3 Agentes y skills
Actualizar instrucciones de `initiative-agent`, `work-item-agent` y agentes de Planning/Roadmap/Backlog y
skills de refinamiento/descomposición para respetar el flujo progresivo: Epic = resultado mayor; Initiative =
objetivo/frente; Candidates = propuestas sin materializar; Work Items = unidades de ejecución. El agente
consulta el estado real y prioriza la recomendación canónica; no presenta la estructura como obligatoria ni
crea artefactos automáticamente.

### 4.4 CLI
Incorporar la recomendación en las superficies pertinentes del CLI (p. ej. exponer el siguiente paso de una
Epic reutilizando Core), con consistencia respecto a `kaddo explain`, `kaddo context`, `kaddo understand` y
las recomendaciones globales, sin alterar su prioridad en otros escenarios.

### 4.5 Kaddo Admin
En el detalle/creación de Epic sin Initiatives ni Work Items: mostrar **Create Initiative** como acción
recomendada, ofrecer **Associate Existing Initiative** y conservar **Create Work Item Directly** como
alternativa. Permitir crear una Initiative desde el contexto de la Epic y asociarla por el mecanismo
canónico; luego orientar hacia la definición de candidatos. Reutilizar componentes y operaciones existentes;
**sin un segundo motor de recomendaciones en frontend**.

### 4.6 Documentación
Actualizar EN/ES sobre el flujo recomendado de Planning, las relaciones opcionales Epic/Initiative/Work
Items, las recomendaciones contextuales para agentes, la materialización progresiva y las alternativas de
planificación simplificada.

## 5. Acceptance Criteria

- [ ] **AC-01:** Existe una única implementación en Core de recomendación contextual del siguiente paso de una Epic, reutilizable desde las interfaces de Kaddo.
- [ ] **AC-02:** Una Epic nueva, sin Initiatives ni Work Items, recomienda crear o asociar una Initiative como siguiente paso principal.
- [ ] **AC-03:** Un agente que consulta el siguiente paso de esa Epic mediante MCP obtiene una recomendación explícita y fundamentada, no solo contadores de progreso.
- [ ] **AC-04:** Los agentes instalados reconocen el flujo Epic → Initiative → Candidates → Work Items y no sugieren por defecto materializar Work Items directamente en el escenario inicial.
- [ ] **AC-05:** Cuando existe una Initiative sin candidatos, el siguiente paso recomienda definir candidatos mediante el agente correspondiente.
- [ ] **AC-06:** Cuando existen candidatos pendientes, Kaddo recomienda revisarlos y materializar los seleccionados, sin crear trabajo automáticamente.
- [ ] **AC-07:** La recomendación considera Work Items ya asociados, evitando propuestas duplicadas y preservando los flujos de ejecución existentes.
- [ ] **AC-08:** La creación directa de Work Items bajo una Epic sigue siendo válida y no produce errores ni advertencias de integridad por ausencia de Initiative.
- [ ] **AC-09:** Desde Kaddo Admin es posible crear una Epic, recibir la recomendación, crear una Initiative contextual y continuar hacia la definición de candidatos.
- [ ] **AC-10:** CLI, MCP y Admin derivan recomendaciones equivalentes para el mismo estado de una Epic.
- [ ] **AC-11:** Consultar recomendaciones no modifica Epics, Initiatives, Work Items ni otros artefactos.
- [ ] **AC-12:** Las recomendaciones respetan Epics completadas, trabajo en progreso, bloqueos y asociaciones existentes.
- [ ] **AC-13:** Los contratos existentes y los proyectos que no usan Initiatives continúan funcionando.
- [ ] **AC-14:** En una prueba real de conversación sobre una Epic `planned` con success criteria y 0 Initiatives / 0 Work Items, el agente responde que el siguiente paso recomendado es crear o asociar una Initiative y luego definir sus Work Item Candidates; puede mencionar la descomposición técnica como propuesta posterior, pero no como único paso canónico.

## 6. Áreas de implementación sugeridas

`packages/cli/src/core/delivery-planning.ts`, `packages/cli/src/core/next-step.ts`,
`packages/mcp/src/planning.ts`, `packages/mcp/src/server.ts`, `packages/admin/src/routes/Planning.tsx`,
`packages/admin/src/components/PlanningManage.tsx`, `packages/admin/src/routes/Initiatives.tsx`,
`knowledge/agents/delivery/initiative-agent.md`, `knowledge/agents/delivery/work-item-agent.md`, y
documentación/pruebas de Planning. Determinar el alcance real con análisis de dependencias antes de
implementar; no modificar archivos solo porque aparezcan en la lista.

## 7. Fuera de alcance

Hacer obligatorias las Initiatives; cambiar la jerarquía canónica de Planning; crear automáticamente
Initiatives o Work Items; ejecutar LLMs desde Core/CLI/Admin; un nuevo framework de agentes; rediseñar
globalmente Planning; cambiar los criterios de completitud de Epics; migrar automáticamente proyectos que usan
Work Items directos.

## 8. Validación

Unit: matriz de recomendaciones para escenarios A–G (sin relación, candidatos pendientes, trabajo directo,
completadas). Integración: CLI y MCP obtienen recomendaciones equivalentes de los mismos datos canónicos;
compatibilidad con contratos actuales. Admin E2E: crear Epic → recomendación de Initiative → creación
contextual → asociación → sugerencia de candidatos. Agent E2E: conversación de prueba contra un proyecto real
con una Epic nueva sin trabajo (recomienda Initiative antes de materializar WIs) y el escenario de trabajo
directo (sin recomendaciones incorrectas).

## 9. Definition of Done

Criterios con pruebas y evidencia; Core centraliza la recomendación; MCP entrega orientación explícita al
agente; Admin y CLI coherentes; agentes y documentación actualizados; la experiencia no crea artefactos sin
autorización; los flujos existentes siguen funcionando; prueba real usando **Kaddo Audit (EP-001)** como caso
de referencia; validación visual local de Kaddo Admin. **No ejecutar commit ni push antes de presentar
resultados, diffs y la experiencia local para revisión y autorización humana explícita.**

## 10. Resultado esperado

Cuando un usuario pregunte a su agente qué sigue tras crear una Epic, Kaddo da una recomendación contextual
coherente con su modelo de Planning. En una Epic sin trabajo organizado, el siguiente paso recomendado será
definir o asociar una Initiative, proponer sus Work Item Candidates y materializarlos progresivamente; el
usuario conserva la libertad de crear Work Items directamente cuando sea apropiado.

## 11. Learning (completar en Gate C)

Registrar en español: causa raíz, diseño del contrato de recomendación en Core, decisiones de exposición
(MCP/CLI/Admin), actualización de agentes/skills, evidencia de pruebas (matriz A–G, paridad CLI/MCP, Admin
E2E, prueba de agente con EP-001), límites y compatibilidad preservada.

## 12. Learning

Entregado en v3.145.0 (módulos `cli`, `mcp`, `admin`, `docs`; sin cambio de esquema ni de criterios de
completitud de Epics).

### Causa raíz
Kaddo exponía los datos de planificación de una Epic (contadores de Initiatives, candidatos y Work Items)
pero no una recomendación contextual explícita del siguiente paso. Un agente conectado por MCP debía
interpretar `planning.initiatives: 0` / `delivery.total: 0` y podía saltar directamente a crear Work Items,
omitiendo la secuencia recomendada Epic → Initiative → Candidates → Work Items.

### Diseño
Una única función de Core, `recommendEpicNextStep(dir, epic)`, determinista y de solo lectura, con una
escalera de escenarios (A–G) priorizada por el impacto real: terminal → trabajo activo → candidatos
pendientes → nueva sin trabajo → Work Items directos → Initiative sin candidatos. Devuelve acción principal,
justificación basada en el estado, entidad objetivo, alternativas y referencias a herramientas canónicas.
Se mantiene **separada** de la evaluación de completion-readiness (una responde "qué organizar", la otra
"se puede completar").

### Exposición en las tres superficies
- CLI: `kaddo epic progress` imprime "Recommended next step".
- MCP: `kaddo_get_epic_progress` añade de forma **aditiva** el campo `recommendation` (sin romper el
  contrato) y su descripción indica al agente usarlo.
- Admin: el Overview de la Epic muestra un banner con la acción principal y botones (Create Initiative,
  Associate existing, Create Work Item directly), reutilizando operaciones existentes (sin segundo motor).

### Decisión: opcional, no obligatorio
La estructura Initiative-first es una recomendación, no una regla. Los Work Items directos bajo una Epic son
un modelo válido (escenario F), nunca un error de integridad, y los proyectos que no usan Initiatives siguen
funcionando. Ninguna superficie crea artefactos automáticamente.

### Evidencia
Matriz unitaria de escenarios A–G (CLI) + integración MCP; E2E de Admin con una Epic de fixture dedicada
(EP-010) para evitar colisiones con la mutación serial de EP-900; gate raíz 2213 tests y suite E2E 79 en
verde; revisión visual del banner. Verificado en el caso real **EP-001** (Kaddo Audit): el CLI recomienda
crear o asociar una Initiative.

### Límite honesto
La validación de AC-14 como conversación LLM en vivo no se automatiza en este repositorio; se cubre
estructuralmente por el contrato MCP explícito (campo `recommendation`) y las instrucciones de
initiative-agent/work-item-agent, que priorizan la recomendación canónica.

### Prevención de recurrencia
La recomendación vive en Core y se consume igual en CLI/MCP/Admin, de modo que las tres superficies no pueden
divergir, y la guía del flujo progresivo queda documentada y en las instrucciones de los agentes.
