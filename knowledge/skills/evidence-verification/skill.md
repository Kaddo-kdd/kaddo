---
type: skill
id: evidence-verification
name: evidence-verification
title: Evidence Verification Skill
version: 3.94.0
group: delivery
applies_to:
  - implementation-agent
  - guard-agent
---
# Evidence Verification Skill

## Purpose

Estandarizar la recolección de evidencia de implementación y la verificación de Criterios de
Aceptación antes de completar un Work Item. Asegura que la decisión de completitud se basa en
evidencia estructurada, no en supuestos.

## When to use

Después de que la implementación y las pruebas de un Work Item terminan, antes de llamar
`kaddo learn`. El agente debe verificar que cada AC tiene evidencia, que los release gates
están evaluados y que las excepciones de completitud están documentadas.

## Inputs

- El Work Item (id, ACs, affected_modules, release_gates, completion_exceptions).
- El diff o lista de archivos modificados.
- Resultados de pruebas y validaciones (comando, status, razón).
- Excepciones propuestas con categoría e impacto.

## Output

Un reporte de verificación estructurado con:

1. **Estado por AC**: cada criterio con status (passed/failed/not-verified/manual-review-required)
   y evidencia.
2. **Release Gates**: evaluación de cada gate (passed/failed/blocked/waived/not-applicable).
3. **Excepciones**: cada excepción con status (proposed/accepted/rejected/deferred/resolved).
4. **Desviaciones planned vs actual**: módulos planeados vs tocados.
5. **Decisión de completitud**: READY_TO_COMPLETE | NEEDS_WORK | BLOCKED | READY_WITH_EXCEPTIONS.

## Rules

- Nunca marcar un AC como passed sin evidencia concreta (test, diff, screenshot, log).
- Nunca omitir un release gate fallido sin registrar una excepción aceptada.
- No incluir rutas de secretos (.env, credenciales, tokens, claves) en changed_paths.
- No inventar evidencia; si un AC no fue verificado, marcarlo como not-verified.
- Usar `kaddo verify` o las MCP tools `kaddo_collect_evidence`/`kaddo_verify_work_item`
  para ejecutar la verificación — no implementar la lógica manualmente.

## Quality checklist

- Cada AC tiene un status explícito.
- Los ACs marcados manual-review-required tienen una razón.
- Los release gates fallidos tienen un blocker documentado.
- Las excepciones aceptadas tienen approved_by y razón.
- No hay rutas de secretos en la evidencia.
- La decisión de completitud es coherente con los ACs y gates.

## Example output

```txt
Verification Report — WI-005

Acceptance Criteria:
  ✓ [passed] Evidence collection produces structured output
  ✓ [passed] AC verification maps each criterion
  ✗ [failed] Release gates block completion — gate "security-review" still pending
  · [not-verified] Documentation updated

Release Gates:
  ✓ [passed] unit-tests
  · [pending] security-review

Completion Decision: NEEDS_WORK
  Blockers: AC failed: "Release gates block completion..."
```
