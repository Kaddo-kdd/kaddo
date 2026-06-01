---
title: Plantillas (resumen)
description: Plantillas consistentes y ligeras para cada artifact de Kaddo.
---

Kaddo incluye **plantillas** para sus artifacts de conocimiento principales para que
nunca inventes la estructura desde cero. Viven en un registro central
(`packages/cli/src/templates/registry.ts`) y respaldan la documentación de abajo.

> **Completo no es lo mismo que largo.** Una buena plantilla guía bien, evita
> ambigüedad y mantiene la trazabilidad — sin convertirse en un formulario
> burocrático. Las plantillas son **guías, no formularios obligatorios**: completa el
> *conocimiento mínimo suficiente* para el cambio en cuestión.

## Qué incluye cada plantilla

- **Propósito** — para qué sirve el artifact.
- **Cuándo usarla** — la situación que la requiere.
- **Ruta de salida** — dónde vive el artifact.
- **Comando / agente relacionado** — cómo se produce.
- **Front matter** — para artifacts con trazabilidad.
- **Secciones** — obligatorias y opcionales.
- **Checklist de calidad** — cómo saber que es suficiente.

## CLI vs LLM vs humano

| Capa | Rol |
|---|---|
| **CLI** | Crea el esqueleto de forma determinista (`init`, `create`, `modules map`, `add`). |
| **Agente LLM** | Completa la interpretación (capacidades, arquitectura, roadmap, diseño). |
| **Humano** | Revisa, decide y edita. Las plantillas hacen rápida la revisión. |

## Categorías

- [Plantillas core](/es/templates/core/) — work item, roadmap, capacidades, knowledge.
- [Plantillas de arquitectura](/es/templates/architecture/) — current state, notas, decision candidates, ADR.
- [Plantillas de módulo](/es/templates/module/) — diseño, stack, seguridad, estándares, ADR por repo.
- [Plantillas de operaciones](/es/templates/operations/) — seguridad, estándares, stack, estrategia de git, incidente, runbook.
- [Plantillas legacy](/es/templates/legacy/) — riesgos, incógnitas, candidatos de modernización.
