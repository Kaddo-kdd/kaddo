---
type: feature
id: WI-070
title: >-
  Incorporar Knowledge Consolidation para optimizar, conectar y refinar el
  conocimiento de Kaddo
status: completed
completed_at: '2026-10-31'
released_in: v3.129.0
work_type: feature
created_at: '2026-10-31'
source:
  type: external
  imported_at: '2026-10-31'
  source_format: markdown-frontmatter
  source_hash: 9bef08741048adf9855391735d61d55212631c9e6d572298d7abd5b6ce0c4759
  inferred: false
generated_by: kaddo-admin
knowledge_level: K3
domains:
  - Product
  - Tech
  - Delivery
affected_modules:
  - cli
  - mcp
  - docs
implementation_status: completed
validation_status: passed
implementation_evidence:
  repositories:
    cli:
      role: core
      status: completed
      changed_paths:
        - packages/cli/src/core/knowledge-consolidation.ts
        - packages/cli/src/commands/knowledge.ts
        - packages/cli/src/index.ts
        - packages/cli/src/core.ts
        - packages/cli/src/skills/skills.ts
        - packages/cli/src/agents/prompts.ts
        - packages/cli/src/agents/groups.ts
        - packages/cli/src/agents/responsibility.ts
        - packages/cli/tests/knowledge-consolidation.test.ts
        - packages/cli/tests/skills.test.ts
      validations:
        - command: >-
            pnpm exec vitest run
            packages/cli/tests/knowledge-consolidation.test.ts
          status: passed
          reason: >-
            10 verdes: Scenario 5 (sin oportunidades inventadas), aprendizaje
            tipo regla como candidato suggested, referencia de decisión colgante
            como observed, redundancia solo en capas canónicas (WIs con
            plantilla no), idempotencia, staleness por fingerprint y no-fuga de
            secretos en evidencia.
    mcp:
      role: module
      status: completed
      changed_paths:
        - packages/mcp/src/generate.ts
        - packages/mcp/src/server.ts
        - packages/mcp/src/resources.ts
        - packages/mcp/src/project.ts
        - packages/mcp/tests/generate.test.ts
      validations:
        - command: pnpm exec vitest run packages/mcp/tests/generate.test.ts
          status: passed
          reason: >-
            kaddo_generate_consolidation_plan escribe el plan bajo .kaddo/ sin
            tocar knowledge/, rechaza layer desconocido, y el allowlist de
            escritura derivada admite consolidation-plan.{md,json}.
    docs:
      role: module
      status: completed
      changed_paths:
        - apps/docs/src/content/docs/knowledge-consolidation.md
        - apps/docs/src/content/docs/es/knowledge-consolidation.md
        - apps/docs/astro.config.mjs
      validations:
        - command: pnpm --filter @kaddo/docs build
          status: passed
          reason: '259 páginas construidas (EN/ES nuevas), sin errores.'
scope_confidence:
  level: medium
  reasons:
    - >-
      Reutiliza fundaciones Core ya existentes (knowledge-discovery,
      artifact-quality, graph, graph-hints, reporting-evidence,
      work-items/learning), lo que acota el riesgo del análisis determinístico.
    - >-
      El punto abierto principal es la frontera determinístico/semántico y la
      nomenclatura del comando CLI; ambos resueltos en la refinación.
    - >-
      La capa semántica queda como skill + agente (instrucciones), no como
      código que invoque un LLM, lo que mantiene el alcance de ingeniería
      contenido.
summary: >-
  Kaddo permite capturar, estructurar y relacionar conocimiento mediante
  artifacts canónicos, Work Items, Initiatives, Project Resources, Knowledge
  Graph, Knowledge Capsules y mecanismos de aprendizaje y verificación.
original_snapshot:
  title: >-
    Incorporar Knowledge Consolidation para optimizar, conectar y refinar el
    conocimiento de Kaddo
  description: >-
    Kaddo permite capturar, estructurar y relacionar conocimiento mediante
    artifacts canónicos, Work Items, Initiatives, Project Resources, Knowledge
    Graph, Knowledge Capsules y mecanismos de aprendizaje y verificación.
  type: feature
  status: draft
ready_at: '2026-10-31'
verified_at: '2026-10-31'
---

# Incorporar Knowledge Consolidation para optimizar, conectar y refinar el conocimiento de Kaddo

## Intent

Kaddo permite capturar, estructurar y relacionar conocimiento mediante artifacts canónicos, Work Items, Initiatives, Project Resources, Knowledge Graph, Knowledge Capsules y mecanismos de aprendizaje y verificación.

A medida que un proyecto evoluciona, el conocimiento puede acumular problemas que no necesariamente representan errores individuales:

