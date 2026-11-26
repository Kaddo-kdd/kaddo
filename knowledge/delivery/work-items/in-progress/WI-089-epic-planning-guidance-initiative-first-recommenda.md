---
type: feature
id: WI-089
title: >-
  Epic Planning Guidance — Initiative-First Recommendations Across CLI, MCP &
  Admin
status: in-progress
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
