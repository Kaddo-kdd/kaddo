---
title: Introducción
description: Qué es Kaddo y la capa que ocupa.
---

**Prepara cualquier base de código para evolucionar con ayuda de IA. Kaddo ayuda a tu repo
a recordar por qué existe el código.**

Kaddo es un **CLI y toolkit de prompts de agentes** open source basado en **Knowledge
Driven Development (KDD)**. Escanea tu repo, prepara contexto para tu LLM, guía el
entendimiento con agentes, convierte candidatos del roadmap en Work Items, declara
ownership y avisa cuando los cambios de código podrían dejar el conocimiento atrás — sin
convertir el desarrollo en burocracia.

Trabaja en dos capas: el **CLI** hace el trabajo determinístico (sin IA, sin API key) y tu
**LLM** hace la interpretación usando los agentes de Kaddo. Mira la página de [Flujo de
trabajo](/es/workflow/) para el loop completo y el reparto CLI vs LLM.

> **Knowledge Driven Development ≠ Kaddo.** KDD es un concepto previo de la ingeniería de
> software y la gestión del conocimiento. Kaddo es una **implementación práctica de los
> principios de KDD para el desarrollo de software asistido por IA** — los aplica; no los
> inventó. Mira [Knowledge Driven Development](/es/knowledge-driven-development/).

**La pregunta central:** *¿Cómo sabe Kaddo qué conocimiento se vio impactado por este cambio?*

## Qué no es Kaddo

- No es un generador de código
- No es un framework de agentes
- No reemplaza a Jira, Linear ni herramientas de documentación
- No es una plataforma

## La capa que ocupa Kaddo

```
Herramientas de ejecución
      ↓
Frameworks de agentes
      ↓
Especificaciones
      ↓
Kaddo
      ↓
Conocimiento del producto
```

Kaddo pone el conocimiento primero, y luego deja que la IA te ayude a construir.
