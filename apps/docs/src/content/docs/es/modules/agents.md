---
title: Agentes (Prompt Packs)
description: Prompts reutilizables que convierten context packs en conocimiento del proyecto.
---

```bash
kaddo add agents
```

Los prompt packs de agentes son prompts en Markdown versionables que usas **en tu chat LLM
favorito** (Claude, ChatGPT, Cursor, Copilot, Windsurf…). Convierten un context pack de
Kaddo en conocimiento estructurado del proyecto.

> **Kaddo no ejecuta estos agentes.** El CLI prepara contexto determinista; el LLM hace la
> interpretación. Sin API key, sin proveedor de modelo, sin automatización.

## Instalación

`kaddo add agents` crea `architecture/agents/`:

```
architecture/agents/
  README.md
  capability-agent.md
  architecture-agent.md
  roadmap-agent.md
  legacy-agent.md
  adr-agent.md
```

Los archivos existentes nunca se sobrescriben en silencio — al re-ejecutar solo se instalan
los que falten. `kaddo init` **no** instala agentes; agrégalos cuando los necesites.

## Los agentes

| Agente | Propósito | Guarda en |
|---|---|---|
| `capability-agent` | Extraer/proponer capacidades del sistema | `architecture/capabilities.md` |
| `architecture-agent` | Reconstruir el baseline de arquitectura | `architecture/current-state.md` |
| `roadmap-agent` | Proponer candidatos de roadmap | `architecture/roadmap.md` |
| `legacy-agent` | Detectar riesgos/incógnitas antes de tocar código legacy | `architecture/legacy/*.md` |
| `adr-agent` | Proponer decisiones de arquitectura candidatas | `architecture/decision-candidates.md` |

Cada prompt declara: Role · When to Use · Input Required · Expected Output · Instructions ·
Constraints · Output Format · Where to Save the Result · Quality Checklist. El input
principal siempre es `.kaddo/context-pack.md`.

## Flujo

```bash
kaddo scan          # señales técnicas deterministas
kaddo context       # → .kaddo/context-pack.md
kaddo add agents    # → architecture/agents/*.md
```

Luego, en tu chat LLM:

1. Pega `.kaddo/context-pack.md`.
2. Pega el prompt del agente para tu tarea.
3. Guarda el output donde indique el agente.

## Orden recomendado según el estado

- **new** → roadmap-agent → architecture-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

## CLI vs LLM

- **Kaddo CLI** prepara, detecta, estructura y guarda: `init`, `scan`, `context`,
  `add agents`, `create`, `guard`.
- **Tu LLM + agentes** interpretan, entienden y proponen: capacidades, arquitectura,
  roadmap, riesgos.