- Información repetida en diferentes artifacts.
- Decisiones documentadas en Work Items que no se reflejan en el conocimiento vigente.
- Aprendizajes relevantes que permanecen únicamente en el historial de delivery.
- Conceptos documentados en diferentes lugares sin relaciones explícitas.
- Información que cambió, pero cuya documentación anterior todavía existe.
- Secciones excesivamente extensas o difíciles de consumir.
- Conocimiento fragmentado que requiere consultar demasiados archivos.
- Referencias y relaciones que necesitan revisión.
- Conocimiento histórico mezclado con información actualmente aplicable.

Los mecanismos actuales de Kaddo ayudan a detectar algunos de estos problemas, pero no existe un flujo unificado para evaluar periódicamente la organización y coherencia del conocimiento y proponer cómo mejorarlo.

Se propone introducir **Knowledge Consolidation**, una capacidad inspirada conceptualmente en comandos como `/compact`, pero orientada al conocimiento persistente del proyecto y no al contexto temporal de una conversación.

El objetivo no es producir resúmenes indiscriminados, sino conseguir que el conocimiento sea más preciso, conectado, consistente, reutilizable y fácil de recuperar.

---

## Goal

Permitir que un desarrollador o agente solicite una revisión de consolidación para responder:

1. ¿Qué conocimiento relevante hemos acumulado?
2. ¿Qué aprendizajes todavía no se incorporaron al conocimiento vigente?
3. ¿Qué información está duplicada o innecesariamente fragmentada?
4. ¿Qué conceptos podrían relacionarse mejor?
5. ¿Qué documentos contienen información potencialmente desactualizada o contradictoria?
6. ¿Qué debería consolidarse, refinarse, relacionarse o conservarse?
7. ¿Qué cambios concretos se recomiendan y qué evidencia los respalda?

La capacidad debe ofrecer recomendaciones verificables, sin sustituir el criterio humano ni alterar automáticamente los artifacts canónicos.

---

## Refinement (work-item-refinement)

> Sección añadida en refinación. Fundamentada contra el código real; no reemplaza el intent original.

### Actor y outcome

- **Actor:** un desarrollador o un agente de conocimiento.
- **Current behavior:** Kaddo detecta señales sueltas de calidad y relación (`kaddo graph` + graph-hints, `artifact-quality`, `guard`, `drift`, `understand`), pero no existe un flujo único que evalúe la *organización y coherencia global* del conocimiento y proponga mejoras revisables.
- **Target behavior:** existe `kaddo knowledge consolidate` (y su equivalente MCP) que produce un **Consolidation Plan** derivado y revisable, separando hechos determinísticos de interpretaciones semánticas sugeridas, sin tocar los artifacts canónicos.
- **Observable completion:** ejecutar el comando sobre el propio Kaddo genera `.kaddo/consolidation-plan.md` + `.json` con oportunidades clasificadas, cada una con fuente, evidencia, destino sugerido, acción y estado de confianza; `git status` de `knowledge/` permanece limpio tras el análisis.

### Decisiones de diseño tomadas en refinación

1. **Superficie CLI:** se introduce un grupo de comando nuevo `kaddo knowledge consolidate` con `--layer <business|product|tech|delivery>`, `--module <id>` y `--scope <all>`. Se valida contra el CLI actual: no existe hoy un top-level `knowledge`, así que se crea siguiendo el patrón de `graph export` / `topology validate` (grupo + subcomando, acción read-only que escribe solo bajo `.kaddo/`).
2. **Fundación determinística en Core:** un módulo dedicado `packages/cli/src/core/knowledge-consolidation.ts` que **reutiliza** sin duplicar: `knowledge-discovery.ts` (capas y madurez), `artifact-quality.ts` (`analyzeKnowledgeArtifact`), `graph.ts` (`buildGraph`), `graph-hints.ts` (`buildGraphHints`), `reporting-evidence.ts` (vocabulario `EvidenceKind`: `observed|derived|estimated|projected|unknown` y `ReportFinding`), y `work-items.ts` (completed WIs + learning). No se introduce otro parser de artifacts.
3. **Frontera determinístico/semántico:** Core **nunca** declara duplicado semántico, contradicción implícita ni equivalencia de decisiones como hecho determinístico. Esas categorías se emiten como `classification: suggested` / `confidence: requires-review` y como *candidatos* para la capa semántica. El vocabulario `Observed/Derived/Suggested/Unknown` del intent se mapea sobre el `EvidenceKind` ya existente de `reporting-evidence.ts`.
4. **Capa semántica = skill + agente (instrucciones, no código):** se añade la skill `knowledge-consolidation` en `packages/cli/src/skills/skills.ts` (grupo `delivery`) y se registra el agente `knowledge-consolidation-agent` en `packages/cli/src/agents/responsibility.ts`. Ningún código de Core/CLI invoca un LLM.
5. **Salida derivada, no canónica:** el plan vive bajo `.kaddo/` (allowlist de escritura derivada en `packages/mcp/src/project.ts`), nunca una segunda fuente de verdad.

