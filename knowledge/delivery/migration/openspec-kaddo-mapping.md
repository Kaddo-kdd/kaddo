---
type: analysis
id: openspec-kaddo-mapping
title: OpenSpec → Kaddo Mapping Matrix
status: current
generated_by: implementation-agent
template_version: 1
related_work_item: WI-003
---

# OpenSpec → Kaddo Mapping Matrix

> Idioma del proyecto: español. Claves, nombres de archivo y código en inglés.

## Propósito

Mapear cada responsabilidad del workflow OpenSpec a su equivalente Kaddo-native. El mapeo se basa en responsabilidades, no en artifacts — no todas las capacidades de OpenSpec necesitan un equivalente directo 1:1.

## Metodología

Se analizaron los 4 templates reales de `openspec/templates/` (proposal.md, design.md, spec.md, tasks.md) y el lifecycle documentado en `openspec/README.md` para identificar cada responsabilidad concreta.

---

## Mapping: proposal.md → Kaddo

| Sección OpenSpec | Responsabilidad | Kaddo Equivalente | Cobertura | Notas |
|-----------------|-----------------|-------------------|-----------|-------|
| Problem | Describir el problema o gap actual | WI: Problem / Current behavior | **Full** | — |
| Proposed Change | Definir qué se propone hacer a alto nivel | WI: Actor and outcome / Expected result / Target behavior | **Full** | Kaddo descompone en actor, outcome y target behavior en lugar de un texto libre |
| Why Now | Justificar por qué este cambio es el siguiente | WI: depends_on + roadmap.md positioning | **Full** | La priorización vive en el roadmap y las dependencias entre WIs |
| Scope | Qué incluye el cambio | WI: Scope | **Full** | — |
| Out of Scope | Qué excluye explícitamente | WI: Out of scope | **Full** | — |
| Expected Value | Qué se desbloquea o mejora | WI: Expected result | **Full** | — |
| Risks | Qué puede salir mal y mitigaciones | WI: scope_confidence (level + reasons) + Open questions | **Full** | scope_confidence captura la incertidumbre; open questions capturan riesgos específicos |

**Resumen proposal.md:** 7/7 responsabilidades cubiertas. Cobertura completa.

---

## Mapping: design.md → Kaddo

| Sección OpenSpec | Responsabilidad | Kaddo Equivalente | Cobertura | Notas |
|-----------------|-----------------|-------------------|-----------|-------|
| Technical Approach | Describir cómo se implementa el cambio | implementation-planning skill output | **Partial** | La skill produce scope técnico y pasos, pero no un documento deliberativo de diseño previo. El "por qué esta approach" se captura informalmente. |
| Affected Areas | Listar archivos, comandos, servicios o módulos afectados | WI: affected_modules + code globs (frontmatter) + Surface review + Module coverage | **Full** | Kaddo va más allá: surface review evalúa cada capa, module coverage mapea cada módulo |
| Data Model / Types | Documentar tipos, config keys, frontmatter fields nuevos o cambiados | No captura explícita | **Gap** | Ni el WI template ni las skills solicitan documentar cambios de modelo de datos |
| CLI Behavior | Describir comportamiento de comandos después del cambio | WI: Current behavior / Target behavior | **Full** | — |
| Alternatives Considered | Documentar otras approaches evaluadas y por qué se descartaron | knowledge/tech/decisions/ (adr-writing skill) | **Partial** | La infraestructura ADR existe pero no está integrada al workflow de WI. Las alternativas se documentan ad-hoc en el plan de implementación |
| Trade-offs | Qué se gana y qué se pierde con la approach elegida | knowledge/tech/decisions/ (adr-writing skill) | **Partial** | Mismo gap que Alternatives |
| Risks (implementation) | Riesgos técnicos específicos de la implementación | implementation-planning skill: risks section | **Full** | — |

**Resumen design.md:** 4/7 full, 2/7 partial, 1/7 gap. Es el template con menor cobertura.

---

## Mapping: spec.md → Kaddo

