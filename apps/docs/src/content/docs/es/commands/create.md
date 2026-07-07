---
title: kaddo create
description: Crea un Work Item con el contexto mínimo para su Nivel de Conocimiento.
---

```bash
kaddo create feature   # K2: entrega una capacidad funcional
kaddo create bugfix    # K2: corrige un defecto conocido
kaddo create hotfix    # K1: corrección urgente sobre una versión entregada
kaddo create spike     # K3: exploración / reducir incertidumbre
kaddo create chore     # K1: mantenimiento, tooling, configuración, infra
```

## Tipos de Work Item

| Tipo | Para qué | Ejemplos |
|---|---|---|
| `feature` | Una capacidad funcional | Crear tarea · Listar tareas |
| `bugfix` | Un defecto conocido | El filtro devuelve resultados incorrectos |
| `hotfix` | Corrección urgente sobre una versión entregada | Crash en producción · caída de auth |
| `spike` | Exploración para reducir incertidumbre | Evaluar SQLite vs PostgreSQL |
| `chore` | Trabajo técnico/mantenimiento que habilita el proyecto pero no entrega capacidad directa | Inicializar TypeScript · Configurar Vitest · Setup CI · Actualizar dependencias |

Un Work Item es **`chore`** cuando no agrega una capacidad, no corrige un defecto, no es una
emergencia y no es investigación — pero es necesario para mantenimiento, configuración, tooling,
infraestructura o developer experience. Clasificar ese trabajo como `feature` distorsiona el
significado de Feature.

**Alias** (se resuelven a `chore` automáticamente, desde el CLI o un candidato del roadmap):
`setup`, `maintenance`, `tooling`, `infrastructure`, `infra`, `refactor`, `config`.

Los Work Items nuevos se crean en `knowledge/delivery/work-items/draft/` con `status: draft`.
Muevelos a `ready` cuando dependencias, alcance y criterios de aceptacion esten claros.

Los módulos opcionales agregan más tipos (`adr`, `rfc`, `incident`, `migration`,
`legacy`, `contract`, `capability`, `guard-rule`, `agent`, `skill`). Ver
[Módulos](/es/modules/overview/).

## Crear desde un candidato del roadmap

Cuando el roadmap-agent ya produjo `knowledge/delivery/roadmap.md`, puedes convertir un candidate
work item en un Work Item real sin volver a escribir su contexto:

```bash
kaddo create --from roadmap
# o eligiendo un tipo por defecto:
kaddo create feature --from roadmap
```

Kaddo lee `knowledge/delivery/roadmap.md`, te deja seleccionar un candidato (`WI-CANDIDATE-001`, …)
y prellena el Work Item desde el roadmap: título, tipo, Knowledge Level sugerido, valor
esperado, notas, capabilities/impacto/riesgo/dependencias relacionadas y la iniciativa padre.
Solo pregunta los campos requeridos que el candidato no provee.

El Work Item generado mantiene **trazabilidad de origen** en su front matter:

```yaml
---
type: spike
id: WI-001
knowledge_level: K2
status: draft
phase: now
initiative: RM-001
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
---
```

Esto cierra el loop de Kaddo: `scan → context → agents → roadmap → work item`. El roadmap se
genera en tu chat LLM (nunca en el CLI), y sus candidatos no son Work Items hasta que los
creas aquí.

### Formatos de roadmap soportados

`kaddo create --from roadmap` no exige un único formato rígido. El parser determinista reconoce
candidatos de Work Item en las formas de roadmap más comunes — primero intenta el formato estricto
del Kaddo Roadmap Agent (compatibilidad total) y, si no encuentra nada, recurre al reconocimiento
flexible:

- **Tabla** — una tabla Markdown con una columna `ID`/`WI` y una columna de título/descripción
  (una columna `Depends on` se lee como dependencias):

  ```markdown
  | ID     | Work Item | Depends on |
  |--------|-----------|------------|
  | WI-001 | Cart      |            |
  | WI-002 | Payment   | WI-001     |
  ```

- **Lista con viñetas** — `- WI-001: Cart`, `- WI-001 — Cart` o `- WI-001 Cart`.

- **Checklist** — `- [ ] WI-001 Cart` / `- [x] WI-002 Payment`.

- **Iniciativas mixtas** — los encabezados `## RM-001: Checkout` agrupan los candidatos debajo;
  la iniciativa se registra como `source_initiative`.

Cualquier id `WI-*` que termine en dígito se trata como candidato. Los ids duplicados se descartan.