### Entry points reales (verificados)

```text
packages/cli/src/index.ts                      # registrar el grupo `knowledge` + subcomando `consolidate`
packages/cli/src/commands/knowledge.ts         # NUEVO — runKnowledgeConsolidate (patrón de commands/graph.ts)
packages/cli/src/core/knowledge-consolidation.ts  # NUEVO — modelo + análisis determinístico + render md/json
packages/cli/src/core/knowledge-discovery.ts   # reutilizar discoverLayers / LayerStatus
packages/cli/src/core/artifact-quality.ts      # reutilizar analyzeKnowledgeArtifact
packages/cli/src/core/graph.ts                 # reutilizar buildGraph / KnowledgeGraph
packages/cli/src/core/graph-hints.ts           # reutilizar buildGraphHints / GraphHint
packages/cli/src/core/reporting-evidence.ts    # reutilizar EvidenceKind / ReportFinding
packages/cli/src/core/work-items.ts            # reutilizar getWorkItems / learning de completed WIs
packages/mcp/src/generate.ts                   # NUEVO tool kaddo_generate_consolidation_plan (patrón generate*)
packages/mcp/src/server.ts                     # registrar el/los tool(s) MCP
packages/mcp/src/project.ts                    # confirmar allowlist derivada para .kaddo/consolidation-plan.*
packages/cli/src/skills/skills.ts              # NUEVO skill knowledge-consolidation (SKILLS + SKILL_GROUPS)
packages/cli/src/agents/responsibility.ts      # NUEVO knowledge-consolidation-agent
apps/docs/src/content/docs/knowledge-consolidation.md        # NUEVO (EN)
apps/docs/src/content/docs/es/knowledge-consolidation.md     # NUEVO (ES)
```

### Surface review

| Surface | Estado |
|---|---|
| Product / intent de producto | afectado — nueva capacidad y lenguaje KDD |
| CLI | afectado — nuevo grupo `knowledge consolidate` |
| Core (análisis determinístico) | afectado — módulo nuevo, reutiliza fuentes |
| MCP | afectado — tool(s) de generación read-only |
| Agents / Skills | afectado — skill + agente (instrucciones) |
| Documentación EN/ES | afectado — página nueva |
| Admin UI | no afectado (fuera de alcance; evolución futura) |
| Backend/DB/red externa | no aplica — Kaddo no se conecta a nada |
| Project Resources | revisado, no afectado — el análisis solo **lee** conocimiento; no observa, modifica ni valida un recurso externo, por lo que no se declara `resources:` |
| Auth / notificaciones / analytics | no aplica |

### Module review (multirepo)

El propio repo Kaddo es un monorepo pnpm de paquetes, no un multirepo de módulos de dominio mapeados; el WI debe **respetar** las reglas de aplicabilidad de perfiles (POC/Legacy/Multirepo/Single-repo) en su lógica, pero su implementación vive en los paquetes `cli`, `mcp`, `agents`, `skills`, `docs`.

### Dependencias

- Depende de las fundaciones Core ya liberadas (graph/hints VS-056/VS-060, reporting-evidence, artifact-quality, work-items lifecycle/learning). Todas presentes en `main`.
- No depende de WIs abiertos.

### Open questions (no bloqueantes para el MVP)

- OQ-1: ¿El nombre definitivo del comando es `kaddo knowledge consolidate` o se prefiere un alias más corto? → se adopta `knowledge consolidate` por claridad; alias puede evaluarse después.
- OQ-2: ¿El plan debe incluir un `fingerprint`/revisión por archivo fuente desde el MVP? → sí, mínimo: lista de archivos fuente + hash de contenido, para soportar AC-14 (staleness).
- OQ-3: ¿Un solo tool MCP (`generate_consolidation_plan`) o además uno de consulta? → MVP: un tool de generación derivada; la consulta se hace leyendo el recurso `.kaddo/consolidation-plan.json`.

### Validación (cómo se prueba)

Las secciones **Validation Scenarios**, **Acceptance Criteria**, **Definition of Done** y **Commit Gate** de abajo son el contrato de validación; se mantienen tal cual del intent original. El MVP se valida con tests unitarios de Core (análisis/clasificación/preservación/idempotencia + no-fuga de secretos) y con **dogfooding** real sobre el conocimiento de Kaddo (Scenario 7).

---

# 1. Conceptual Model

Knowledge Consolidation debe funcionar como un proceso de optimización del conocimiento.

Flujo conceptual:

