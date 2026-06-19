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
| Captura de backlog | una idea / notas / transcripción | `backlog-agent` | draft de Work Item o candidato de roadmap | `knowledge/delivery/work-items/draft/*.md` o un candidato de roadmap |
| Work Item | roadmap | ninguno | work item | `knowledge/delivery/work-items/*.md` |
| Refinamiento de Work Item | context + Work Item draft | `work-item-agent` | Work Item ready (aceptación · cómo probarlo · DoD) | Work Item actualizado |
| Propuesta de ownership | context + Work Items + inventory | `ownership-agent` | globs `code:` precisos (el humano confirma) | aplicado vía `kaddo owners suggest` |
| Ownership | work item + scan | ninguno | ownership en front matter | Work Item actualizado |
| Implementación | context + Work Item ready | `implementation-agent` | código · tests · rama/commit sugeridos | repositorio + conocimiento actualizado |
| Guard | `git diff` + ownership | ninguno | aviso de drift | salida de terminal |
| Knowledge Capsule | draft de `kaddo capsule export` | `capsule-agent` | cápsula refinada (sin secretos/código) | `.kaddo/exports/<system>.capsule.md` |
| Explain | artefactos de Kaddo | ninguno | resumen del proyecto | `.kaddo/explain.md` |
| Grafo de conocimiento | front matter + capsules | ninguno | grafo de conocimiento liviano | `.kaddo/graph.json`, `.kaddo/graph.mmd` |
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

### backlog-agent

```txt
Usando el backlog-agent, captura la siguiente idea:

[pega texto libre, viñetas, notas de reunión o una transcripción]

Decide dónde debería vivir: un draft de Work Item (claro y acotado) o un candidato de roadmap
(demasiado grande), y divídela en items separados si contiene varias ideas. Infiere iniciativa,
dominios, tipo sugerido (feature/bugfix/hotfix/spike/chore) y nivel de conocimiento, y marca
duplicados o dependencias. No refines del todo, no escribas código, no ejecutes otros agentes.
Termina con un handoff de decisión humana (refinar / agregar candidato / dividir / mantener draft).
Genera Markdown para un draft en knowledge/delivery/work-items/draft/ (o propón un WI-CANDIDATE
para el roadmap).
```

### legacy-agent

```txt
Eres el agente legacy de Kaddo. Usando el context pack, identifica las áreas de mayor
riesgo de este sistema legacy: código sin ownership claro, límites frágiles y conocimiento
faltante. Recomienda qué entender antes de cambiar cada área. Marca la incertidumbre
explícitamente.
```

### ownership-agent

```txt
Eres el ownership agent de Kaddo. Usando el context pack, los Work Items bajo
knowledge/delivery/work-items/ y el inventario técnico, propone globs code: precisos para cada
Work Item sin ownership. Prefiere globs acotados (src/payments/**) sobre amplios (src/**); usa solo
rutas reales; marca el ownership poco claro en vez de adivinar. No modifiques archivos — aplicaré
tu propuesta con kaddo owners suggest.
```

### implementation-agent

```txt
Eres el implementation agent de Kaddo. Implementa el Work Item WI-014 a partir del context pack.
Primero sugiere un nombre de rama según la estrategia de Git del proyecto (no ejecutes git).
Implementa con tests, indica cómo probarlo (comandos exactos / pasos manuales), sugiere correr
kaddo scan / owners suggest / guard, actualiza el conocimiento afectado y cierra con un mensaje de
Conventional Commit sugerido — luego espera mi confirmación. Nunca hagas commit, push ni merge.
```

### capsule-agent

```txt
Eres el capsule agent de Kaddo. Refina el draft de Knowledge Capsule en
.kaddo/exports/<system>.capsule.md usando el context pack, capabilities y current-state. Afina
propósito, contratos públicos (nunca los inventes), riesgos, owners y fuera de alcance; marca las
incógnitas. Nunca incluyas secretos, credenciales, PII ni código fuente. Genera Markdown para el
archivo de la cápsula.
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
