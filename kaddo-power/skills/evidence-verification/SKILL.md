---
name: evidence-verification
description: "Estandarizar la recolección de evidencia de implementación y la verificación de Criterios de Aceptación antes de completar un Work Item. Use when: Después de que la implementación y las pruebas de un Work Item terminan, antes de llamar `kaddo learn`."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Evidence Verification Skill

## Purpose

Estandarizar la recolección de evidencia de implementación y la verificación de Criterios de
Aceptación antes de completar un Work Item.

## When to use

Después de que la implementación y las pruebas de un Work Item terminan, antes de llamar
`kaddo learn`.

## Inputs

- El Work Item (id, ACs, affected_modules, release_gates, completion_exceptions).
- El diff o lista de archivos modificados.
- Resultados de pruebas y validaciones.
- Excepciones propuestas con categoría e impacto.

## Output

Un reporte de verificación: estado por AC, release gates, excepciones, desviaciones planned vs
actual, y decisión de completitud (READY_TO_COMPLETE | NEEDS_WORK | BLOCKED | READY_WITH_EXCEPTIONS).

## Rules

- Nunca marcar un AC como passed sin evidencia concreta.
- Nunca omitir un release gate fallido sin registrar una excepción aceptada.
- No incluir rutas de secretos en changed_paths.
- Usar `kaddo verify` o MCP tools `kaddo_collect_evidence`/`kaddo_verify_work_item`.

## Quality checklist

- Cada AC tiene un status explícito.
- Los release gates fallidos tienen blocker documentado.
- Las excepciones aceptadas tienen approved_by y razón.
- No hay rutas de secretos en la evidencia.
- La decisión de completitud es coherente con ACs y gates.

## Example output

Un reporte de verificación con ACs, gates, excepciones y decisión de completitud.
