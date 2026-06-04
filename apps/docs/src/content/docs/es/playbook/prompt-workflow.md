---
title: Prompt Workflow
description: Qué input produce el CLI, qué prompt o agente usar, qué output esperar y dónde guardarlo — paso a paso.
---

Esta página mapea cada paso del loop de Kaddo a su **input del CLI**, el **prompt/agente del
LLM** a usar, el **output esperado** y **dónde guardarlo**. Los pasos marcados como *ninguno*
son totalmente determinísticos y no necesitan LLM.

| Paso | Input del CLI | Prompt/agente del LLM | Output esperado | Guardar como |
|---|---|---|---|---|
| Scan | `kaddo scan` | ninguno | inventario técnico | `.kaddo/scan.json`, `knowledge/inventory.md` |
| Context | `kaddo context` | ninguno | pack listo para LLM | `.kaddo/context-pack.md` |
| Entender capacidades | context pack | `capability-agent` | capacidades | `knowledge/product/capabilities.md` |
| Entender arquitectura | context + capacidades | `architecture-agent` | baseline de arquitectura | `knowledge/tech/current-state.md` |
| Roadmap | context + capacidades + arquitectura | `roadmap-agent` | roadmap | `knowledge/delivery/roadmap.md` |
| Work Item | roadmap | ninguno | work item | `knowledge/delivery/work-items/*.md` |
| Ownership | work item + scan | ninguno | ownership en front matter | Work Item actualizado |
| Guard | `git diff` + ownership | ninguno | aviso de drift | salida de terminal |
| Explain | artefactos de Kaddo | ninguno | resumen del proyecto | `.kaddo/explain.md` |
| Diseño de módulo | `kaddo modules map` | `module-design-agent` | diseño del módulo | `knowledge/tech/modules/<id>/module-design.md` |
| Estándares / seguridad / stack | `kaddo add <tema>` | `standards-` / `security-` / `stack-agent` | artefacto global | `knowledge/tech/<tema>.md` |
| Estrategia de Git | `kaddo add git-strategy` | `git-strategy-agent` | estrategia de git | `knowledge/tech/git-strategy.md` |

> Kaddo nunca llama a un LLM por ti. Tú ejecutas los agentes en tu propio chat (Claude,
> ChatGPT, Cursor, Copilot, Windsurf…) y luego guardas el output en la ruta de artefacto de
> arriba.

## Cómo ejecutar un paso con agente

1. Abre `.kaddo/context-pack.md` y el prompt de agente correspondiente en `knowledge/agents/`.
2. Pega el prompt del agente en tu chat LLM.
3. Adjunta o pega el context pack (y cualquier artefacto previo del que dependa el agente).
4. Revisa el output como humano.
5. Guárdalo en la ruta de artefacto objetivo.

## Ejemplos de prompts

Son puntos de partida. Los prompts de agente instalados (`kaddo add agents`) son la fuente de
verdad; adapta el texto a tu proyecto.

### capability-agent

```txt
Eres el agente de capacidades de Kaddo. Usando el context pack adjunto, lista las
capacidades de producto que ofrece esta base de código. Para cada capacidad: nombre,
propósito en una línea, los dominios que toca y las rutas de código principales. No
inventes features. Salida en Markdown para knowledge/product/capabilities.md.
```

### architecture-agent

```txt
Eres el agente de arquitectura de Kaddo. Usando el context pack y capabilities.md, describe
la arquitectura actual: módulos principales, límites, flujo de datos y riesgos notables.
Marca los supuestos explícitamente. Salida en Markdown para knowledge/tech/current-state.md.
```

### roadmap-agent

```txt
Eres el agente de roadmap de Kaddo. Usando el context pack, capabilities y current-state,
propón un roadmap priorizado de Work Items candidatos. Para cada candidato: título,
problema, resultado esperado, dominios afectados y un nivel de conocimiento sugerido
(K0–K4). Salida en Markdown para knowledge/delivery/roadmap.md.
```

### legacy-agent

```txt
Eres el agente legacy de Kaddo. Usando el context pack, identifica las áreas de mayor
riesgo de este sistema legacy: código sin ownership claro, límites frágiles y conocimiento
faltante. Recomienda qué entender antes de cambiar cada área. Marca la incertidumbre
explícitamente.
```

### adr-agent

```txt
Eres el agente de ADR de Kaddo. Dada una decisión y su contexto, redacta un Architecture
Decision Record: contexto, decisión, alternativas consideradas, consecuencias y riesgos.
Mantenlo conciso. Salida en Markdown para un artefacto ADR.
```

---

Míralo de punta a punta: cada [ejemplo](/es/examples/) incluye un `prompt-flow.md` con un
diagrama Mermaid, una tabla input/output y handoffs de prompts para copiar/pegar según su
escenario.

Siguiente: [Trazabilidad de Work Items](/es/playbook/work-item-traceability/) — cómo se
mantiene conectado el loop.