```text
Canonical Knowledge
       |
       +-- Business / Product / Tech / Delivery
       +-- Completed Work Items + Learning
       +-- Decisions / Initiatives / Resources
       +-- Graph + Graph Hints
       +-- Guard + Drift Findings
       +-- Modules / Topology
       |
       v
Knowledge Consolidation Analysis
       |
       +-- Detect potential redundancy
       +-- Identify learning not reflected in current knowledge
       +-- Identify missing relationships
       +-- Find possible inconsistencies
       +-- Review fragmentation
       |
       v
Consolidation Plan
       |
       v
Agent-assisted Semantic Review
       |
       v
Proposed Changes + Evidence
       |
       v
Human Review
       |
       v
Canonical Knowledge Refinement
       |
       v
Validation and Knowledge Reassessment
```

La fase de análisis no debe modificar artifacts.

Las recomendaciones de cambios semánticos deben revisarse antes de aplicarse mediante los flujos existentes.

---

# 2. Relationship with Existing Kaddo Capabilities

La nueva capacidad debe complementar las funcionalidades actuales.

| Capability | Existing Responsibility | Consolidation Responsibility |
|---|---|---|
| `learn` | Registrar aprendizaje de un Work Item | Identificar aprendizajes que deberían incorporarse al conocimiento vigente |
| `guard` | Detectar posibles inconsistencias relacionadas con cambios | Utilizar findings como evidencia de revisión |
| `graph export` | Representar relaciones existentes | Identificar oportunidades de relacionar conceptos |
| Graph Hints | Señalar metadata incompleta | Proponer refinamientos contextualizados |
| `understand` | Guiar el siguiente paso según el estado del proyecto | Recomendar consolidación cuando exista una necesidad sustentada |
| Impact / Drift | Evaluar evidencia, calidad y consistencia | Ofrecer señales para priorizar consolidaciones |
| Knowledge Capsules | Compartir contexto portable | Beneficiarse del conocimiento refinado, sin reemplazarlo |

No duplicar parsers, inventarios, validaciones ni reglas de dominio existentes.

---

# 3. Consolidation Categories

Definir categorías para clasificar oportunidades de optimización.

## A. Knowledge Redundancy

Información potencialmente duplicada.

Ejemplo:

```text
product/product.md
    Defines capability X

product/capabilities.md
    Repeats the definition of capability X
```

Expected:

- Identificar la posible redundancia.
- Mostrar los fragmentos relacionados.
- Proponer una ubicación de referencia.
- Evaluar enlaces o referencias desde otros artifacts.

No asumir que dos documentos similares son duplicados sin una comparación semántica suficiente.

## B. Unincorporated Learning

Aprendizajes registrados en Work Items que podrían ser relevantes para el conocimiento vigente.

Ejemplo:

```text
WI-025
Learning:
A particular integration requires special retry handling.
```

Si ese aprendizaje representa una regla técnica vigente y no está documentado en Tech Knowledge, proponer incorporarlo al artifact adecuado.

No trasladar automáticamente todos los aprendizajes históricos.

## C. Knowledge Fragmentation

Información relacionada distribuida entre múltiples archivos, dificultando su comprensión.

Expected:

- Identificar fragmentación potencial.
- Evaluar si conviene crear referencias cruzadas.
- Proponer consolidación solo cuando aporte claridad.
- Preservar la separación entre responsabilidades.

No fusionar automáticamente Business, Product y Tech por tratar temas similares.

## D. Relationship Opportunities

Conceptos que podrían beneficiarse de relaciones explícitas.

Ejemplos:

```text
Capability -> Work Item
Work Item -> Decision
Module -> Resource
Decision -> Governed code
```

Utilizar Graph Hints y relaciones ya declaradas.

No inventar relaciones.

Una relación opcional ausente puede ser una oportunidad de mejora, no un error.

## E. Potentially Outdated Knowledge

Información que podría estar desactualizada frente a evidencia disponible.

Ejemplos:

- Un Work Item registra una implementación que cambió una decisión documentada.
- Dos artifacts declaran estados diferentes de una misma capacidad.
- Un hallazgo de Guard indica posible divergencia.

Distinguir:

```text
Verified inconsistency
Potential inconsistency
Insufficient evidence
```

No declarar obsoleto un artifact únicamente por su antigüedad.

## F. Knowledge Organization

Oportunidades para mejorar:

- Navegación.
- Nombres y títulos.
- Ubicación de información.
- Enlaces.
- Secciones excesivamente extensas.
- Separación entre conocimiento actual e histórico.

No optimizar por cantidad de archivos o palabras como objetivo aislado.

---

# 4. Consolidation Scope

Permitir ejecutar el análisis en diferentes niveles.

Propuesta de interfaz:

```bash
kaddo knowledge consolidate
```

Con alcance explícito:

