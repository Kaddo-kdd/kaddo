---
title: Plantillas de delivery
description: Cómo evoluciona el producto — work items y roadmap.
---

La capa **Delivery** responde *¿cómo lo evolucionamos?* — las unidades del día a día del
loop de Kaddo, bajo `knowledge/delivery/`.

| Plantilla | Propósito | Ruta | Comando | Agente |
|---|---|---|---|---|
| Work Item | Unidad mínima trazable de evolución del producto | `knowledge/delivery/work-items/<state>/` | `kaddo create` | `work-item-agent` |
| Roadmap | Iniciativas + work items candidatos | `knowledge/delivery/roadmap.md` | `kaddo create --from roadmap` | `roadmap-agent` |

## Work Item

La unidad alrededor de la que giran Guard, classify, history y learn. Lleva front matter
de trazabilidad (`id`, `type`, `knowledge_level`, `source`, `domains`, `capabilities`,
`code`). Fase e iniciativa permanecen en front matter como planificación y trazabilidad
funcional; las carpetas representan el estado del lifecycle. Secciones: Problema · Resultado
esperado · Criterios de aceptación · Diseño (opcional) · Riesgos (opcional) · Out of scope ·
Cómo probarlo (validation) · Definition of Done · Aprendizaje. El work-item-agent y el
implementation-agent siempre indican **cómo probarlo** para verificar el cambio terminado.

Los estados oficiales son `draft`, `ready`, `in-progress`, `blocked`, `completed` y `archived`.
Los agentes deben tratar solo `draft`, `ready`, `in-progress` y `blocked` como trabajo activo;
`completed` y `archived` son conocimiento histórico.

Los tipos oficiales de Work Item son `feature`, `bugfix`, `hotfix`, `spike` y `chore` (trabajo
técnico / mantenimiento / tooling). Ver [create](/es/commands/create/#tipos-de-work-item).

> Declara globs `code:` para que Guard relacione los cambios con el work item.

### Estado de delivery completado

Un proyecto con todos los Work Items completados entra en fase de **Mantenimiento**. Kaddo
distingue la ausencia de trabajo activo de la ausencia total de trabajo:

- `No work items found` solo aparece en Missing Context cuando existen **cero** Work Items.
- Work Items completados o archivados evitan la advertencia de contexto faltante.
- La ruta de proyecto marca `Refine Work Item: done` para cualquier WI que alcanzó `ready`,
  `in-progress`, `blocked`, `completed` o `archived`.
- Readiness refleja el estado de delivery: `delivery-completed`, `delivery-completed-release-ready`
  o `delivery-completed-release-blocked` — independiente del siguiente paso recomendado.
- `kaddo explain` y `kaddo understand` muestran un **Delivery Summary** con conteos de
  completados/activos, implementaciones completadas y estado de release gates.
- El JSON de contexto expone `activeWorkItems`, `completedWorkItems`, `archivedWorkItems` y
  `allWorkItems`. El campo legacy `workItems` es un alias de `activeWorkItems`.
- Work Items legacy completados (sin `implementation_status` / `validation_status` /
  `release_status`) usan `not-assessed` por defecto, no `not-started`.

### Refinamiento de alcance end-to-end

Kaddo soporta metadata explícita de cobertura de alcance para prevenir refinamientos
incompletos. Un Work Item puede declarar:

- **`scope_confidence`** — `high`, `medium` o `low` con razones.
- **`module_coverage`** — cada módulo mapeado como `affected`, `reviewed-not-affected`,
  `unknown` o `not-applicable`.
- **`impact_analysis`** — cada superficie (frontend, backend, database, etc.) con los
  mismos estados.

Guard valida la consistencia entre `affected_modules` y `module_coverage`, advierte
cuando Work Items orientados al usuario tienen módulos frontend sin evaluar, y señala
Work Items `ready` con baja confianza o módulos desconocidos. Estos campos son
opcionales para compatibilidad con Work Items existentes.

El work-item-agent reconstruye el outcome, journey y evalúa superficies antes de
proponer archivos. El implementation-agent realiza una revisión de alcance antes de
implementar. La skill work-item-refinement estandariza: framing del outcome,
reconstrucción del journey, revisión de superficies, revisión de módulos y revisión
de completitud.

### Dimensiones de estado independientes

Más allá del estado de lifecycle, los Work Items pueden declarar tres dimensiones de
estado independientes en el front matter:

| Dimensión | Valores | Propósito |
|---|---|---|
| `implementation_status` | `not-started`, `in-progress`, `completed`, `partial`, `blocked` | Rastrea la implementación de código entre repos |
| `validation_status` | `not-started`, `in-progress`, `passed`, `failed`, `partial`, `accepted-with-exceptions`, `blocked` | Rastrea el estado de validación |
| `release_status` | `not-assessed`, `ready`, `blocked`, `released`, `not-applicable` | Rastrea la preparación para release |

Un Work Item puede estar `completed` (lifecycle) pero `release_status: blocked` — estas
dimensiones son independientes.

### Evidencia de implementación cross-repo

En proyectos multirepo, los Work Items que abarcan múltiples repositorios declaran
`affected_modules` en el front matter. `core` siempre es válido; otros módulos deben
estar registrados en `.kaddo/modules.yml`.

```yaml
affected_modules:
  - core
  - frontend
implementation_evidence:
  repositories:
    core:
      role: core
      status: implemented
      validations:
        - command: go test ./...
          status: passed
      migrations:
        - id: add-column
          environment: local
          status: applied
```

`kaddo guard --workspace` valida la coherencia de la evidencia: módulos no registrados,
repos modificados pero no declarados, validaciones no ejecutadas, migraciones bloqueadas
y consistencia entre lifecycle y release gates.

### Release gates y excepciones de completitud

Los release gates son puntos de control que deben pasar antes del release:

```yaml
release_gates:
  - id: supabase-migration
    status: blocked
    reason: Proyecto no disponible
```

Las excepciones de completitud permiten cerrar un Work Item con desviaciones conocidas,
requiriendo aprobación humana:

```yaml
completion_exceptions:
  - id: tests-not-executed
    status: accepted
    reason: No ejecutados por instrucción humana
    approved_by: human
```

Un Work Item con excepciones en `status: proposed` no puede marcarse como completado.

### Historial de agentes

Los Work Items rastrean qué agentes participaron en su lifecycle:

- `refined_by`: el agente que refinó el Work Item (nunca se sobrescribe)
- `implemented_by`: el agente que lo implementó
- `closed_by`: el humano o agente que lo cerró

### Robustez del grafo Mermaid

El grafo de conocimiento (`kaddo graph`) filtra nodos con id o label vacío, aristas que
referencian nodos inexistentes, y escapa comillas, corchetes y saltos de línea en labels.
Un proyecto sin ADRs genera un grafo válido sin nodos vacíos `adr[""]`.

## Roadmap

Iniciativas estructuradas (`RM-001`) y work items candidatos (`WI-CANDIDATE-001`) para
revisión humana — no compromisos. `kaddo create --from roadmap` convierte candidatos en
Work Items reales con trazabilidad `source`.
