---
title: Plantillas de negocio
description: Product brief, problema, usuarios, propuesta de valor, reglas de negocio, restricciones y glosario para proyectos nuevos.
---

Las plantillas de **negocio** capturan la intención de un proyecto nuevo. Las genera
[`kaddo bootstrap`](/es/commands/bootstrap/) bajo `architecture/business/` y se refinan con
el `business-agent`. Kaddo nunca inventa hechos de negocio — vienen con `TBD`, supuestos y
preguntas abiertas.

| Plantilla | Propósito | Ruta de salida | Comando | Agente |
|---|---|---|---|---|
| Product Brief | El producto en una página | `architecture/business/product-brief.md` | `kaddo bootstrap` | `business-agent` |
| Problem Statement | El problema, sin asumir la solución | `architecture/business/problem.md` | `kaddo bootstrap` | `business-agent` |
| Users & Personas | Usuarios primarios/secundarios con objetivos | `architecture/business/users.md` | `kaddo bootstrap` | `business-agent` |
| Value Proposition | Para quién, qué, por qué mejor | `architecture/business/value-proposition.md` | `kaddo bootstrap` | `business-agent` |
| Business Rules | Reglas de producto como afirmaciones testables | `architecture/business/business-rules.md` | `kaddo bootstrap` | `business-agent` |
| Constraints | Límites de negocio, regulatorios y de recursos | `architecture/business/constraints.md` | `kaddo bootstrap` | `business-agent` |
| Glossary | Vocabulario compartido del proyecto | `architecture/business/glossary.md` | `kaddo bootstrap` | `business-agent` |

Cada plantilla trae secciones mínimas más **Assumptions**, **Open questions** y un
**Quality checklist**, para que el conocimiento sea honesto sobre lo que aún no se sabe.

Estas plantillas alimentan las capas de bootstrap
**Business → Architecture → Codebase → Development** junto con las plantillas
[`quality-attributes`](/es/templates/architecture/),
[`codebase-foundation`](/es/templates/architecture/) y `bootstrap-summary`.