| Sección OpenSpec | Responsabilidad | Kaddo Equivalente | Cobertura | Notas |
|-----------------|-----------------|-------------------|-----------|-------|
| User Story | Definir actor, capability, beneficio | WI: Actor and outcome | **Full** | — |
| Expected Behavior | Comportamiento observable post-cambio | WI: Target behavior + End-to-end flow | **Full** | Kaddo descompone en target behavior y flow en lugar de un texto libre |
| Acceptance Criteria | Criterios verificables de completitud | WI: Acceptance criteria | **Full** | work-item-refinement skill enforce testability |
| Edge Cases | Situaciones non-happy-path | WI: Acceptance criteria (cuando son completos) | **Partial** | Los ACs pueden cubrir edge cases pero el template no los solicita explícitamente como sección separada |
| Error Handling | Qué ocurre con inputs inválidos o entorno no preparado | No captura explícita | **Gap** | Ni el WI template ni las skills solicitan documentar error handling como sección |
| Output Examples | Ejemplos concretos de output del comando, archivos generados, JSON/markdown producido | No captura explícita | **Gap** | Kaddo no tiene un mecanismo para capturar output examples previo a implementación |

**Resumen spec.md:** 3/6 full, 1/6 partial, 2/6 gap.

---

## Mapping: tasks.md → Kaddo

| Sección OpenSpec | Responsabilidad | Kaddo Equivalente | Cobertura | Notas |
|-----------------|-----------------|-------------------|-----------|-------|
| Implementation Tasks | Pasos concretos de implementación (checkboxes) | implementation-planning skill output | **Full** | La skill produce pasos numerados con scope técnico |
| Tests | Qué tests escribir | WI: Validation section + implementation-planning skill | **Full** | — |
| Documentation | Qué docs actualizar | implementation-planning skill output | **Full** | — |
| Manual Validation | Cómo validar manualmente | WI: Validation section + Definition of done | **Full** | — |

**Resumen tasks.md:** 4/4 full. Cobertura completa.

---

## Mapping: Lifecycle

| OpenSpec Lifecycle | Kaddo Lifecycle | Cobertura | Notas |
|-------------------|----------------|-----------|-------|
| Draft | draft (Captured Intent) | **Full** | — |
| Ready (4 archivos completos) | ready (aprobado por humano vía `kaddo ready`) | **Full** | Kaddo usa human gate en lugar de file completeness |
| In progress | in-progress (Implementation Handoff → Implementing) | **Full** | — |
| Done | completed (vía `kaddo learn`) | **Full** | Kaddo agrega learning capture |

**Resumen lifecycle:** 4/4 full. Cobertura completa.

---

## Resumen consolidado

| Template | Responsabilidades | Full | Partial | Gap |
|----------|-------------------|------|---------|-----|
| proposal.md | 7 | 7 | 0 | 0 |
| design.md | 7 | 4 | 2 | 1 |
| spec.md | 6 | 3 | 1 | 2 |
| tasks.md | 4 | 4 | 0 | 0 |
| Lifecycle | 4 | 4 | 0 | 0 |
| **Total** | **28** | **22** | **3** | **3** |

**Cobertura total:** 22/28 full (79%), 3/28 partial (11%), 3/28 gap (11%).

### Gaps identificados

1. **Data Model / Types** (design.md) — no se solicita documentar cambios de modelo.
2. **Error Handling** (spec.md) — no se solicita documentar manejo de errores como sección.
3. **Output Examples** (spec.md) — no se capturan ejemplos concretos de output.

### Partial coverage

1. **Technical Approach** (design.md) — implementation-planning cubre tasks pero no la fase deliberativa.
2. **Alternatives / Trade-offs** (design.md) — ADR skill existe pero no está integrada al WI workflow.
3. **Edge Cases** (spec.md) — cubierto por ACs pero no solicitado explícitamente.

---

## Modelo de responsabilidad

En lugar de un mapeo 1:1 entre artifacts, el modelo Kaddo distribuye responsabilidades:

```text
OpenSpec (4 documentos estáticos)
         ↓
Kaddo (múltiples artifacts dinámicos)

proposal.md  ──→  Work Item frontmatter + body
design.md    ──→  implementation-planning skill + ADR skill
spec.md      ──→  Work Item ACs + Validation + Target behavior
tasks.md     ──→  implementation-planning skill output
```

La ventaja del modelo Kaddo es que el Work Item es un living document que se enriquece a lo largo del lifecycle, mientras OpenSpec producía 4 documentos estáticos que podían quedar desincronizados con la implementación.
