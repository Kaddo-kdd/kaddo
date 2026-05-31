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

  FYI: src/payments/payments.service.ts matches WI-001
  WI-001 was not modified in this diff.
  Consider reviewing whether WI-001 still reflects the implementation.
```

Guard es **silencioso** cuando ningún artefacto declara propiedad. Sin ruido el primer día.
