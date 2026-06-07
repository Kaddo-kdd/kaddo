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

`kaddo add agents` crea `knowledge/agents/`:

Los agentes se instalan en **carpetas por capa**:

```
knowledge/agents/
  README.md
  business/   business-agent.md
  product/    bootstrap-agent.md · capability-agent.md
  tech/       architecture-agent.md · codebase-agent.md · stack-agent.md ·
              security-agent.md · standards-agent.md · module-design-agent.md · adr-agent.md
  delivery/   backlog-agent.md · roadmap-agent.md · work-item-agent.md · implementation-agent.md · git-strategy-agent.md
  utilities/  legacy-agent.md
```

Los archivos existentes nunca se sobrescriben en silencio — al re-ejecutar solo se instalan
los que falten. `kaddo init` **no** instala agentes; agrégalos cuando los necesites.

## Instalación progresiva y grupos de agentes

Los agentes se instalan **progresivamente**, por capa — no obtienes todos de golpe. Por
defecto `kaddo add agents` instala solo el conjunto recomendado para el estado del proyecto:

| Estado | Instala |
|---|---|
| `new` | business-agent · bootstrap-agent · codebase-agent · roadmap-agent · backlog-agent · work-item-agent · implementation-agent |
| `pre-ai` | capability-agent · architecture-agent · roadmap-agent · backlog-agent · work-item-agent · implementation-agent |
| `legacy` | legacy-agent · architecture-agent · capability-agent · roadmap-agent · backlog-agent · work-item-agent · implementation-agent |

Los agentes se organizan en **grupos** por capa:

| Grupo | Agentes |
|---|---|
| `business` | business-agent |
| `product` | bootstrap-agent · capability-agent |
| `tech` | architecture-agent · codebase-agent · stack-agent · security-agent · standards-agent · module-design-agent · adr-agent |
| `delivery` | backlog-agent · roadmap-agent · work-item-agent · implementation-agent · git-strategy-agent |
| `utilities` | legacy-agent |

```bash
kaddo add agents                 # conjunto recomendado para el estado del proyecto
kaddo add agents --all           # todos los agentes
kaddo add agents --group tech    # un grupo de capa
```

