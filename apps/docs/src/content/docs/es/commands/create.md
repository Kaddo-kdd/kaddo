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