```bash
kaddo knowledge consolidate --layer tech

kaddo knowledge consolidate --module payments

kaddo knowledge consolidate --scope all
```

Los nombres son propuestos; deben validarse contra la estructura actual del CLI.

Soportar inicialmente:

- Proyecto completo.
- Capa de conocimiento.
- Módulo mapeado cuando aplique.

Respetar el perfil del proyecto:

- Standard.
- POC.
- Pre-AI.
- Legacy.
- Single-repo.
- Multirepo.

No exigir relaciones ni artifacts opcionales para generar una consolidación.

El análisis debe informar su cobertura y las fuentes excluidas.

---

# 5. Deterministic Analysis Foundation

Implementar una base determinística de diagnóstico en Core.

Reutilizar:

- Knowledge Discovery.
- Artifact Quality.
- Graph y Graph Hints.
- Work Item Lifecycle.
- Learning.
- Project Resources.
- Existing Reporting Findings.
- Mapped Modules.

Esta capa puede identificar hechos verificables como:

- Referencias inválidas.
- Artifacts sin relaciones declaradas.
- Metadata incompleta.
- Hallazgos existentes de consistencia.
- Fuentes relevantes para revisar.
- Secciones e identidades documentales.

La detección de duplicados semánticos, contradicciones implícitas o decisiones equivalentes requiere interpretación contextual y no debe presentarse como un resultado determinístico cuando no lo es.

Core no ejecuta un LLM para producir conclusiones semánticas.

---

# 6. Agent-assisted Consolidation

Crear o extender una capacidad de agente para realizar la revisión semántica.

Nombre sugerido:

```text
knowledge-consolidation
```

Responsabilidades:

1. Consumir el diagnóstico determinístico.
2. Leer los artifacts relevantes según el alcance.
3. Comparar fragmentos relacionados.
4. Identificar posibles redundancias.
5. Contrastar aprendizajes históricos con conocimiento vigente.
6. Identificar relaciones candidatas.
7. Proponer refinamientos.
8. Explicar la evidencia y las incertidumbres.
9. Preparar cambios para revisión humana.

El agente no debe afirmar que una conclusión está verificada simplemente porque resulta plausible.

Debe diferenciar:

```text
Observed
Derived
Suggested
Unknown
```

No crear decisiones, reglas de negocio o relaciones nuevas sin evidencia o confirmación explícita.

No permitir que el agente reescriba todo `knowledge/` como una operación autónoma.

---

# 7. Consolidation Plan

Generar una proyección revisable que represente las oportunidades encontradas.

Salida sugerida:

```text
.kaddo/consolidation-plan.md
.kaddo/consolidation-plan.json
```

Estos archivos son resultados derivados, no una segunda fuente de verdad.

Cada propuesta debe identificar:

```yaml
category: unincorporated_learning
classification: suggested
source_artifacts:
  - WI-025
target_artifacts:
  - knowledge/tech/codebase.md
evidence:
  - "Relevant learning captured in WI-025"
suggested_action: "Review incorporation into Tech Knowledge"
confidence: requires-review
```

El ejemplo es conceptual, no un contrato definitivo.

Cada propuesta debe conservar:

- Identidad estable dentro del análisis.
- Categoría.
- Origen.
- Destino sugerido.
- Evidencia.
- Justificación.
- Posible impacto.
- Estado de incertidumbre.
- Acción recomendada.

No almacenar razonamiento privado del agente; conservar únicamente evidencia y explicaciones revisables.

---

# 8. Preview Before Changes

El usuario debe poder revisar qué cambiaría.

Ejemplo:

```text
Knowledge Consolidation

Scope:
Tech

Findings:
3 possible redundancies
2 learning integration opportunities
4 relationship review hints
1 potential inconsistency

Recommended changes:
1. Update codebase.md
2. Review capability relationships
3. Link relevant decisions
```

La propuesta debe permitir conocer:

- Qué artifacts se modificarían.
- Qué contenido se propone agregar.
- Qué contenido se propone mover o resumir.
- Qué información debe preservarse.
- Qué afirmaciones necesitan confirmación.

Cuando existan propuestas de edición, presentar un diff o una representación equivalente.

Este WI no necesita implementar un mecanismo nuevo de escritura automática.

---

# 9. Human Review and Canonical Integrity

Toda consolidación que modifique conocimiento requiere revisión.

Reglas:

- No eliminar información histórica automáticamente.
- No reescribir decisiones sin confirmación.
- No cambiar estados de Work Items.
- No modificar resultados de verificación.
- No actualizar Resource connection details sin evidencia.
- No interpretar una deprecación como autorización para eliminar información.
- No alterar Knowledge Capsules externas.
- No hacer commits automáticos.
- No modificar archivos fuera del alcance aprobado.

