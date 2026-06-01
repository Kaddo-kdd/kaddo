---
title: Conceptos
description: El vocabulario propio de Kaddo — Work Item, Nivel de Conocimiento, Context Pack, Agent Prompt Pack, Ownership, Knowledge Drift, Guard Lite y Explain.
---

Kaddo tiene su propio vocabulario. Entender estos términos es la diferencia entre tratar a
Kaddo como "otra herramienta de documentación" y usarlo como un sistema de conocimiento vivo
cerca del código.

## Work Item

Un **Work Item** es la unidad trazable más pequeña de evolución de producto en Kaddo. **No es
solo una tarea.**

Puede representar un:

- feature
- hotfix
- bugfix
- spike
- cambio de arquitectura
- migración
- seguimiento de incidente
- mejora de capacidad
- actualización de documentación o conocimiento

Un Work Item captura:

- **por qué** existe el cambio
- **qué contexto** se requiere
- **qué nivel de conocimiento** aplica
- **qué artefacto/fuente** lo originó
- **qué ownership de código** toca
- **qué aprendizaje** debe preservarse

Conecta todo el loop:

```txt
candidato del roadmap → decisión de implementación → cambio de código → ownership → guard → aprendizaje
```

## Nivel de Conocimiento

Un **Nivel de Conocimiento** define el contexto mínimo requerido antes de actuar. Existe para
evitar burocracia: los cambios pequeños no necesitan documentación pesada.

| Nivel | Contexto mínimo |
|---|---|
| **K0** | No requiere conocimiento formal |
| **K1** | Problema + resultado esperado |
| **K2** | Problema + resultado esperado + impacto + criterios de aceptación |
| **K3** | Problema + impacto + criterios de aceptación + diseño |
| **K4** | Problema + impacto + diseño + ADR + riesgos |

## Context Pack

Un **Context Pack** es un paquete determinístico generado por el CLI (`kaddo context` →
`.kaddo/context-pack.md`) para preparar el input del LLM. **No** es la salida del LLM — es el
input estructurado que entregas a tu agente.

## Agent Prompt Pack

Un **Agent Prompt Pack** es un prompt en Markdown versionable (instalado con `kaddo add
agents` en `architecture/agents/*.md`) que le dice al LLM qué rol asumir, qué input usar y qué
artefacto producir. Kaddo entrega los prompts; no los ejecuta.

## Ownership

El **Ownership** es metadata que conecta artefactos de conocimiento con rutas de código,
declarada en el front matter del artefacto:

```yaml
code:
  - src/payments/**
```

Sin archivo central de mapeo — el ownership vive junto al conocimiento.

## Knowledge Drift

El **Knowledge Drift** es una posible divergencia entre la implementación y los artefactos de
conocimiento que la explican o gobiernan — el código avanzó, el conocimiento no.

## Guard Lite

**Guard Lite** (`kaddo guard`) es una verificación determinística que lee `git diff`, compara
los archivos cambiados con los globs `code:` de los artefactos y muestra un **FYI no
bloqueante** cuando el artefacto que coincide no se actualizó en el mismo diff. Es silencioso
cuando ningún artefacto declara ownership.

## Explain

**Explain** (`kaddo explain`) resume lo que Kaddo sabe actualmente del proyecto — estado,
stack, artefactos presentes, Work Items, cobertura de ownership y próximos pasos sugeridos.
Escribe `.kaddo/explain.md` y `.kaddo/explain.json`.

---

Siguiente: [Prompt Workflow](/es/playbook/prompt-workflow/) — qué hacer en cada paso.
