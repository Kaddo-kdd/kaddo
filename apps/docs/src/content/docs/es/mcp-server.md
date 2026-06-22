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
.kaddo/ + knowledge/ + external/
        ↓
context · explain · understand · grafo · work items · capsules · prompts
```

> **De solo lectura por diseño.** El servidor nunca modifica conocimiento, edita archivos, ejecuta
> git, llama a un LLM ni escanea tu código fuente. Es un paquete separado y liviano — el CLI sigue
> ligero.

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

`cwd` debe apuntar al proyecto que contiene `.kaddo/`, `knowledge/` y (opcionalmente) `external/`.
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
| `kaddo://capsules` | `.kaddo/external.yml` + `external/` | Knowledge Capsules externas |
| `kaddo://agents` | `knowledge/agents/` | prompts de agentes instalados |
| `kaddo://skills` | `knowledge/skills/` | skills instaladas (vacío si no hay) |
| `kaddo://skills/<id>` | `knowledge/skills/<id>/skill.md` | una skill reutilizable |
| `kaddo://impact-report` | `.kaddo/reports/` (o en memoria) | [Reporte de impacto](/es/impact-report/) |
| `kaddo://savings-report` | `.kaddo/reports/` (o en memoria) | [Reporte de ahorro](/es/savings-report/) |
| `kaddo://drift-report` | `.kaddo/reports/` (o en memoria) | [Reporte de drift](/es/drift-report/) |
| `kaddo://guard-history` | `.kaddo/history/guard-runs.jsonl` | recorded guard runs |

## Tools (solo lectura)

- `kaddo_project_status` — estado compacto (state, work items, ownership, calidad del grafo, capsules).
- `kaddo_list_work_items` — filtra por `status` / `type` / `knowledge_level`.
- `kaddo_get_work_item` — un Work Item por `id` (resumen + markdown completo).
- `kaddo_list_capsules` / `kaddo_get_capsule` — Knowledge Capsules externas.
- `kaddo_list_agents` / `kaddo_get_agent_prompt` — prompts de agentes instalados.
- `kaddo_list_skills` / `kaddo_get_skill` — [skills](/es/skills/) reutilizables instaladas.
- `kaddo_list_graph_hints` — hints del grafo, filtra por `artifact_type` / `severity` / `active_only`.

## Derived tools (escriben solo bajo `.kaddo/`)

Cuando un artefacto derivado falta o está desactualizado, estas tools lo regeneran en el sitio —
con la misma lógica core del CLI — para que el agente no tenga que salir al terminal. Son
deterministas (sin LLM, sin git) y **solo escriben bajo `.kaddo/`**; nunca modifican `knowledge/`,
`src/`, `external/` ni `.kaddo/external.yml`.

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

El servidor solo lee `.kaddo/`, `knowledge/` y `external/`. Nunca lee `src/`, `.git/`,
`node_modules/`, `dist/`, `build/` ni `coverage/`, bloquea el path traversal y nunca expone
secretos, tokens, valores de entorno, código fuente ni PII.

## Qué **no** hace

Sin escrituras fuera de `.kaddo/`, sin editar knowledge/código, sin crear Work Items, sin `kaddo
scan`/`learn`/`owners suggest`/`capsule add`, sin `kaddo add`, sin git, sin sincronización remota,
sin GitHub API, sin servidor HTTP, sin auth, sin RAG, sin vector database, sin llamadas a LLM. Las
derived tools regeneran artefactos **solo bajo `.kaddo/`**; todo lo demás es de solo lectura.

## Ver también

- [Resumen de comandos](/es/commands/overview/) — el CLI que produce lo que MCP lee.
- [Exportar el grafo de conocimiento](/es/knowledge-graph-export/) y [Knowledge Capsules](/es/knowledge-capsules/).
- [Agentes (Prompt Packs)](/es/modules/agents/) — expuestos como prompts MCP.
