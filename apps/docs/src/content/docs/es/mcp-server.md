---
title: Servidor MCP
description: Expón el conocimiento de tu proyecto Kaddo a agentes e IDEs compatibles con MCP mediante un servidor Model Context Protocol de solo lectura.
---

`@kaddo/mcp` es un servidor [Model Context Protocol](https://modelcontextprotocol.io) de **solo
lectura** que expone el conocimiento curado de tu proyecto Kaddo a cualquier cliente compatible con
MCP (IDE o agente). En vez de correr `kaddo context`, copiar el context pack y pegar el prompt de un
agente a mano, el agente consulta a Kaddo directamente: contexto, estado, Work Items, grafo, hints y
prompts.

```text
Cliente MCP / IDE / Agente
        ↓
    @kaddo/mcp
        ↓
.kaddo/ + knowledge/
        ↓
context · explain · understand · grafo · work items · capsules · prompts
```

> **Mayormente de solo lectura.** El servidor nunca ejecuta git, llama a un LLM ni escanea tu código
> fuente. Las herramientas de lifecycle (import, ready, evidence, verify) pueden escribir bajo
> `knowledge/delivery/work-items/` y las derived tools escriben bajo `.kaddo/`. Todo lo demás es
> estrictamente de solo lectura.

## Instalar y ejecutar

Sin instalación:

```bash
npx @kaddo/mcp
```

El servidor habla MCP por **stdio** y opera sobre el proyecto de su directorio de trabajo (o el de
la variable de entorno `KADDO_PROJECT_DIR`). Comparte versión con
[`@kaddo/cli`](/es/commands/overview/).

## Configurar un cliente MCP

```json
{
  "mcpServers": {
    "kaddo": {
      "command": "npx",
      "args": ["@kaddo/mcp"],
      "cwd": "/ruta/absoluta/a/tu/proyecto"
    }
  }
}
```

`cwd` debe apuntar al proyecto que contiene `.kaddo/` y `knowledge/`.
Hay un ejemplo listo para copiar en
[`examples/mcp/`](https://github.com/Kaddo-kdd/kaddo/tree/main/examples/mcp).

## Resources

| URI | Lee | Propósito |
|---|---|---|
| `kaddo://context-pack` | `.kaddo/context-pack.md` | contexto curado para el LLM |
| `kaddo://explain` | `.kaddo/explain.md` | qué sabe Kaddo |
| `kaddo://understand` | `.kaddo/understand.md` | fase actual + siguiente paso |
| `kaddo://graph` | `.kaddo/graph.json` + `.mmd` | grafo de conocimiento |
| `kaddo://graph-hints` | `.kaddo/graph-hints.md` + `.json` | relaciones débiles/faltantes |
| `kaddo://work-items` | `knowledge/delivery/work-items/` | Work Items resumidos |
| `kaddo://roadmap` | `knowledge/delivery/roadmap.md` | roadmap de delivery |
| `kaddo://capsules` | `.kaddo/external.yml` + `knowledge/external/` | Knowledge Capsules externas |
| `kaddo://agents` | `knowledge/agents/` | prompts de agentes instalados |
| `kaddo://skills` | `knowledge/skills/` | skills instaladas (vacío si no hay) |
| `kaddo://skills/<id>` | `knowledge/skills/<id>/skill.md` | una skill reutilizable |
| `kaddo://impact-report` | `.kaddo/reports/` (o en memoria) | [Reporte de impacto](/es/impact-report/) |
| `kaddo://savings-report` | `.kaddo/reports/` (o en memoria) | [Reporte de ahorro](/es/savings-report/) |
| `kaddo://drift-report` | `.kaddo/reports/` (o en memoria) | [Reporte de drift](/es/drift-report/) |
| `kaddo://guard-history` | `.kaddo/history/guard-runs.jsonl` | recorded guard runs |
| `kaddo://build-contract` | `knowledge/delivery/build-contract.md` | Build Contract nativo — lifecycle completo |
| `kaddo://open-questions` | business/product/codebase/roadmap | preguntas abiertas clasificadas |
| `kaddo://roadmap-readiness` | (computed) | resumen de readiness del roadmap |
| `kaddo://tech-decisions` | (computed) | candidatos de decisión vs ADRs + nombres ADR sugeridos |
| `kaddo://installed-assets` | (computed) | estado de versión de agentes/skills vs paquete actual |
| `kaddo://roadmap-quality` | (computed) | calidad de fundamento de iniciativas y candidatos WI |
| `kaddo://work-item-candidates` | `knowledge/delivery/roadmap.md` | candidatos WI materializables del roadmap |
| `kaddo://next-step` | (computed) | recomendación de siguiente paso según estado de delivery |
| `kaddo://project-route` | (computed) | mapa de progreso del lifecycle del proyecto |
| `kaddo://scan-signals` | `.kaddo/scan.json` | señales accionables de `kaddo scan` |

## Tools (solo lectura)

- `kaddo_project_status` — estado compacto (state, work items, ownership, calidad del grafo, capsules).
- `kaddo_list_work_items` — filtra por `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — un Work Item por `id` (resumen + markdown completo).
- `kaddo_list_capsules` / `kaddo_get_capsule` — Knowledge Capsules externas.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — prompts de agentes instalados.
- `kaddo_list_skills` / `kaddo_get_skill` — [skills](/es/skills/) reutilizables instaladas.
- `kaddo_list_graph_hints` — hints del grafo, filtra por `artifact_type` / `severity` / `active_only`.

## Herramientas del lifecycle de Work Items

Estas herramientas cubren el Build Contract completo. Pueden escribir bajo
`knowledge/delivery/work-items/` para transiciones de lifecycle.

| Herramienta | Etapa | Propósito |
|---|---|---|
| `kaddo_work_item_import` | Captured Intent | Importa un WI desde texto/Markdown como borrador. Parsea, normaliza y genera un refinement handoff. |
| `kaddo_mark_work_item_ready` | Ready | Evalúa readiness y transiciona un WI draft a ready (mueve el archivo de `draft/` a `ready/`). |
| `kaddo_implementation_handoff` | Handoff | Construye un Implementation Handoff agent-agnostic para un WI ready con guía de contexto y deliberación de diseño. |
| `kaddo_collect_evidence` | Evidence | Recolecta evidencia estructurada: paths cambiados, validaciones, verificaciones de ACs. |
| `kaddo_verify_work_item` | Verification | Verifica evidencia contra ACs, release gates y excepciones de completitud. Devuelve decisión de completitud. |

## Herramientas multirepo

Herramientas para agentes trabajando con proyectos multirepo `core`/`module`. Todas son de solo
lectura excepto `kaddo_export_capsule` que escribe cápsulas derivadas bajo `.kaddo/exports/`.

| Herramienta | Propósito |
|---|---|
| `kaddo_modules_list` | Lista módulos mapeados y su estado de configuración Kaddo (solo core). |
| `kaddo_get_module_context` | Obtiene `module-context.md`, resúmenes tech y warnings de un módulo. |
| `kaddo_validate_work_item_modules` | Valida coherencia de `affected_modules` y ownership cross-repo. |
| `kaddo_get_work_item_context` | Contexto compuesto para implementar un Work Item multirepo. |
| `kaddo_suggest_branch_strategy` | Sugiere nombres de rama, mensajes de commit y checklist. NO ejecuta git. |
| `kaddo_export_capsule` | Exporta una cápsula (proyecto, sistema o módulo) bajo `.kaddo/exports/`. |
| `kaddo_modules_discover` | Descubre repos hermanos configurados como módulos Kaddo. No persiste sin apply+confirm. Solo core. |

**Seguridad:** ninguna de estas herramientas ejecuta git, hace deploy, instala dependencias ni
llama a un LLM. `kaddo_suggest_branch_strategy` solo *sugiere* nombres de rama y mensajes de
commit — el agente o usuario debe crear branches y hacer commit manualmente.

## Herramientas del Graph del sistema

Recorrido de solo lectura sobre la [topología semántica del sistema](/es/commands/admin/). Ayudan al
agente a **ampliar lo que debe investigar** antes de decidir el alcance de un Work Item. Todo lo que
exponen es un **candidato de impacto** a verificar en el repositorio — nunca alcance confirmado. Que
no exista una arista en el Graph no significa "sin impacto": el recorrido está acotado y la cobertura
puede ser parcial.

| Herramienta | Propósito |
|---|---|
| `kaddo_system_search` | Busca entidades por etiqueta / tipo / módulo / propósito (conceptos antes que implementación). |
| `kaddo_system_node` | Una entidad con sus relaciones entrantes y salientes. |
| `kaddo_system_neighbors` | Vecindario BFS acotado (`maxDepth` / `maxNodes`, opcional `relationshipTypes` / `moduleId`). Informa truncamiento. |
| `kaddo_system_paths` | Caminos dirigidos, acíclicos y acotados entre dos entidades. |
| `kaddo_system_impact_candidates` | **Candidatos** de impacto asistidos por el Graph desde una o más entidades semilla, con razones y caminos. |

**Seguridad:** estas herramientas nunca deciden el alcance, mutan el Work Item, llaman a un LLM ni
tocan git. El agente inspecciona cada candidato y lo clasifica como *afectado*, *revisado-no-afectado*
o *desconocido*, preservando la razón; una persona confirma antes de escribir la clasificación en el
Work Item.

## Herramientas de integraciones

Acceso de solo lectura a la [Integration Adapter Foundation](/es/integrations/) — sistemas de trabajo
externos como GitHub Issues, Jira o Azure DevOps. Leer un elemento externo nunca crea un Work Item
Kaddo; **el import es una acción aparte, confirmada por una persona** y no se expone por MCP. Los
secretos nunca se devuelven (solo los nombres de las variables de entorno que una credencial
referencia).

| Herramienta | Propósito |
|---|---|
| `kaddo_integrations_list` | Lista las integraciones configuradas y sus capabilities. |
| `kaddo_integrations_status` | Verifica integraciones y reporta el estado de conexión (available / unauthorized / …). |
| `kaddo_integrations_work_items` | Lista elementos de trabajo externos de una integración (paginado). |
| `kaddo_integrations_work_item` | Lee un único elemento de trabajo externo. |

## Derived tools (escriben solo bajo `.kaddo/`)

Cuando un artefacto derivado falta o está desactualizado, estas tools lo regeneran en el sitio —
con la misma lógica core del CLI — para que el agente no tenga que salir al terminal. Son
deterministas (sin LLM, sin git) y **solo escriben bajo `.kaddo/`**; nunca modifican `knowledge/`,
`src/`, `knowledge/external/` ni `.kaddo/external.yml`.

| Tool | Escribe | Equivalente CLI |
|---|---|---|
| `kaddo_generate_context` | `.kaddo/context-pack.md` + `.json` | `kaddo context` |
| `kaddo_generate_explain` | `.kaddo/explain.md` + `.json` | `kaddo explain` |
| `kaddo_generate_understand` | `.kaddo/understand.md` | `kaddo understand` |
| `kaddo_generate_graph` | `.kaddo/graph.json` + `.mmd` + `graph-hints.md` + `.json` | `kaddo graph export` |
| `kaddo_generate_capsule_draft` | `.kaddo/exports/<project>.capsule.md` + `.json` | `kaddo capsule export` |
| `kaddo_generate_impact_report` | `.kaddo/reports/impact-report.md` / `.json` | `kaddo report impact` |
| `kaddo_generate_savings_report` | `.kaddo/reports/savings-report.md` / `.json` | `kaddo savings` |
| `kaddo_generate_drift_report` | `.kaddo/reports/drift-report.md` / `.json` | `kaddo drift` |
| `kaddo_generate_questions_report` | `.kaddo/reports/questions-report.md` / `.json` | `kaddo questions` |

Cada una devuelve `{ status, files_written, summary, warnings, next_suggested_resources }`. Toda
escritura pasa por una validación central (`assertMcpDerivedWritePath`); cualquier ruta fuera del
conjunto derivado de `.kaddo/` se rechaza con `Blocked unsafe MCP derived write path.`

`kaddo_generate_capsule_draft` escribe **solo un borrador** bajo `.kaddo/exports/` — nunca registra
ni importa una cápsula (para eso usa el CLI `kaddo capsule add`).

### Flujo típico

```text
el agente consulta MCP → recurso derivado falta o está viejo
        ↓
la tool derivada lo regenera bajo .kaddo/
        ↓
el agente lee el recurso actualizado y continúa
```

Que una tool se ejecute automáticamente o requiera confirmación lo decide tu cliente MCP.

## Prompts

Cada prompt de agente instalado (`knowledge/agents/**`) se expone como un prompt MCP —
`business-agent`, `work-item-agent`, `implementation-agent`, `graph-agent`, `capsule-agent`, etc. —
con su contenido completo y entradas recomendadas. Instálalos con
[`kaddo add agents`](/es/modules/agents/).

## Los resources nunca generan automáticamente

Los **resources** son lectura pura — nunca generan archivos. Si falta un archivo derivado, el
resource responde con una instrucción clara (y luego puedes llamar a la derived tool correspondiente):

| Falta | Respuesta |
|---|---|
| `.kaddo/config.yml` | `Kaddo project not found. Run kaddo init first.` |
| `.kaddo/context-pack.md` | `Context pack not found. Run kaddo context in the project first.` |
| `.kaddo/graph.json` | `Knowledge graph not found. Run kaddo graph export first.` |
| `knowledge/` | `Knowledge repository not found. Run kaddo bootstrap first.` |

## Seguridad

El servidor solo lee `.kaddo/` y `knowledge/`. Nunca lee `src/`, `.git/`,
`node_modules/`, `dist/`, `build/` ni `coverage/`, bloquea el path traversal y nunca expone
secretos, tokens, valores de entorno, código fuente ni PII.

## Qué **no** hace

Sin editar código fuente, sin `kaddo scan`/`learn`/`owners suggest`/`capsule add`, sin `kaddo add`,
sin git, sin sincronización remota, sin GitHub API, sin servidor HTTP, sin auth, sin RAG, sin vector
database, sin llamadas a LLM. Las herramientas de lifecycle escriben solo bajo
`knowledge/delivery/work-items/` para transiciones; las derived tools escriben solo bajo `.kaddo/`.
Todo lo demás es de solo lectura.

## Ver también

- [Resumen de comandos](/es/commands/overview/) — el CLI que produce lo que MCP lee.
- [Exportar el grafo de conocimiento](/es/knowledge-graph-export/) y [Knowledge Capsules](/es/knowledge-capsules/).
- [Agentes (Prompt Packs)](/es/modules/agents/) — expuestos como prompts MCP.
