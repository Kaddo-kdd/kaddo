---
title: kaddo understand
description: Guía el handoff CLI → LLM con un plan de agentes según el estado del proyecto.
---

```bash
kaddo understand
```

Guía el handoff desde la CLI (contexto determinista) hacia tu LLM (interpretación).
Refresca el context pack, recomienda qué agentes usar — y en qué orden — según el estado
de tu proyecto, y escribe una guía reutilizable que puedes reabrir cuando quieras.

Escribe / refresca:

- **`.kaddo/context-pack.md`** y **`.kaddo/context-pack.json`** — la entrada para los agentes.
- **`.kaddo/understand.md`** — la guía state-aware con la fase actual, agente/skill recomendados,
  estado de delivery, recomendaciones primaria y secundarias, Work Items activos, paths concretos
  de agentes/skills e instrucciones para copiar/pegar. El markdown coincide con la salida de
  consola (VS-079.1).

## Qué hace

1. Requiere un proyecto inicializado (`kaddo init`).
2. Verifica el baseline de scan (`.kaddo/scan.json`) — avisa pero continúa si falta.
3. Genera / refresca el context pack (reutiliza `kaddo context`).
4. Construye un plan de agentes según el estado y marca los agentes que aún no están
   instalados (`kaddo add agents`).
5. Imprime un resumen conciso en la terminal y escribe `.kaddo/understand.md`.

## Determinista, sin LLM

`kaddo understand` **no** llama a un LLM, no ejecuta agentes ni autogenera artifacts de
arquitectura. Prepara el contexto y te dice exactamente qué agente ejecutar a continuación.
Tú mantienes el control de la interpretación.

## Flujo de agentes según el estado

## Recomendaciones según el estado real

`understand` recomienda el siguiente paso a partir del estado **real** del conocimiento — capas,
roadmap, Work Items y ownership — no solo del `project.state` definido en `kaddo init`. Reporta la
**fase** actual, la **razón**, los agentes recomendados y un **siguiente paso** concreto:

```text
Current phase: Active Delivery
Reason:
  - Roadmap available
  - 1 materialized work item(s)
  - ready: 1
  - Ownership coverage 100%
Recommended: implementation-agent
Next step: Start WI-014 — Create task (ready → in-progress)
```

Las fases se derivan de lo que realmente existe:

| Fase | Cuándo |
|---|---|
| Discovery | faltan capas base (business / product / codebase) |
| Planning | existe conocimiento base, aún no hay roadmap |
| Delivery Preparation | existe roadmap, aún no hay Work Items |
| Active Delivery | hay Work Items activos (draft / ready / in-progress / blocked) |
| Maintenance | Work Items completados y roadmap mayormente materializado |

Así, una vez que existen roadmap y Work Items, `understand` deja de recomendar el roadmap-agent y te
apunta al trabajo que realmente necesita atención.

El flujo basado en estado todavía guía las fases tempranas:

| Estado | Flujo recomendado |
|---|---|
| `new` | roadmap-agent → architecture-agent |
| `pre-ai` | capability-agent → architecture-agent → roadmap-agent |
| `legacy` | legacy-agent → architecture-agent → capability-agent → roadmap-agent |

Cada paso se mapea a una salida esperada, por ejemplo:

- `capability-agent` → `knowledge/product/capabilities.md`
- `architecture-agent` → `knowledge/tech/current-state.md`
- `roadmap-agent` → `knowledge/delivery/roadmap.md`
- `legacy-agent` → `knowledge/legacy/risks.md`

## Candidatos del roadmap → Work Items materializados

Cuando existe un roadmap pero sus candidatos aún no son Work Items, `understand` lo señala y
recomienda materializarlos:

```text
The roadmap has 16 unmaterialized Work Item candidate(s) (21 candidate(s), 5 materialized).
  → Run `kaddo create --from roadmap`, or use the work-item-agent to
    materialize them into knowledge/delivery/work-items/.
```

