---
title: kaddo guard
description: Revisa si el código modificado tiene artefactos relacionados sin actualizar.
---

```bash
kaddo guard           # revisa archivos staged + unstaged
kaddo guard --staged  # revisa solo archivos staged
kaddo guard --ci      # salida JSON para CI/PR, no bloqueante
```

Guard Lite lee el `git diff`, encuentra artefactos con globs `code:` que coinciden,
y muestra un **FYI no bloqueante** si el artefacto no se actualizó en el mismo diff.

```
Touched files:
  - src/payments/payments.service.ts

  ⚠ Possible knowledge drift: WI-001 (feature, K2)
    Changed code matching this artifact:
      - src/payments/payments.service.ts
    Declared ownership:
      - src/payments/**
    WI-001 was not updated in this diff.
    Evidence: 1/1 globs matched · artifact K2 · domain: payments
    Suggested action: review WI-001 and update it if the behavior changed,
    or ignore this artifact below if the change does not affect the knowledge.
```

## Declarar propiedad

Guard solo actúa sobre la **propiedad declarada**: nunca adivina qué artefacto posee un
archivo. Agrega globs `code:` al front matter del artefacto (incluidos los Work Items):

```yaml
---
type: feature
id: WI-001
knowledge_level: K2
code:
  - src/payments/**
  - src/shared/payment/**
---
```

- Si un archivo modificado coincide con un glob **y** el artefacto no se actualizó → FYI de drift.
- Si el artefacto también se modificó en el mismo diff → sin FYI (el conocimiento siguió sincronizado).
- Si ningún artefacto declara propiedad → Guard es **silencioso** por defecto. Sin ruido el primer día.

Guard es **informativo y no bloqueante**: nunca falla tu comando ni el CI, y **no hace
inferencias** — solo coincidencia determinista de globs.
