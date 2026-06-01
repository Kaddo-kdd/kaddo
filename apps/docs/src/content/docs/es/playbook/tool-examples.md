---
title: Ejemplos con otras herramientas
description: Patrones de uso para combinar Kaddo con GitHub Issues, Jira/Linear, OpenSpec, frameworks de agentes y chats LLM.
---

Kaddo es la **capa de conocimiento cerca del código**. No reemplaza tu issue tracker, tu
tablero de delivery ni tu framework de agentes — los complementa.

> Estos son **patrones de uso**, no integraciones oficiales. Kaddo no se conecta a estas
> herramientas automáticamente a menos que la integración se implemente explícitamente.

## Kaddo + GitHub Issues

Usa Kaddo para conocimiento y trazabilidad, GitHub Issues para seguimiento de tareas.

```txt
Work Item de Kaddo → GitHub Issue
```

Mantén el ID del Work Item en el título o cuerpo del issue para que el conocimiento y la tarea
queden enlazados.

## Kaddo + Jira / Linear

Usa Jira/Linear para tableros de delivery y reporting, Kaddo para el conocimiento de producto
cerca del código.

```txt
Candidato del roadmap → Work Item de Kaddo → ticket de Jira/Linear
```

El ticket rastrea el delivery; el Work Item preserva el porqué y qué conocimiento aplica.

## Kaddo + OpenSpec

Usa OpenSpec para propuestas de cambio estructuradas y Kaddo para el ciclo de vida del
conocimiento.

```txt
Cambio de OpenSpec → Work Item de Kaddo → ownership de Guard
```

El cambio de OpenSpec define la propuesta; el Work Item lo conecta al código y a las señales
de drift.

## Kaddo + BMAD / Gentle-AI

Usa esas herramientas para flujos de agentes y Kaddo como la capa de conocimiento que leen y
sobre la que escriben de vuelta.

```txt
Context pack de Kaddo → framework de agentes → artefactos de Kaddo
```

## Kaddo + Cursor / Claude / ChatGPT / Windsurf

Usa los context packs y prompts de agente de Kaddo directamente dentro de tu chat LLM.

```txt
.kaddo/context-pack.md + architecture/agents/*.md → output del LLM → architecture/*.md
```

El CLI prepara el input; tu LLM produce entendimiento; tú lo guardas de vuelta como
artefactos.

---

Siguiente: [Guía de colaboración](/es/playbook/collaboration/) — operar Kaddo en equipo.
