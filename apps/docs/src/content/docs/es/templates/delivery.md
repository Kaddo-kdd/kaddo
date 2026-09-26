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

### Ejemplo completo

Un Work Item vive en un único archivo `.md` bajo `knowledge/delivery/work-items/<state>/`.
El nombre del archivo sigue el patrón `WI-NNN-<título-slugificado>.md`. Aquí un ejemplo
completo mostrando el frontmatter YAML y todas las secciones estándar del body:

```markdown
---
type: feature
id: WI-042
title: Agregar alarma CloudWatch para latencia p99 del API
status: draft
work_type: feature
created_at: "2026-09-25"
affected_modules:
  - core
  - backend
source:
  type: chat
  imported_at: "2026-09-25"
  source_format: markdown
  source_hash: "e3b0c44298fc1c149..."
  inferred: false
generated_by: kaddo-admin
knowledge_level: none
scope_confidence:
  level: medium
  reasons:
    - Configuración de CloudWatch aún no revisada
summary: >
  Agregar una alarma de CloudWatch que monitoree la latencia p99 del API Gateway
  y alerte al equipo de operaciones cuando supere 500ms por 5 minutos consecutivos.
original_snapshot:
  title: Agregar alarma CloudWatch para latencia p99 del API
  description: Monitorear latencia p99 del API Gateway y alertar cuando > 500ms.
---

# Agregar alarma CloudWatch para latencia p99 del API

> Type: feature

## Actor

El equipo de operaciones que monitorea la salud del API.

## Outcome

Recibir una notificación cuando la latencia p99 supere 500ms, para que el equipo
pueda investigar antes de que los usuarios se vean afectados.

## Current behavior

No existe alertamiento de latencia. El equipo descubre los picos de latencia solo
después de quejas de usuarios.

## Target behavior

Una alarma de CloudWatch se dispara cuando la latencia p99 del API Gateway se
mantiene por encima de 500ms durante 5 minutos consecutivos, enviando un mensaje
al canal de Slack #ops-alerts.

## Entry points

- AWS CloudWatch → Alarms
- API Gateway → Metrics

## End-to-end flow

1. API Gateway emite métricas de latencia a CloudWatch.
2. CloudWatch evalúa la estadística p99 cada minuto.
3. Si 5 datapoints consecutivos superan 500ms, la alarma entra en estado ALARM.
4. Un topic SNS dispara un Lambda que publica en Slack #ops-alerts.

## Scope unknowns

- Confirmar si el topic SNS existente soporta integración con Slack.

## Acceptance criteria

- [ ] Alarma de CloudWatch configurada para la métrica `p99` del API Gateway
- [ ] Umbral: 500ms durante 5 períodos consecutivos de 1 minuto
- [ ] Notificación entregada a Slack #ops-alerts
- [ ] Runbook vinculado en la descripción de la alarma
- [ ] Alarma visible en el dashboard de CloudWatch de operaciones
```

**Campos del frontmatter:**

| Campo | Propósito |
|---|---|
| `type` / `work_type` | Tipo de Work Item (`feature`, `bugfix`, `hotfix`, `spike`, `chore`) |
| `id` | Identificador único generado por Kaddo (`WI-NNN`) |
| `title` | Título descriptivo corto (máx 120 caracteres) |
| `status` | Estado de lifecycle (`draft`, `ready`, `in-progress`, `blocked`, `completed`, `archived`) |
| `created_at` | Fecha de creación |
| `affected_modules` | Módulos que este Work Item toca |
| `source` | Proveniencia — de dónde se originó el Work Item |
| `knowledge_level` | Profundidad de refinamiento (`none`, `partial`, `complete`) |
| `scope_confidence` | Confianza en la cobertura de alcance |
| `summary` | Texto completo del intent |
| `original_snapshot` | Estado externo al momento de importar (solo para Work Items importados) |

**Secciones del body:**

| Sección | Propósito |
|---|---|
| Actor | Quién se beneficia de este cambio |
| Outcome | Cómo se ve el éxito |
| Current behavior | Qué pasa hoy |
| Target behavior | Qué debería pasar después del cambio |
| Entry points | Dónde en el sistema comienza el cambio |
| End-to-end flow | Flujo paso a paso de ejecución |
| Scope unknowns | Preguntas abiertas que necesitan respuesta |
| Acceptance criteria | Condiciones verificables para completitud |

No todas las secciones son obligatorias. Un Work Item recién importado puede tener solo
título y summary; el refinamiento llena el resto.

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