Los candidatos se detectan desde cualquier
[formato de roadmap soportado](/es/commands/create/#formatos-de-roadmap-soportados). Un candidato
del roadmap se convierte en un Work Item real solo cuando lo creas — `understand` mantiene ese
límite explícito para que nada se trate silenciosamente como trabajo en curso.

## Trabajo activo

`understand` razona sobre el lifecycle de Work Items y muestra el workspace activo actual:
`draft`, `ready`, `in-progress` y `blocked`. Recomienda continuar un item en progreso,
empezar uno ready, refinar un draft o resolver bloqueos. `completed` y `archived` quedan como
conocimiento historico.

## Hints del grafo durante Active Delivery

Si el proyecto está en la fase **Active Delivery** y
[`kaddo graph export`](/es/knowledge-graph-export/) reportó hints que afectan Work Items
**activos**, `understand` recomienda revisarlos antes de seguir con la implementación y sugiere el
`graph-agent`. El aviso solo aparece cuando los hints tocan trabajo activo — si no, no estorba.

## Alineación del markdown (VS-079.1)

Desde v3.46.0, `.kaddo/understand.md` refleja la misma recomendación state-aware que la salida de
consola. Incluye:

- **Current Phase** — fase, agente/skill recomendados, siguiente paso y razón.
- **Delivery State** — conteos de draft/ready/in-progress/blocked, cobertura de ownership,
  candidatos restantes, candidatos de decisión, ADRs, adapters.
- **Primary Recommendation** — el siguiente paso con id, agente, skill, comando y razón.
- **Secondary Recommendations** — sugerencias paralelas (ownership, ADRs, candidatos restantes).
- **Active Work Items** — Work Items en draft/ready/in-progress/blocked.
- **Agent Prompts** — paths concretos al agente y skill recomendados más el context pack.
- **Expected Outputs** — lo que el LLM debe producir para el paso recomendado.

Ninguna sección se renderiza vacía — si no hay datos, se omite o muestra un fallback.

## Alineación de bootstrap (VS-083 / VS-083.1)

Cuando el baseline de conocimiento está incompleto (no existen `knowledge/business/business.md` ni
`knowledge/product/product.md`), `understand` entra en modo **Setup**:

- La ruta del proyecto marca el paso `bootstrap` como actual.
- La fase se reporta como **Setup** en lugar de Discovery.
- Las secciones de handoff de agente (Agent Prompts, Expected Outputs, Copy/Paste) se suprimen —
  los agentes no pueden producir output útil sin conocimiento baseline.
- La terminal y la guía markdown muestran una secuencia numerada de bootstrap:
  1. `kaddo bootstrap` → 2. `kaddo add agents` → 3. `kaddo add skills` → 4. `kaddo context` → 5. `kaddo understand`.

Una vez que ambos archivos baseline existen, el flujo normal phase-aware se reanuda.

## Guard contra auto-recomendación (VS-083.3)

`understand` nunca se recomienda a sí mismo ("ejecutar `kaddo understand`") cuando existen pasos
de refinamiento accionables. Antes de v3.53.0, la escalera de prioridad verificaba la existencia
de `understand.md` antes de comprobar la calidad del conocimiento — así que en la primera
ejecución, `understand` siempre se auto-recomendaba en lugar de apuntar al agente correcto.

Ahora las comprobaciones de refinamiento se ejecutan primero: si `business.md` es un placeholder,
la recomendación es `refine-business` con `business-agent`, no "ejecutar `kaddo understand`".
El fallback de `understand` solo se activa cuando todas las capas de conocimiento son útiles y
no existe `understand.md` todavía.

Esto también corrige `projectRoute.currentStep`: ahora muestra correctamente `define-business`
en lugar de `scan-repository` cuando el conocimiento de negocio necesita refinamiento.

## Handoff de refinamiento de conocimiento (VS-083.2)

Después de que el baseline de bootstrap existe pero un archivo de conocimiento sigue siendo un
placeholder o es demasiado delgado, `understand` recomienda un paso de **Knowledge Refinement**
con el agente específico necesario:

- La recomendación incluye `agentPath`, `agentInstalled` e `installCommand`.
- Si el agente recomendado **no está instalado**, la guía markdown muestra una sección
  **Missing Agent** con el comando de instalación en lugar de Agent Prompts.
- Si el agente **está instalado**, el markdown muestra el path del prompt del agente en la
  sección Agent Prompts.
- La sección Recommended Agent Handoff del context pack también refleja el estado de instalación.

## Preservación de metadatos en salida de agentes (VS-084)

Cuando los agentes refinan archivos de conocimiento creados por `kaddo bootstrap`, deben
preservar los metadatos del frontmatter YAML (`type`, `generated_by`, `template_version`).
Los agentes que reescriben archivos de conocimiento reciben automáticamente **Frontmatter Rules**
en su prompt que los instruyen a:

- Preservar los campos de frontmatter existentes.
- No eliminar `type`, `generated_by` ni `template_version`.
- Establecer `project_state: ai-assisted` cuando el documento deja de ser un placeholder.
- Agregar o actualizar `refined_by` con el nombre del agente.

Un analizador de **metadata health** separado detecta drift — campos requeridos faltantes o
`project_state` inconsistente después del refinamiento. La salud de metadatos es independiente
de la calidad del contenido: un archivo con contenido útil pero metadatos con drift sigue
clasificándose como útil por el analizador de calidad de contenido.

Las advertencias de metadata health aparecen en:

- `context-pack.json` (campo `metadataHealth`) y `context-pack.md` (sección Metadata Health).
- `.kaddo/understand.md` y la salida de terminal de `kaddo understand`.
- `kaddo explain` (modos humano y agente).
- Salida de `kaddo guard`.

## Lectura de source manual y prioridad de draft (VS-086)

Desde v3.56.0, `parseWorkItemSource` lee correctamente `source` como objeto YAML — no solo
como string. Los Work Items creados por `kaddo create` escriben:

```yaml
source:
  type: manual
  inferred: false
```

Anteriormente, el parser convertía este objeto en `[object Object]` y lo reportaba como
`unknown`. Ahora lee los campos `type` e `inferred` directamente del objeto.

Además, cuando existen Work Items en draft pero el roadmap está vacío, `kaddo understand`
recomienda **work-item-agent** (refinar el draft) en lugar de **roadmap-agent** (definir
candidatos). La regla: *un Work Item materializado en draft tiene prioridad sobre un roadmap
vacío*.

## Funciona aunque falte contexto

Si falta el baseline de scan o algunos agentes, el comando igual produce un plan y te indica
el próximo paso concreto (ejecutar `kaddo scan` o `kaddo add agents`).

## scan vs context vs understand

- **`scan`** recolecta señales técnicas deterministas.
- **`context`** empaqueta esas señales (más conocimiento y work items) en un pack listo para el LLM.
- **`understand`** lo integra todo: refresca el pack y te dice qué agente ejecutar a
  continuación, en qué orden, según el estado de tu proyecto.