La aplicación de recomendaciones debe reutilizar los flujos existentes de edición controlada.

Si se necesita un mecanismo general de aplicación de cambios, debe tratarse como un WI posterior.

---

# 10. Learning Preservation

La consolidación debe aprovechar el conocimiento acumulado en Delivery sin destruir su historia.

Ejemplo:

```text
Completed Work Items
       |
       v
Learning and Decisions
       |
       v
Review Relevance
       |
       v
Living Knowledge
```

El Work Item original conserva:

- Learning.
- Evidence.
- Decisions.
- Validation.
- Lifecycle.

Los artifacts vigentes pueden incorporar el conocimiento relevante con referencias al origen.

No convertir los WIs históricos en simples resúmenes ni eliminarlos después de consolidar.

Distinguir claramente la historia de implementación del estado actual del sistema.

---

# 11. Avoid Over-optimization

La consolidación debe proteger información valiosa.

No asumir que:

- Menos archivos significa mejor conocimiento.
- Menos palabras significa mejor contexto.
- Un Graph con más aristas es necesariamente mejor.
- Toda repetición es perjudicial.
- Todos los aprendizajes deben convertirse en reglas.
- Un artifact antiguo está obsoleto.
- Todo concepto sin WI está desconectado incorrectamente.

En especial, preservar:

- Restricciones críticas.
- Decisiones y razones.
- Excepciones.
- Riesgos conocidos.
- Contratos técnicos.
- Evidencia de implementación.
- Procedencia.
- Información histórica necesaria.

La optimización debe mejorar la utilidad del conocimiento, no sacrificar precisión por brevedad.

---

# 12. Staleness and Repeatability

Los análisis deben basarse en un snapshot lógico de las fuentes.

Si los archivos cambian después de generar un plan, las recomendaciones deben poder identificarse como potencialmente desactualizadas.

Requisitos:

- Referenciar los archivos utilizados.
- Incorporar revisiones o fingerprints cuando corresponda.
- Detectar cambios relevantes antes de preparar una aplicación.
- No considerar una propuesta anterior como vigente sin comprobar sus fuentes.
- Evitar producir reiteradamente la misma sugerencia sin nueva evidencia.

Las ejecuciones sucesivas deben permitir comparar resultados sin inventar indicadores de mejora.

---

# 13. Security and Privacy

La consolidación puede involucrar conocimiento sensible.

Requisitos:

- Respetar límites de acceso y alcance.
- No enviar secretos innecesariamente al contexto de agentes.
- No mostrar valores de credenciales.
- No resolver referencias secretas.
- No conectarse a Project Resources.
- No ejecutar comandos extraídos de documentos.
- No acceder a repositorios no disponibles.
- No incorporar conocimiento externo sin autorización.

Aplicar las políticas de lectura segura existentes.

---

# 14. MCP and Agent Workflow

Exponer el diagnóstico y el plan mediante una superficie MCP coherente con las convenciones actuales.

Permitir que un agente:

1. Solicite un análisis.
2. Consulte oportunidades.
3. Obtenga fuentes relevantes.
4. Prepare refinamientos.
5. Presente una propuesta para revisión.

La implementación debe mantener la separación:

```text
Core
→ deterministic analysis

MCP
→ structured access

Agent / Skill
→ semantic interpretation and proposed refinement

Human
→ approval
```

No introducir un LLM obligatorio en el CLI.

---

# 15. Documentation

Crear documentación EN/ES para Knowledge Consolidation.

Explicar:

- Concepto.
- Diferencias con context compaction.
- Diferencias con `learn`, `guard`, Graph y Drift.
- Tipos de hallazgos.
- Alcances soportados.
- Proceso de revisión humana.
- CLI y MCP.
- Limitaciones semánticas.
- Seguridad.
- Ejemplos de antes y después.

Mantener el lenguaje de producto alineado con Knowledge-Driven Development.

---

# Out of Scope

Este WI no incluye:

- Compresión automática de conversaciones con agentes.
- Modificar la ventana de contexto de un LLM.
- Reescribir automáticamente todo el repositorio.
- Eliminar artifacts históricos.
- Archivar o completar Work Items.
- Cambiar decisiones de arquitectura.
- Crear relaciones Graph sin evidencia.
- Implementar un editor automático de documentos.
- Crear un motor RAG o una base vectorial.
- Introducir embeddings obligatorios.
- Ejecutar Project Resources.
- Cambiar modelos Core de otras capacidades.
- Implementar un dashboard nuevo en Admin.
- Calcular supuestos ahorros económicos.
- Generar commits, pushes o releases automáticamente.

---

## Acceptance Criteria

