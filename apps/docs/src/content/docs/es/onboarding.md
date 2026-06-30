---
title: Onboarding Pre-IA
description: kaddo onboarding diagnostica qué tan listo está un proyecto existente (pre-IA) para trabajar con agentes y recomienda el único siguiente paso más importante.
---

`kaddo onboarding` (alias `kaddo onboard`) es una **brújula de solo lectura** para proyectos
existentes inicializados como `pre-ai`. Lee las señales que Kaddo ya tiene — config, scan, understand,
archivos de conocimiento, readiness de preguntas abiertas, roadmap, Work Items y estado de adapters —
y responde una pregunta:

> ¿Dónde estoy en el ciclo pre-IA y cuál es el único siguiente paso?

```bash
kaddo onboarding          # diagnóstico en consola (alias: onboard)
kaddo onboarding --json   # lo mismo, como JSON
kaddo report onboarding   # escribe .kaddo/reports/onboarding-report.{md,json}
```

**No** reemplaza a `init`, `scan`, `understand`, `questions`, `roadmap`, `create` ni `guard` —
diagnostica dónde estás y apunta al siguiente comando. Nunca ejecuta esos comandos, nunca instala
adapters, nunca edita `knowledge/` ni código, sin git, sin LLM. `kaddo onboarding` no escribe nada;
`kaddo report onboarding` solo escribe en `.kaddo/reports/`.

## El ciclo pre-IA

```txt
kaddo init  (state: pre-ai)
→ kaddo scan
→ kaddo understand
→ kaddo onboarding        ← diagnóstico y brújula
→ kaddo questions
→ kaddo roadmap
→ kaddo create --from roadmap
→ kaddo adapters install <adapter>
→ implementación
→ kaddo guard
```

## Estado

`onboarding` reporta un estado general y recomienda exactamente un siguiente paso:

| Estado | Significado | Siguiente |
|---|---|---|
| `not-initialized` | sin config de Kaddo | `kaddo init` |
| `not-applicable` | proyecto `new` | usar el flujo estándar de proyecto nuevo |
| `legacy-project` | proyecto `legacy` | usar el flujo legacy |
| `initialized` | no hay `.kaddo/scan.json` | `kaddo scan` |
| `scanned` | no hay `.kaddo/understand.md` | `kaddo understand` |
| `knowledge-incomplete` | falta/está débil un archivo clave | completar el archivo priorizado |
| `needs-decisions` | hay una pregunta bloqueante aún `open` | resolverla / asumirla / diferirla |
| `ready-for-roadmap` | conocimiento listo, sin candidatos de roadmap | `kaddo roadmap` |
| `ready-for-work-item` | el roadmap tiene candidatos, sin Work Item listo | `kaddo create --from roadmap` |
| `ready-for-implementation` | existe un Work Item ready/in-progress | instalar un adapter e implementar |

La completitud del conocimiento se revisa en orden de prioridad: `current-state.md` → `codebase.md` →
`capabilities.md` → `product.md` → `business.md`. Un archivo con solo un encabezado/front matter
cuenta como **weak** y todavía hay que completarlo.

Las preguntas usan [seguimiento de resolución](open-questions/): solo las `blocking + open` mueven el
estado a `needs-decisions`. Las assumed, resolved y deferred se muestran (como conteos de supuestos)
pero nunca bloquean.

## JSON

`kaddo onboarding --json` emite `project_name`, `project_type`, `status`, un objeto `signals` (scan,
understand, los cinco archivos de conocimiento, roadmap, work_items, adapters instalados y conteos de
preguntas por estado de resolución) y un único `recommended_next_step` (`label` + `command` opcional).
