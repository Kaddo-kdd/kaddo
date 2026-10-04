---
title: 'Diagramas como conocimiento: Mermaid en Business, Product y Tech'
description: Kaddo ahora trata los diagramas Mermaid como conocimiento de primera clase en Business, Product y Tech. El source vive en Markdown; el Admin lo renderiza — arquitectura, flujos y actores que puedes ver de verdad.
publishedAt: 2026-10-04
author: Julian Dario Luna Patiño
tags:
  - knowledge-driven-development
  - software-architecture
  - ai-assisted-development
locale: es
cover: /blog/knowledge-diagrams/cover.webp
featured: true
translationKey: knowledge-diagrams
---

El conocimiento de proyecto en Kaddo se escribe en Markdown — contexto de negocio, capacidades de
producto, arquitectura técnica, delivery. El texto es excelente para decisiones, reglas y
restricciones. Pero cierto conocimiento se entiende mucho mejor cuando puedes *verlo*: quiénes son los
actores, cómo fluye el valor, qué módulos dependen de cuáles, cómo viaja una petición por el sistema.

Por eso Kaddo ahora trata los **diagramas Mermaid como conocimiento de primera clase** en Business,
Product y Tech. Escribes un bloque ```mermaid``` en el Markdown, y el Admin lo renderiza como
diagrama — mientras el CLI, MCP y Git conservan exactamente el mismo source. Sin formato paralelo, sin
una herramienta de diagramas aparte.

## Una sola fuente de verdad

Un diagrama es **conocimiento, no una imagen decorativa**. Su source vive dentro del Markdown y se
versiona en Git, así que el mismo bloque tiene dos representaciones sin duplicar:

- **CLI / MCP / repositorio** → el source Mermaid permanece como Markdown (los humanos lo leen, los
  LLMs lo entienden, Git lo diffea).
- **Admin** → el bloque se renderiza como diagrama en la vista de detalle de Knowledge.

## Business: actores y flujos de valor

El conocimiento de Business puede mostrar quién participa y cómo se mueve el valor — actores,
participantes externos, procesos de negocio. Aquí el artifact de Business renderiza el ecosistema de
un SaaS de fidelización real: el admin, el comercio local, el cliente final y los servicios externos
(pagos, email).

![Un artifact de Business renderizando un diagrama de actores y relaciones en el Admin](/blog/knowledge-diagrams/business.png)

## Product: capacidades y relaciones

El conocimiento de Product puede mapear capacidades por dominio funcional y cómo se relacionan — mucho
más fácil de captar como diagrama que como una lista anidada.

![Un artifact de capabilities de Product renderizando un diagrama de dominios/capacidades en el Admin](/blog/knowledge-diagrams/product.png)

## Tech: arquitectura y secuencias

El conocimiento técnico es donde los diagramas más rinden: system context, componentes, dependencias,
integraciones y data flows. El artifact de current-state renderiza la arquitectura completa —
clientes, capa de hosting, plataforma de base de datos y proveedores externos.

![Un artifact de current-state de Tech renderizando un diagrama de arquitectura en el Admin](/blog/knowledge-diagrams/tech-architecture.png)

Y no se limita a flowcharts. Un `sequenceDiagram` captura un flujo en el tiempo — aquí, el ciclo de
vida de expiración automática de trials entre un scheduler, una edge function, la base de datos y APIs
externas:

![Un artifact de Tech renderizando un diagrama de secuencia del flujo de expiración de trial](/blog/knowledge-diagrams/tech-sequence.png)

## Los diagramas salen del refinement, grounded en conocimiento real

Estos diagramas no se dibujan a mano en una herramienta aparte. Se producen durante el **refinement**,
por los agentes `business-agent`, `capability-agent` y `architecture-agent`, a partir del mismo
conocimiento con el que se escribe el texto. La regla es estricta: usar un diagrama solo cuando mejore
materialmente la comprensión, y nunca inventar entidades o relaciones para que "parezca completo".

![Salida de refinement de un agente agregando un diagrama Mermaid de ecosistema grounded al conocimiento de Business](/blog/knowledge-diagrams/business-refinement.png)

Si el proveedor de pagos es desconocido, el diagrama no debe mostrar `Application → Stripe`. Texto y
diagrama representan el mismo estado conocido — que es justo lo que mantiene una base de conocimiento
confiable para humanos y agentes de IA.

## Cómo renderiza

El Admin renderiza Mermaid dentro de la vista normal de Knowledge, sobre el renderer de Markdown
existente — no es una vista aparte, ni está atada a filenames concretos, así que cualquier artifact de
Knowledge con un bloque ```mermaid``` se beneficia automáticamente. El render usa el nivel de
seguridad estricto de Mermaid, múltiples diagramas por artifact se renderizan de forma independiente,
un bloque inválido cae a un fallback local sin romper la página, y cualquier diagrama se puede abrir a
**pantalla completa**.

La representación canónica siempre es el source Markdown — Kaddo nunca guarda PNGs ni una base de datos
de diagramas. Mira [Diagramas en el conocimiento (Mermaid)](/es/mermaid-knowledge/) para saber cómo
agregarlos.

Porque la mejor base de conocimiento no solo dice *qué* es un sistema — te deja ver cómo se relacionan
de verdad sus actores, capacidades, flujos y componentes.
