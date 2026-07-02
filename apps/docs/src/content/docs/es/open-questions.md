---
title: Preguntas abiertas
description: Un gate de readiness para que los agentes no generen roadmap, Work Items ni planes de implementación sobre preguntas abiertas sin confirmar.
---

`kaddo bootstrap` deja secciones `## Open Questions` en los archivos de conocimiento — pero son
fáciles de olvidar. Este VS las convierte en un **gate de readiness**: antes de generar un roadmap,
crear Work Items o implementar, los agentes verifican si hay decisiones **bloqueantes** abiertas y
te piden resolverlas, asumirlas o diferirlas primero.

> Pregunta abierta ≠ documentación decorativa. Una pregunta debe llegar a un desenlace:
> **resolved**, **assumed** o **deferred**.

**No** es un paso obligatorio del CLI — el flujo principal (`init → scan → add agents → context →
understand → bootstrap`) no cambia. El gate vive donde actúan los agentes.

## Comando opcional

```bash
kaddo questions          # resumen de preguntas abiertas + readiness del roadmap
kaddo readiness          # alias
kaddo questions --json
kaddo questions --output .kaddo/reports/questions-report.md
```

```text
Open questions detected: 4
Roadmap readiness: needs decisions (blocking open: 2, important open: 2)

Blocking (open):

1. ¿El proyecto será API backend, web app o CLI?
   Source: knowledge/product/product.md:12
   Status: open
   Severity: blocking
   Suggested action:
     Cambia [open] por [resolved], [assumed] o [deferred].
   Example:
     - [assumed] ¿El proyecto será API backend, web app o CLI?
       - note: <supuesto editable para el MVP>

Cómo resolver
...
```

## Ubicación y guía de resolución

Cada pregunta es **accionable**: `kaddo questions` muestra exactamente dónde vive y cómo actualizarla
— sin `grep`/`rg`/`Select-String` manual. Por cada pregunta imprime `Source` (`ruta:línea`), `Status`,
`Severity`, la `Note` capturada, y — para bloqueantes abiertas — un `Example` copy/paste con una nota
placeholder (nunca una decisión de negocio inventada). Una guía **Cómo resolver** localizada (EN/ES)
cierra la salida. `kaddo questions --json` y el reporte Markdown llevan `sourcePath`, `line`, `raw` y
`note` por pregunta, y el recurso MCP `kaddo://open-questions` expone los mismos campos.

## Clasificación

Cada pregunta encontrada en `business.md`, `product.md`, `codebase.md` o `roadmap.md` se clasifica
con heurísticas de keywords conservadoras y deterministas (ante la duda → `important`):

| Clase | Significado | Ejemplos |
|---|---|---|
| **blocking** | afecta alcance, arquitectura o los primeros Work Items | API vs web vs CLI, stack/framework, auth, persistencia, MVP |
| **important** | relevante, pero un supuesto temporal desbloquea | sponsors, paginación, roles, validaciones |
| **deferred** | puede pasar a una fase posterior | integraciones, analytics, notificaciones, pagos |

El readiness del roadmap es **`needs_decisions`** cuando hay alguna pregunta bloqueante **abierta**,
**`ready`** cuando no hay, **`unknown`** cuando no existen preguntas. Las bloqueantes abiertas reciben
un **supuesto sugerido** neutral (nunca inventa especificidades — "empezar como API backend para
mantener el alcance pequeño").

## Seguimiento de resolución

Una pregunta no es solo texto — tiene un **estado de resolución**. Prefija un bullet con un token para
que Kaddo distinga una pregunta realmente pendiente de una ya decidida, asumida o postergada:

```md
## Preguntas abiertas

- [abierta] ¿Los proyectos se referencian por id numérico, nombre o ambos en la CLI?
- [resuelta] Los proyectos se referencian por id numérico en la CLI.
- [asumida] Se asume que la persistencia local usa SQLite para el MVP.
- [diferida] La sincronización remota queda fuera del MVP.
```

También funcionan los tokens en inglés: `[open]`, `[resolved]`, `[assumed]`, `[deferred]`. Un bullet
**sin** token se trata como `open` (totalmente compatible hacia atrás). Metadata opcional puede seguir
como sub-bullet indentado, p. ej. `- note: el nombre es solo para visualización` → `resolution_note`.

**Solo las preguntas `open` bloquean el readiness.** Una pregunta `blocking` que esté `resolved`,
`assumed` o `deferred` ya no bloquea — se muestra como contexto (supuestos a revisar, items fuera de
alcance) pero la ejecución continúa. `kaddo questions` reporta conteos por estado y `--json` incluye
`resolution_status` (y `resolution_note`) por pregunta más un resumen `resolution`.

| Clasificación + estado | ¿Bloquea readiness? |
|---|---|
| blocking + `open` | sí |
| blocking + `resolved` / `assumed` / `deferred` | no (se muestra como decisión / supuesto / fuera de alcance) |

## Cómo lo usan los agentes

Los prompts de `roadmap-agent`, `work-item-agent`, `implementation-agent` y `bootstrap-agent` ahora
revisan el gate. Por ejemplo, al pedir *"genera el roadmap"* con preguntas bloqueantes abiertas, el
roadmap-agent se detiene:

> Antes de generar el roadmap encontré preguntas bloqueantes que afectan el alcance del MVP.
> Puedo continuar con estos supuestos: … ¿Confirmo y continúo?

Solo continúa cuando confirmas los supuestos (o resuelves/difieres las preguntas), y registra los
supuestos confirmados en el roadmap. `kaddo understand` también te avisa cuando hay preguntas
bloqueantes.

## Por MCP

De solo lectura: `kaddo://open-questions` (preguntas clasificadas) y `kaddo://roadmap-readiness`
(resumen orientado a decisión), más la tool `kaddo_generate_questions_report` (escribe solo bajo
`.kaddo/reports/`). Nada resuelve preguntas automáticamente, edita conocimiento ni usa LLM.

## Límites

Kaddo nunca modifica `business.md` / `product.md` / `codebase.md`, nunca resuelve preguntas sin
confirmación humana, nunca bloquea comandos del CLI y nunca te obliga a responder todo. Saca las
decisiones a la luz en el momento correcto — evitando que el roadmap nazca sobre supuestos
invisibles.
