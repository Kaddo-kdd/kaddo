---
title: kaddo create
description: Crea un Work Item con el contexto mínimo para su Nivel de Conocimiento.
---

```bash
kaddo create feature   # K2: 4 preguntas
kaddo create bugfix    # K2: 4 preguntas
kaddo create hotfix    # K1: 2 preguntas
kaddo create spike     # K3: 4 preguntas
```

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
