---
title: Niveles de Conocimiento
description: Cómo Kaddo escala el contexto al tamaño del cambio.
---

Cada Work Item carga el contexto mínimo para su Nivel de Conocimiento. El nivel
decide cuántas preguntas hace Kaddo y qué contiene el archivo generado.

| Nivel | Cuándo | Preguntas |
|---|---|---|
| K0 | Cambio trivial | Ninguna |
| K1 | Hotfix / corrección simple | Problema + resultado esperado |
| K2 | Feature o bugfix con impacto funcional | + impacto + criterios de aceptación |
| K3 | Capacidad o cambio significativo | + diseño |
| K4 | Cambio de arquitectura o migración | + riesgos |

El archivo generado incluye front matter, una Definición de Hecho (DoD) y una sección de Aprendizaje.

## Propiedad (ownership)

La propiedad se declara en el front matter de cada artefacto — sin archivo de mapeo central.

```yaml
---
type: feature
id: WI-001
title: "Add payment retry logic"
knowledge_level: K2
status: in-progress
code:
  - src/payments/**
  - src/shared/payment/**
summary: "Adds retry policy for failed payment attempts."
---
```

Kaddo construye un Grafo de Conocimiento simple a partir de estos front matters en tiempo de ejecución:

```
artefacto → globs de código → intersección con git diff
```
