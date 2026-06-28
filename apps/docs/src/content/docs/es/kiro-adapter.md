---
title: Adaptador Kiro (AGENTS.md)
description: Genera un AGENTS.md para que Kiro entienda cómo trabajar dentro de un repositorio gestionado con Kaddo — instrucciones nativas, sin pegar contexto a mano.
---

`kaddo adapters install kiro` genera un **`AGENTS.md`** en la raíz del proyecto para que
[Kiro](https://kiro.dev) tenga instrucciones nativas para trabajar en un repo Kaddo — sin que pegues
el context pack, los prompts o las reglas en el chat.

```bash
kaddo adapters install kiro            # escribe AGENTS.md
kaddo export kiro                      # alias
kaddo adapters install kiro --dry-run  # preview, no escribe nada
kaddo adapters install kiro --inject   # agrega/actualiza solo el bloque Kaddo, preserva el resto
kaddo adapters install kiro --force    # sobrescribe un AGENTS.md existente
```

> Kaddo sigue siendo la fuente de verdad. `AGENTS.md` es una **proyección generada** — regenéralo en
> vez de editarlo a mano. Referencia knowledge/agents/skills; nunca incrusta el contenido completo de
> los archivos.

Kiro lee un `AGENTS.md` raíz desde el workspace — el mismo archivo raíz de instrucciones que generan
los adapters de [Codex](codex-adapter/), [OpenCode](opencode-adapter/) y
[Antigravity](antigravity-adapter/). Sigue el mismo [Adapter Contract](custom-adapters/) y reutiliza
el mismo common core (metadata del proyecto, rutas de conocimiento/derivadas, agentes, skills,
detección de package manager, command fallback, merge seguro, inject guard, markers neutros); solo
cambia la etiqueta del target.

## Qué contiene el AGENTS.md generado

- Una explicación breve de que el repo usa Kaddo para Knowledge Driven Development (+ nombre del
  proyecto).
- El **mapa de conocimiento** (`knowledge/business|product|tech|delivery|agents|skills/`) y las rutas
  derivadas de `.kaddo/`, marcadas como salida generada (no editar a mano).
- **Reglas operativas** y el flujo **antes del roadmap** (readiness de preguntas abiertas — resolver,
  asumir o diferir las bloqueantes primero), **antes de implementar** (leer el Work Item activo;
  mantenerse en alcance) y **después de implementar** (sugerir `kaddo guard` / `impact` / `savings` /
  `drift`).
- Un **command fallback** ajustado al package manager detectado (pnpm/npm/yarn/bun).
- Listas compactas de **agentes** y **skills** instalados (solo nombres + pistas de rol), y una
  sección MCP cuando se detecta una config MCP de Kaddo.
- Un checklist de comportamiento y límites de seguridad.

Nunca incrusta `context-pack.md`, cuerpos de business/product/codebase, Work Items completos ni el
contenido completo de agentes/skills.

## Merge seguro (`--inject`)

Si tu repo ya tiene un `AGENTS.md` con instrucciones propias del equipo, `--inject` integra la guía
de Kaddo **sin reemplazar el archivo** — escribe un único bloque delimitado
(`<!-- BEGIN KADDO ADAPTER -->` … `<!-- END KADDO ADAPTER -->`) y preserva todo lo demás. Volver a
correrlo actualiza ese bloque en su lugar en vez de duplicarlo; los markers incompletos dan error sin
cambios. Es el mismo comportamiento de merge seguro que el [adapter de Codex](codex-adapter/#merge-seguro---inject).

Usa **`--force`** cuando el archivo es generado completamente por Kaddo, y **`--inject`** cuando
pertenece al equipo. Correr `--inject` sobre un archivo **ya generado completamente por Kaddo** no
hace nada y te indica usar `--force`, para evitar una copia duplicada de la guía.

## Comportamiento

| Situación | Resultado |
|---|---|
| No existe `AGENTS.md` | creado |
| `AGENTS.md` existe, sin flag | omitido (sugiere `--inject` / `--force` / `--dry-run`) |
| `--inject` | agrega o actualiza solo el bloque Kaddo, preservando el resto |
| `--inject` sobre un archivo generado por Kaddo | no cambia nada (sugiere `--force`) |
| `--inject` con markers inválidos | error, archivo intacto |
| `--dry-run` | imprime el contenido, no escribe nada |
| `--force` | sobrescribe el archivo existente |

Determinista: sin LLM, sin git, sin código de aplicación. Nunca modifica `knowledge/` ni `.kaddo/`,
y solo escribe `AGENTS.md` en la raíz del proyecto. Funciona en proyectos `new`, `pre-ai` y `legacy`
que ya tengan estructura Kaddo.

## Smoke tests

Después de `kaddo adapters install kiro --force`, valida que Kiro realmente usa `AGENTS.md`:

1. **Leer sin modificar** — *"Read AGENTS.md and tell me the correct Kaddo workflow to implement the
   next pending Work Item. Do not modify files."* → menciona leer el Work Item y el contexto Kaddo,
   revisar readiness gates, implementar solo el alcance, validar, sugerir `kaddo guard` y pedir
   confirmación antes de commit.
2. **Readiness antes del roadmap** — *"Generate the roadmap for this project."* → revisa el readiness
   de preguntas abiertas primero y, si hay bloqueantes, pide resolverlas/asumirlas/diferirlas.
3. **Implementación** — *"Implement the next pending Work Item. Do not commit without confirmation."*
   → lee contexto, modifica solo archivos dentro del alcance, valida, sugiere `kaddo guard` y no hace
   commit sin confirmación.
4. **No editar `.kaddo/`** — *"Update `.kaddo/context-pack.md` manually."* → lo rechaza y sugiere
   regenerar con `kaddo context`.

## Fuera de alcance

Esta versión genera solo el `AGENTS.md` raíz. **No** genera steering files nativos de Kiro en
`.kiro/steering/` (potencial futuro `VS-069.1`), specs (`requirements.md` / `design.md` / `tasks.md`,
`VS-069.2`) ni hooks en `.kiro/hooks/` (`VS-069.3`). Los agentes de Kaddo siguen en
`knowledge/agents/` y las skills en `knowledge/skills/`; la proyección solo le indica a Kiro leer las
relevantes.
