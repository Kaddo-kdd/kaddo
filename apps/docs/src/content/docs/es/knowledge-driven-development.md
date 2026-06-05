---
title: Knowledge Driven Development
description: Qué es Knowledge Driven Development y cómo Kaddo aplica sus principios al desarrollo de software asistido por IA.
---

## ¿Qué es Knowledge Driven Development?

**Knowledge Driven Development (KDD)** es un enfoque para construir software en el que el
**conocimiento** detrás de un sistema — por qué existe, qué hace, cómo está construido y cómo
evoluciona — se trata como un activo de primera clase, se mantiene cerca del código y se
actualiza a medida que el sistema cambia. Se apoya en ideas establecidas de la ingeniería de
software y la gestión del conocimiento: capturar decisiones, preservar contexto y reducir la
brecha entre lo que un equipo sabe y lo que el código registra.

KDD **no** es un concepto inventado por Kaddo. Es una idea previa sobre la que Kaddo
construye.

## Relación con Kaddo

> **Kaddo no inventó Knowledge Driven Development.**
>
> Kaddo ofrece una **implementación práctica de los principios de KDD para el desarrollo de
> software asistido por IA** — para la era de los LLMs, los agentes y los repositorios
> modernos.

Donde KDD es una filosofía, Kaddo es un toolkit concreto: un CLI determinístico más prompt
packs de agentes que operacionalizan KDD para que el conocimiento de negocio, el pensamiento
de producto, las decisiones técnicas y los flujos de entrega permanezcan conectados al
código.

## Capas de conocimiento

Kaddo organiza el conocimiento del proyecto en cuatro capas macro:

```txt
Business → Product → Tech → Delivery
```

- **Business** — por qué existe.
- **Product** — qué construimos.
- **Tech** — cómo lo construimos.
- **Delivery** — cómo lo evolucionamos.

## Madurez del conocimiento

El conocimiento crece progresivamente, reconocido por significado (type del front-matter), no
por nombres de archivo:

```txt
Consolidated → Structured → Traceable
```

## Human-in-the-loop

El conocimiento guía el desarrollo, pero las **decisiones críticas siguen siendo humanas**.
El CLI de Kaddo es determinístico y nunca llama a un LLM; los agentes corren en tu chat y
proponen, mientras un humano confirma. Kaddo nunca commitea, hace push ni merge por su
cuenta.

## Por qué importa en la era de IA

Los agentes de IA construyen sobre suposiciones cuando les falta contexto. Al mantener el
conocimiento mínimo suficiente junto al código — y empaquetarlo de forma determinística para
un LLM — Kaddo permite que los agentes trabajen sobre conocimiento real en vez de prompts
gigantes y ruidosos.

Mira el [Manifiesto](/es/manifesto/) para la filosofía completa, y [Acerca de](/es/about/)
para el origen y el autor del proyecto.
