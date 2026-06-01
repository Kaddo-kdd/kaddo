---
title: Plantillas de arquitectura
description: Current state, notas de arquitectura, decision candidates y ADRs.
---

Plantillas para capturar y decidir arquitectura.

| Plantilla | Propósito | Ruta | Agente |
|---|---|---|---|
| Current State | Baseline de arquitectura reconstruido | `architecture/current-state.md` | `architecture-agent` |
| Notas de arquitectura | Notas de trabajo, aún sin decidir | `architecture/architecture-notes.md` | — |
| Decision Candidates | Decisiones candidatas para revisión | `architecture/decision-candidates.md` | `adr-agent` |
| ADR | Una decisión aceptada | `architecture/decisions/` | — |

## Current State

Componentes, datos e integraciones, aspectos transversales, brechas conocidas y
supuestos — el baseline que el `architecture-agent` reconstruye desde el context pack.

## Notas de arquitectura

Explícitamente no vinculantes: tema, contexto, opciones y hacia dónde te inclinas.
Promuévelas a Decision Candidate o ADR cuando estén listas.

## Decision Candidates

Entradas `DC-001` con contexto, opciones, opción recomendada y trade-offs. Promueve las
candidatas aceptadas a ADRs individuales.

## ADR

Front matter (`id`, `status`, `date`). Secciones: Status · Contexto · Decisión ·
Consecuencias (incluyendo desventajas) · Alternativas consideradas. Instala el módulo
`adr` con `kaddo add adr` para crearlas como work items.