`kaddo understand` reporta tu **fase actual** a partir del estado real del conocimiento —
Discovery → Planning → Delivery Preparation → Active Delivery → Maintenance — y recomienda el
agente para esa fase (ver [understand](/es/commands/understand/#recomendaciones-según-el-estado-real)).

## Agentes de entendimiento

| Agente | Propósito | Guarda en |
|---|---|---|
| `capability-agent` | Extraer/proponer capacidades del sistema | `knowledge/product/capabilities.md` |
| `architecture-agent` | Reconstruir el baseline de arquitectura | `knowledge/tech/current-state.md` |
| `roadmap-agent` | Proponer candidatos de roadmap | `knowledge/delivery/roadmap.md` |
| `legacy-agent` | Detectar riesgos/incógnitas antes de tocar código legacy | `knowledge/legacy/*.md` |
| `adr-agent` | Proponer decisiones de arquitectura candidatas | `knowledge/tech/decision-candidates.md` |

## Agentes de bootstrap

Para proyectos nuevos, refinan la base de conocimiento creada por
[`kaddo bootstrap`](/es/commands/bootstrap/) en las capas Business → Product → Tech → Delivery.

| Agente | Propósito | Guarda en |
|---|---|---|
| `business-agent` | Convertir una idea en definición de negocio | `knowledge/business/*.md` |
| `bootstrap-agent` | De negocio a capacidades, atributos de calidad y roadmap | `knowledge/bootstrap-summary.md`, `capabilities.md`, `roadmap.md` |
| `codebase-agent` | Proponer una base de codebase (sin código) | `knowledge/tech/codebase.md` |

## Agentes operativos

Apoyan la ejecución diaria y los artefactos multirepo / globales (VS-017).

| Agente | Propósito | Guarda en |
|---|---|---|
| `backlog-agent` | Capturar ideas/notas crudas en un draft o candidato de roadmap (sin refinar) | `knowledge/delivery/work-items/draft/` o un candidato de roadmap |
| `work-item-agent` | Redactar y refinar un work item desde el contexto | work item activo |
| `implementation-agent` | Implementar un Work Item refinado; sugerir branch/scan/owners/guard | código · tests · conocimiento actualizado |
| `git-strategy-agent` | Refinar la estrategia de Git | `knowledge/tech/git-strategy.md` |
| `security-agent` | Documentar consideraciones de seguridad (sin escaneo) | `knowledge/tech/security.md` |
| `standards-agent` | Definir estándares ligeros | `knowledge/tech/standards.md` |
| `stack-agent` | Documentar el stack | `knowledge/tech/stack.md` |
| `module-design-agent` | Completar el diseño de un módulo | `knowledge/tech/modules/<id>/module-design.md` |

Cada prompt declara: Role · When to Use · Input Required · Expected Output · Instructions ·
Constraints · Output Format · Where to Save the Result · Quality Checklist. El input
principal siempre es `.kaddo/context-pack.md`.

## Límites de responsabilidad y Agent Trace

Cada agente oficial conoce su **responsabilidad**, sus **límites** y el **siguiente paso** del
flujo. Cada prompt termina con dos bloques estándar para que el flujo sea auditable y ningún
agente actúe fuera de su carril:

- **Responsibility & Boundaries** — de qué es responsable, qué produce, qué puede sugerir y qué
  NO debe sugerir. Los agentes producen **solo conocimiento**: nunca ejecutan Git, código ni
  comandos.
- **Agent Trace** — un pie que toda respuesta repite:

```text
────────────────────────
Agent: roadmap-agent

Produced:
knowledge/delivery/roadmap.md

Next:
kaddo create --from roadmap
work-item-agent
────────────────────────
```

Responde, para cualquier respuesta: **quién la produjo, qué produjo y qué sigue.**

### Matriz de responsabilidades

| Agente | Responsable de | Produce | Puede sugerir | NO debe sugerir |
|---|---|---|---|---|
| `business-agent` | Problema, Usuarios, Reglas, Restricciones | `knowledge/business/business.md` | product-agent | Git, ramas, commits, código |
| `product-agent` | Producto, Capacidades, Alcance | `product.md`, `capabilities.md` | roadmap-agent | Git, implementación |
| `capability-agent` | Capabilities | `capabilities.md` | roadmap-agent | Git, implementación |
| `codebase-agent` | Stack, Estructura, Estándares | `knowledge/tech/codebase.md` | architecture-agent, decision-agent | Git, código de producción |
| `architecture-agent` | Arquitectura, Estado técnico, Riesgos | `current-state.md` | decision-agent, roadmap-agent | Git, ramas, código |
| `decision-agent` / `adr-agent` | ADRs | `knowledge/tech/decisions/` | implementation-agent | Git, ramas, código |
| `roadmap-agent` | Roadmap, Iniciativas, Candidatos WI | `roadmap.md` | `kaddo create --from roadmap`, work-item-agent | **ramas, commits, PRs**, código |
| `backlog-agent` | Capturar ideas, estructurar trabajo nuevo | `work-items/draft/`, candidatos de roadmap | work-item-agent, roadmap-agent | código, git, **auto-ejecutar otros agentes** |
| `work-item-agent` | Refinamiento de Work Items | `work-items/` | implementation-agent | **commits, PRs, ramas** |
| `implementation-agent` | Implementación | código, tests, migraciones | **una rama** (según estrategia de Git), **un mensaje de commit**, scan, owners suggest, guard | ejecutar git, commitear/pushear/mergear sin confirmación |
| `guard-agent` | Knowledge drift | hallazgos, advertencias | actualizar conocimiento, actualizar ownership | ramas, commits, código |

### Modelo de responsabilidad de Git

Solo el **implementation-agent** puede sugerir una rama de Git, y únicamente respetando
`knowledge/tech/git-strategy.md` (`.kaddo/git.yml`). Aun así nunca ejecuta git — sugiere y espera
confirmación humana explícita. El roadmap-agent, work-item-agent, business-agent y product-agent
**nunca** deben sugerir ramas, commits ni pull requests.

> Esto corrige un drift real visto en la validación, donde el roadmap-agent sugería
> `Create branch feature/wi-001-...` antes de que existiera ningún Work Item.

### Reglas de handoff

```text
roadmap-agent
  → kaddo create --from roadmap
  → work-item-agent
  → implementation-agent
  → kaddo scan → kaddo owners suggest → kaddo guard → kaddo explain

idea (en cualquier momento)
  → backlog-agent → draft / candidato de roadmap → (decide el humano) → work-item-agent
```

`kaddo understand` recomienda agentes siguiendo exactamente estos handoffs.

El **backlog-agent** es la puerta de entrada para ideas nuevas: captura texto libre, viñetas,
notas de reunión o transcripciones en un **draft** de Work Item o un **candidato de roadmap**, no
refina ni implementa, y siempre devuelve a una decisión humana — nunca auto-ejecuta el
work-item-agent ni el implementation-agent.

## Escribir un agente custom

Un agente es un prompt Markdown versionable — no código. Para crear el tuyo, agrega un
archivo `<nombre>-agent.md` en `knowledge/agents/` siguiendo la estructura canónica de
abajo. Estas nueve secciones son **obligatorias** (los agentes propios de Kaddo se validan
contra ellas), así que consérvalas por consistencia:

```markdown
# <Nombre> Agent

## Role
Quién es el agente y qué hace. Indica siempre: no escribe código, no inventa hechos
de negocio, infiere con cautela y marca supuestos.

## When to Use
Qué comandos lo preceden (p. ej. `kaddo scan` + `kaddo context`) y en qué estados
de proyecto (new / pre-ai / legacy).

## Input Required
Input principal: `.kaddo/context-pack.md`. Opcional: README, docs, OpenAPI, notas.

## Expected Output
El artefacto que produce y dónde corresponde.

## Instructions
Pasos numerados de qué analizar y producir.

## Constraints
Qué NO hacer (no inventar negocio, marcar supuestos, no generar código, etc.).

## Output Format
La forma exacta de la salida (un bloque markdown con las secciones del artefacto).

## Where to Save the Result
La ruta destino — debe coincidir con el `outputPath` de la plantilla relacionada.

## Quality Checklist
- [ ] criterios de calidad de la salida
```

Cuatro reglas mantienen un agente custom alineado con Kaddo:

1. **Incluye las nueve secciones** de arriba (título + los encabezados `##`).
2. **Referencia `.kaddo/context-pack.md`** como input principal — Kaddo nunca llama a un
   LLM, así que el humano pega el prompt en su propio chat.
3. **Haz coincidir la ruta de salida** en *Where to Save the Result* con el `outputPath`
   de la plantilla relacionada, preservando la trazabilidad agente ↔ plantilla.
4. Mantenlo como **prompt, no código**: declarativo, versionable, sin ejecución.

## Flujo

```bash
kaddo scan          # señales técnicas deterministas
kaddo context       # → .kaddo/context-pack.md
kaddo add agents    # → knowledge/agents/*.md
```

Luego, en tu chat LLM:

1. Pega `.kaddo/context-pack.md`.
2. Pega el prompt del agente para tu tarea.
3. Guarda el output donde indique el agente.

## Orden recomendado según el estado

- **new** → roadmap-agent → architecture-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

## El output del roadmap agent

El `roadmap-agent` es el puente entre el entendimiento y la ejecución. Usado en tu chat LLM,
produce un `knowledge/delivery/roadmap.md` **estructurado**, pensado para ser legible hoy y
procesable por máquina más adelante:

```txt
context pack → roadmap agent → knowledge/delivery/roadmap.md → (futuro) kaddo create --from roadmap
```

Cada iniciativa (`RM-001`, `RM-002`, …) incluye objetivo, capacidades relacionadas, área del
proyecto, impacto, riesgo, un **Knowledge Level sugerido** (K1–K4), dependencias, por qué va
ahora, y **candidate work items** con tipo, knowledge level sugerido, valor esperado y notas.
El roadmap también lista supuestos, un orden de ejecución sugerido, una lista "Not Now" y el
siguiente work item recomendado.

> Las iniciativas y work items son **candidatos** para revisión humana, no decisiones
> finales. El roadmap se genera en tu chat LLM, nunca en el CLI, y las prioridades se
> adaptan al estado del proyecto (new / pre-ai / legacy). Un futuro
> `kaddo create --from roadmap` podrá leer estos candidatos — pero aún no está implementado.

## CLI vs LLM

- **Kaddo CLI** prepara, detecta, estructura y guarda: `init`, `scan`, `context`,
  `add agents`, `create`, `guard`.
- **Tu LLM + agentes** interpretan, entienden y proponen: capacidades, arquitectura,
  roadmap, riesgos.