> Si falta `knowledge/delivery/roadmap.md`, o no contiene candidatos de Work Item reconocibles en
> ningún formato soportado, Kaddo muestra un mensaje útil en lugar de crear un Work Item vacío.

### Candidatos del roadmap vs Work Items materializados

Un roadmap lista **candidatos** — *no* son Work Items hasta que los creas. `kaddo explain` y
`kaddo understand` hacen explícita esta distinción:

```text
Roadmap candidates: 21
Materialized work items: 5
Remaining candidates: 16
```

Luego `kaddo understand` recomienda materializar los candidatos restantes con
`kaddo create --from roadmap`.

## Lifecycle de Work Items

Los Work Items se organizan por estado operativo:

```text
knowledge/delivery/work-items/
  draft/
  ready/
  in-progress/
  blocked/
  completed/
  archived/
```

Los estados oficiales son `draft`, `ready`, `in-progress`, `blocked`, `completed` y
`archived`. Los archivos planos heredados bajo `knowledge/delivery/work-items/*.md` se siguen
leyendo como `ready` hasta que los migres a carpetas de estado.

## Metadatos de origen

Cada Work Item incluye un campo `source` en su front matter que registra de dónde proviene.
Esto permite trazabilidad en `kaddo explain`, `kaddo understand`, `kaddo context` y el
servidor MCP.

### Tipos de origen soportados

| Origen | Cuándo se usa |
|---|---|
| `manual` | Creado interactivamente con `kaddo create` |
| `roadmap` | Materializado desde un candidato del roadmap |
| `jira` | Importado desde Jira |
| `github` | Importado desde GitHub Issues/PRs |
| `notion` | Importado desde Notion |
| `xlsx` | Importado desde una hoja Excel |
| `csv` | Importado desde un archivo CSV |
| `api` | Creado programáticamente vía API |
| `external` | Importado desde otro sistema externo |
| `unknown` | Sin metadatos de origen (items legacy) |

### Campos de origen

```yaml
---
source: jira
source_id: DOT-123
source_title: "Fix trial reminder emails"
source_url: "https://jira.example.com/browse/DOT-123"
source_context: "Del sprint planning de Q3"
source_provider: jira
source_imported_at: "2026-07-01"
source_synced_at: "2026-07-06"
---
```

Todos los campos excepto `source` son opcionales. Los creates manuales establecen
`source: manual` automáticamente. Los creates desde roadmap establecen `source: roadmap`
con `source_id`, `source_title` y `source_context`.

### Items legacy

Los Work Items creados antes de los metadatos de origen se leen con `source: unknown` en
tiempo de ejecución — los archivos nunca se modifican. `kaddo explain` muestra un resumen de
"Work Item Sources" y `kaddo project-route` advierte cuando hay work items con origen
desconocido.

## Resiliencia de directorio (VS-085)

Desde v3.55.0, `kaddo create` crea automáticamente el directorio `knowledge/delivery/work-items/`
si no existe, siempre que el proyecto esté inicializado (`.kaddo/config.yml` existe). El error
engañoso "Run `kaddo init` first" solo aparece cuando el proyecto realmente no está inicializado.

## UX de criterios de aceptación (VS-085)

Los criterios de aceptación ahora se capturan uno a la vez con confirmación "¿Agregar otro?",
lo cual es confiable en todos los shells incluido PowerShell en Windows. También se soporta
entrada separada por punto y coma: `criterio 1; criterio 2; criterio 3`.

Todos los criterios se normalizan a formato checklist Markdown:

```md
- [ ] Texto del criterio.
```

## Metadatos de fuente (VS-085)

Los Work Items creados manualmente incluyen metadatos de fuente estructurados:

```yaml
source:
  type: manual
  inferred: false
generated_by: kaddo-create
template_version: 1
```

Esto se alinea con VS-084 (metadata health) y hace que los Work Items manuales sean trazables
junto con los materializados desde el roadmap.

Desde v3.56.0 (VS-086), el parser de source lee correctamente este formato de objeto YAML.
Anteriormente, los objetos `source` se convertían en `[object Object]` y se reportaban como
`unknown`. Tanto el formato de objeto como el formato legacy de string (`source: manual`) son
soportados.

## Activar Guard Lite

Agrega globs de código al campo `code:` del front matter generado:

```yaml
---
type: feature
id: WI-001
code:
  - src/payments/**
  - src/shared/payment/**
---
```
