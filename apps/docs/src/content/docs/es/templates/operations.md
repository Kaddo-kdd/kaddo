---
title: Plantillas de operaciones
description: Seguridad, estándares, stack, estrategia de git, incidente y runbook.
---

Artifacts operativos globales del sistema. Instala los documentados con `kaddo add`.

| Plantilla | Propósito | Ruta | Comando | Agente |
|---|---|---|---|---|
| Security | Consideraciones de seguridad globales (sin escaneo) | `knowledge/tech/security.md` | `kaddo add security` | `security-agent` |
| Standards | Estándares ligeros de código/docs/testing | `knowledge/tech/standards.md` | `kaddo add standards` | `standards-agent` |
| Stack | Stack del sistema | `knowledge/tech/stack.md` | `kaddo add stack` | `stack-agent` |
| Git Strategy | Ramas, commits, tags | `knowledge/tech/git-strategy.md` | `kaddo add git-strategy` | `git-strategy-agent` |
| Incident | Registro post-incidente | `knowledge/incidents/` | `kaddo add incident` | — |
| Runbook | Tarea operativa recurrente | `knowledge/runbooks/` | — | — |

## Security

Auth, sensibilidad de datos, secretos, riesgos de dependencias y despliegue. Documenta
inquietudes para humanos y agentes — Kaddo **no** escanea código.

## Standards

Unas pocas reglas de alto valor más un checklist de PR. Sin documentation theater.

## Stack

Lenguajes, frameworks, datos, infraestructura, tooling e incógnitas por confirmar.

## Git Strategy

Por defecto **GitHub Flow + Conventional Commits + SemVer**, personalizable vía
`.kaddo/git.yml`. Ver [Estrategia de Git](/es/modules/git-strategy/).

## Incident y Runbook

Incident: resumen, impacto, timeline, causa raíz, resolución, follow-up. Runbook:
cuándo usar, prerrequisitos, pasos, verificación, rollback.