- [x] AC-01: existe una operación de análisis de consolidación para el conocimiento canónico.
- [x] AC-02: el análisis soporta alcance por proyecto, capa y módulo cuando sea aplicable.
- [x] AC-03: reutiliza las fuentes y validadores Core existentes.
- [x] AC-04: identifica oportunidades verificables de relaciones, metadata y consistencia.
- [x] AC-05: permite revisar posibles redundancias, fragmentación y aprendizajes no incorporados mediante un agente.
- [x] AC-06: diferencia hallazgos determinísticos de interpretaciones semánticas sugeridas.
- [x] AC-07: produce un Consolidation Plan en formato legible y estructurado.
- [x] AC-08: cada recomendación indica fuente, evidencia, destino y acción propuesta.
- [x] AC-09: ninguna operación de análisis o preview modifica artifacts canónicos.
- [x] AC-10: las recomendaciones no generan hechos, relaciones ni decisiones artificiales.
- [x] AC-11: los Work Items y sus aprendizajes históricos se preservan.
- [x] AC-12: existe una integración MCP para consultar los resultados.
- [x] AC-13: el flujo agent-assisted puede preparar refinamientos sujetos a revisión humana.
- [x] AC-14: cambios de las fuentes pueden invalidar propuestas previamente generadas.
- [x] AC-15: POC, Legacy y Multirepo respetan sus reglas de aplicabilidad.
- [x] AC-16: no se filtran secretos ni se ejecutan sistemas externos.
- [x] AC-17: las pruebas cubren análisis, clasificación, preservación e idempotencia.
- [x] AC-18: existe dogfooding sobre el conocimiento de Kaddo.
- [x] AC-19: se documenta la funcionalidad en EN/ES.
- [x] AC-20: la implementación se revisa localmente antes de autorizar el commit.

---

# Validation Scenarios

## Scenario 1 — Learning not incorporated

Un WI completado registra una restricción relevante que no figura en Tech Knowledge.

Expected:

- Se identifica como candidata para consolidación semántica.
- Se muestra la fuente.
- Se propone un destino.
- No se modifica automáticamente el artifact.

## Scenario 2 — Potential duplication

Business y Product contienen párrafos similares con responsabilidades distintas.

Expected:

- No se fusionan automáticamente.
- Se evalúa su función.
- Se conserva la distinción entre capas.
- Solo se propone consolidación cuando exista evidencia suficiente.

## Scenario 3 — Disconnected Knowledge

Un Graph Hint indica una relación opcional ausente.

Expected:

- Se presenta como oportunidad de revisión.
- No se declara inconsistencia histórica.
- No se crea la relación sin confirmación.

## Scenario 4 — Conflicting Knowledge

Dos artifacts declaran valores incompatibles para un mismo concepto.

Expected:

- Se presentan ambos orígenes.
- Se indica si la contradicción está verificada o es potencial.
- No se selecciona arbitrariamente una verdad.

## Scenario 5 — No Changes Required

Proyecto con conocimiento consistente y sin oportunidades detectadas por los análisis disponibles.

Expected:

- Se informa la cobertura evaluada.
- No se inventan optimizaciones.
- No se afirma perfección absoluta del conocimiento.

## Scenario 6 — Outdated Plan

Se genera un plan y posteriormente cambia un artifact fuente.

Expected:

- El plan se identifica como potencialmente desactualizado.
- No se utiliza como autorización para modificar la versión nueva.

## Scenario 7 — Kaddo Dogfooding

Evaluar:

- Business.
- Product.
- Tech.
- Completed Work Items.
- Learning.
- Graph Hints.

Expected:

- Se identifican oportunidades concretas.
- Se propone un refinamiento revisable.
- No se generan modificaciones automáticas.
- Se demuestra que el proceso puede mejorar la recuperación o consistencia del conocimiento sin pérdida de información.

---

# Implementation Guidance

Puntos iniciales de inspección:

```text
packages/cli/src/core/artifact-quality.ts
packages/cli/src/core/graph-hints.ts
packages/cli/src/core/understand.ts
packages/cli/src/core/reporting-evidence.ts
packages/cli/src/commands/learn.ts
packages/mcp/src/tools.ts
```

Revisar también:

- Knowledge Discovery.
- Work Item lifecycle y evidence.
- Graph relationships.
- Existing agents and skills.
- Knowledge quality heuristics.
- Current-state vs architecture intent.
- Project profiles and module mapping.

La implementación debe utilizar un módulo dedicado para el diagnóstico de consolidación, sin introducir otro parser de artifacts.

Orden sugerido:

1. Definir el modelo de oportunidades.
2. Implementar análisis determinístico.
3. Generar el plan revisable.
4. Integrar CLI.
5. Exponer resultados por MCP.
6. Incorporar el agent/skill de consolidación.
7. Validar con proyectos representativos.
8. Documentar y ejecutar dogfooding.

