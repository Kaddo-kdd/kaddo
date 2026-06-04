---
title: Plantillas de módulo
description: Diseño, stack, seguridad, estándares y ADRs por repo (multirepo).
---

Generadas bajo `knowledge/tech/modules/<id>/` por
[`kaddo modules map`](/es/modules/multirepo/). Cada una es una plantilla inicial ligera
que refinas con el agente correspondiente.

| Plantilla | Propósito | Ruta | Agente |
|---|---|---|---|
| Module Design | Propósito, límites, dependencias | `knowledge/tech/modules/<id>/module-design.md` | `module-design-agent` |
| Module Stack | El stack del módulo | `knowledge/tech/modules/<id>/stack.md` | `stack-agent` |
| Module Security | Inquietudes de seguridad del módulo | `knowledge/tech/modules/<id>/security.md` | `security-agent` |
| Module Standards | Estándares del módulo | `knowledge/tech/modules/<id>/standards.md` | `standards-agent` |
| Module ADR | Decisión a nivel de módulo | `knowledge/tech/modules/<id>/adrs/` | — |

## Module Design

Front matter (`module`, `owner`, `repoPath`, `capabilities`, `code`). Secciones:
Propósito · Límites · Entradas/Salidas · Dependencias · Capacidades relacionadas ·
Riesgos y preguntas abiertas.

## Module Stack / Security / Standards

Versiones a nivel de módulo de las plantillas globales de operaciones — documenta solo
lo que difiere o especializa respecto a los artifacts globales.

## Module ADR

Una decisión que afecta solo a este módulo. Las decisiones globales van en los ADRs del
repo de arquitectura.
