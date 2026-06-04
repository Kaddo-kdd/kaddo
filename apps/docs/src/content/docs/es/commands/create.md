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
status: in-progress
source: roadmap
source_id: WI-CANDIDATE-001
source_initiative: RM-001
---
```

Esto cierra el loop de Kaddo: `scan → context → agents → roadmap → work item`. El roadmap se
genera en tu chat LLM (nunca en el CLI), y sus candidatos no son Work Items hasta que los
creas aquí.

> Si falta `knowledge/delivery/roadmap.md`, o no contiene candidatos en el formato del Kaddo
> Roadmap Agent, Kaddo muestra un mensaje útil en lugar de crear un Work Item vacío.

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
