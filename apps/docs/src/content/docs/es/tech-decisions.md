---
title: Decisiones técnicas (ADRs)
description: kaddo adr detecta candidatos de decisión técnica y prepara el handoff de los ADRs a crear, para que las decisiones sean trazables en vez de quedar como notas.
---

Una decisión técnica relevante no debería quedar como nota. Cuando el `architecture-agent` produce
`knowledge/tech/decision-candidates.md`, Kaddo detecta esos candidatos y te guía a materializarlos
como **ADRs** en `knowledge/tech/decisions/` antes de implementar Work Items afectados.

```bash
kaddo adr          # lista candidatos de decisión + los archivos ADR a crear (alias: kaddo decisions)
kaddo adr --json
```

`kaddo adr` es un **handoff de solo lectura**: nunca escribe ADRs, nunca marca nada como `accepted`,
nunca decide por vos, sin LLM, sin git. El CLI prepara el contexto; la skill adr-writing (un LLM/humano)
redacta el ADR.

## Estado de decisiones técnicas

Kaddo calcula un estado `tech_decisions` a partir del archivo de candidatos y la carpeta de ADRs:

| Estado | Significado |
|---|---|
| `none` | sin candidatos de decisión y sin ADRs |
| `candidates` | `decision-candidates.md` tiene candidatos, pero aún no hay ADRs |
| `draft-adrs` | hay ADRs pero ninguno `accepted` todavía |
| `accepted-adrs` | al menos un ADR está `accepted` |

`kaddo explain` muestra una sección `## Tech Decisions`, y `kaddo context` incluye el mismo resumen y
agrega una nota de Missing Context cuando los candidatos no están materializados. Tanto `explain` como
`understand` recomiendan la skill **adr-writing** cuando hay candidatos sin ADRs.

## Por MCP

Los agentes pueden consultar las decisiones técnicas directamente — sin parsear todo el context pack —
mediante el recurso de solo lectura `kaddo://tech-decisions`. Devuelve el mismo objeto que
`kaddo adr --json` (`status`, conteos, y `candidate_list` con `title`, `source` y `suggestedAdrFile`),
porque el CLI y el MCP comparten la misma fuente `buildTechDecisions(dir)`. El recurso es determinista
y read-only: nunca escribe ADRs, nunca usa LLM y nunca ejecuta git.

## Nombres de ADR limpios

Los nombres de archivo ADR sugeridos se limpian antes de armar el slug (VS-075.1): se remueven prefijos
de lista/heading (`1.`, `2)`, `(3)`, `001.`, `-`, `##`) para no duplicar numeración, y se normalizan
acrónimos (`INTERNAL_CRON_SECRET` → `internal-cron-secret`). Así un candidato
`## 1. Shared secret (INTERNAL_CRON_SECRET)` genera
`ADR-001-shared-secret-internal-cron-secret.md`, no `ADR-001-1-...`.

## Los tres niveles

```txt
decision candidate  →  ADR draft  →  accepted ADR
```

- **decision candidate** — identificada pero no formalizada (una sección `##` en
  `knowledge/tech/decision-candidates.md`).
- **ADR draft** — un ADR creado desde el candidato, `status: draft`, con `created_from:` registrando su
  origen; la decisión y las consecuencias quedan `[open]` hasta que un humano confirme.
- **accepted ADR** — revisada y `status: accepted`. **Nunca** se pone automáticamente.

## Ejemplo de handoff

```txt
ADR candidates found:

1. Shared secret for internal endpoints
   Source: knowledge/tech/decision-candidates.md
   Suggested ADR: knowledge/tech/decisions/ADR-001-shared-secret-for-internal-endpoints.md

Next:
  Use the adr-writing skill to create ADR drafts from these candidates
```

## Comportamiento de bloqueo

Los candidatos de decisión **no bloquean el roadmap** — podés planificar mientras las decisiones sigan
siendo candidatas. Pero antes de **implementar** un Work Item técnico afectado por una decisión no
formalizada, el work-item-agent y el implementation-agent **advierten** y recomiendan materializar el
ADR primero. Los Work Items pueden referenciar `related_decisions: [ADR-001-...]` (o
`decision_candidates: [<título>]` cuando aún no hay ADR) para trazabilidad.

## La skill adr-writing

La skill `adr-writing` documenta el formato estándar de ADR: front matter con
`status: draft | accepted | superseded | deprecated`, y las secciones **Context**, **Options
Considered**, **Decision**, **Consequences**, **Related Capabilities** y **Related Work Items**. Para
materializar un candidato, copia su contexto y opciones y deja la decisión y las consecuencias como
`[open]` — nunca inventa decisiones, opciones ni consecuencias.
