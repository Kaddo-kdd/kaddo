---
title: Ejemplos
description: Repositorios de demostración reales y reproducibles que muestran Kaddo aplicado a proyectos nuevos, pre-IA, legacy y multirepo.
---

Estas no son páginas de "déjame explicarte el concepto": son **repositorios de
demostración que puedes abrir e inspeccionar**. Cada uno vive en
[`examples/`](https://github.com/judlup/kaddo/tree/main/examples) dentro del repo de
Kaddo, con artefactos `.kaddo/` y `architecture/` ya versionados para que veas
exactamente lo que Kaddo produce antes de ejecutar nada.

## Los cuatro escenarios

| Ejemplo | Escenario | Estado | Destacados |
| --- | --- | --- | --- |
| [Task Pilot](https://github.com/judlup/kaddo/tree/main/examples/new-project) | App nueva | `new` | Conocimiento estructurado desde el día uno; loop completo |
| [Loyalty Lite](https://github.com/judlup/kaddo/tree/main/examples/pre-ai-project) | App existente | `pre-ai` | `scan` + agentes + **demo de drift con Guard** |
| [Old Orders](https://github.com/judlup/kaddo/tree/main/examples/legacy-project) | App MVC legacy | `legacy` | Entender antes de cambiar; riesgos/incógnitas legacy |
| [Commerce Stack](https://github.com/judlup/kaddo/tree/main/examples/multirepo-workspace) | Varios repos | `multirepo` | `modules map` + artefactos por módulo |

## Cómo está organizado cada ejemplo

- `README.md` — el escenario, los comandos a ejecutar y qué inspeccionar.
- `expected-flow.md` — un recorrido `comando → salida → artefacto → siguiente paso`.
- archivos de muestra versionados (`.kaddo/`, `architecture/`, `sample/`) para que
  los artefactos se vean sin ejecutar nada.

## Qué es real y qué es ilustrativo

- **Artefactos del CLI** (`.kaddo/config.yml`, `architecture/work-items/*.md`, el
  esqueleto del roadmap, `.kaddo/modules.yml`, carpetas de módulos) son exactamente
  lo que escribe `kaddo`.
- **Salidas de agentes** (capabilities, current-state, diseños de módulo
  completados) son **ilustrativas** — producidas al ejecutar los prompts de agentes
  de Kaddo en tu propio LLM. Kaddo nunca llama a un LLM, genera código ni entiende un
  sistema automáticamente.

## Casos de uso relacionados

- [Proyecto nuevo](/es/use-cases/new-project/)
- [Proyecto pre-IA](/es/use-cases/pre-ai-project/)
- [Proyecto legacy](/es/use-cases/legacy-project/)
- [Flujo completo](/es/use-cases/full-workflow/)
