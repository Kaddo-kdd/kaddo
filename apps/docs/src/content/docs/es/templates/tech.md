---
title: Plantillas de tech
description: Cómo lo construimos — codebase, current state, decisiones, stack y atributos de calidad.
---

La capa **Tech** responde *¿cómo lo construimos?* — vive bajo `knowledge/tech/`.

| Plantilla | Propósito | Ruta | Agente |
|---|---|---|---|
| Codebase | Estructura y convenciones previstas del codebase (sin código) | `knowledge/tech/codebase.md` | `codebase-agent` |
| Current State | Baseline de arquitectura reconstruido | `knowledge/tech/current-state.md` | `architecture-agent` |
| Notas de arquitectura | Notas de trabajo, aún sin decidir | `knowledge/tech/architecture-notes.md` | — |
| Decision Candidates | Decisiones candidatas para revisión | `knowledge/tech/decision-candidates.md` | `adr-agent` |
| Quality Attributes | Atributos de calidad priorizados + trade-offs | `knowledge/tech/quality-attributes.md` | `bootstrap-agent` |
| ADR | Una decisión aceptada | `knowledge/tech/decisions/` | — |

> Stack, estándares, seguridad y estrategia de Git también son artefactos de Tech — ver
> [Plantillas de operaciones](/es/templates/operations/), instalables con `kaddo add`.

## Current State

Componentes, datos e integraciones, aspectos transversales, brechas conocidas y
supuestos — el baseline que el `architecture-agent` reconstruye desde el context pack.

## Notas de arquitectura

Explícitamente no vinculantes: tema, contexto, opciones y hacia dónde te inclinas.
Promuévelas a Decision Candidate o ADR cuando estén listas.

## Decision Candidates

Entradas `DC-001` con contexto, opciones, opción recomendada y trade-offs. Promueve las
candidatas aceptadas a ADRs individuales.

## Quality Attributes, Codebase Foundation y Bootstrap Summary

Generadas por [`kaddo bootstrap`](/es/commands/bootstrap/) para proyectos nuevos: atributos
de calidad priorizados (nada de "todo alto"), la base de codebase prevista (estructura y
convenciones, **nunca** código fuente) y un índice de la base de conocimiento inicial con
el siguiente paso.

## ADR

Front matter (`id`, `status`, `date`). Secciones: Status · Contexto · Decisión ·
Consecuencias (incluyendo desventajas) · Alternativas consideradas. Instala el módulo
`adr` con `kaddo add adr` para crearlas como work items.