No comenzar con un algoritmo que resuma todos los documentos.

---

# Definition of Done

El WI se considera completo cuando:

- Kaddo puede evaluar oportunidades de consolidación.
- Las recomendaciones están respaldadas por fuentes.
- Se distinguen los hechos de las interpretaciones.
- El análisis puede ejecutarse sin modificar conocimiento.
- El agente puede preparar propuestas de refinamiento.
- No se pierden decisiones ni aprendizajes.
- No se generan relaciones artificiales.
- CLI y MCP comparten la misma base de análisis.
- Existen pruebas de seguridad y regresión.
- La funcionalidad está documentada.
- El propio proyecto Kaddo ha sido utilizado para validar la capacidad.
- Se registra Implementation Evidence.

## Commit Gate

No realizar commit, push ni release automáticamente.

Primero:

1. Ejecutar builds y pruebas.
2. Analizar el conocimiento del propio Kaddo.
3. Presentar el Consolidation Plan.
4. Revisar los hallazgos y sus fuentes.
5. Mostrar al menos una propuesta de refinamiento antes/después.
6. Confirmar que no se modificaron archivos canónicos durante el análisis.
7. Solicitar aprobación explícita antes del commit.

---

# Future Evolution

Una vez validado el MVP:

- Aplicación guiada de propuestas aprobadas.
- Vista de Knowledge Consolidation en Kaddo Admin.
- Comparación de revisiones antes/después.
- Recomendaciones de consolidación dentro del lifecycle.
- Integración opcional en checkpoints posteriores a `learn`.
- Optimización del Context Pack basada en conocimiento refinado.
- Medición de redundancia y calidad de recuperación cuando exista evidencia suficiente.

Estas capacidades no forman parte del MVP.

---

# Guiding Principle

> El conocimiento no mejora simplemente por acumular documentos. Debe evolucionar, conectar sus aprendizajes y conservar su coherencia. Knowledge Consolidation permite revisar lo aprendido, identificar lo que está disperso y proponer mejoras sin perder la historia, las decisiones ni la evidencia que sustentan al sistema.

---

## Learning

Implementado en v3.129.0 como un MVP determinístico + capa semántica de instrucciones.

- **La frontera determinístico/semántico es el corazón de la confianza.** Core emite como `observed`
  solo hechos verificables (relaciones opcionales ausentes vía graph-hints, referencias a decisiones
  colgantes, calidad de artifact) y marca todo lo interpretativo como candidato `suggested` +
  `requires_semantic_review`. Ningún código de Core/CLI ejecuta un LLM; la interpretación vive en la
  skill `knowledge-consolidation` y el `knowledge-consolidation-agent`. El vocabulario
  Observed/Derived/Suggested/Unknown se apoyó en el `EvidenceKind` ya existente de
  `reporting-evidence.ts` en vez de inventar otro.
- **El falso positivo más peligroso era estructural, no semántico.** Un primer prototipo produjo 484
  "redundancias": los 61 Work Items comparten la plantilla del WI, y el andamiaje (agents/skills bajo
  `knowledge/`) también. La corrección —comparar redundancia solo sobre artifacts de capa canónica
  (`la.layer !== null`, excluyendo WIs, roadmap y scaffolding)— es exactamente la "evitar
  sobre-optimización" que el propio WI pedía. Lección: calibrar heurísticas de similitud **contra el
  conocimiento real del proyecto** (dogfooding) antes de confiar en ellas.
- **El dogfooding también endureció la seguridad.** El test AC-16 detectó que `firstSentence` podía
  arrastrar un token con forma de secreto desde el learning de un WI hasta el `evidence` del plan; se
  añadió `redactSecrets()` sobre patrones de secreto conocidos. Un análisis "solo lectura" sobre
  conocimiento igual debe redactar defensivamente.
- **Reutilizar, no reparsear.** Todo el diagnóstico se apoya en fundaciones existentes
  (knowledge-discovery, artifact-quality, graph/graph-hints, reporting-evidence, work-items/learning);
  no se introdujo otro parser de artifacts. El plan es derivado (`.kaddo/`), nunca una segunda fuente
  de verdad, con fingerprints por archivo fuente para detectar staleness (AC-14).
- **`affected_modules` ≠ subsistemas.** Listar `agents`/`skills` como módulos bloqueó `kaddo verify`
  (no están en `.kaddo/modules.yml`); esos cambios viven **dentro** del paquete `cli`. Los módulos
  afectados reales son `cli`, `mcp`, `docs`.

**Conocimiento a vigilar:** si en el futuro se añade aplicación guiada de propuestas (hoy fuera de
alcance), debe pasar por los flujos de edición controlada existentes y preservar historia, decisiones
y evidencia — nunca una reescritura autónoma de `knowledge/`.
