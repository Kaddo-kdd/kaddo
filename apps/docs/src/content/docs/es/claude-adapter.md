---
title: Adaptador Claude Code (CLAUDE.md)
description: Genera un CLAUDE.md para que Claude Code entienda cómo trabajar dentro de un repositorio gestionado con Kaddo — instrucciones nativas, sin pegar contexto a mano.
---

`kaddo adapters install claude` genera un **`CLAUDE.md`** en la raíz del proyecto para que
[Claude Code](https://claude.com/claude-code) tenga instrucciones nativas para trabajar en un repo
Kaddo — sin que pegues el context pack, los prompts o las reglas en el chat.

```bash
kaddo adapters install claude            # escribe CLAUDE.md
kaddo export claude                      # alias
kaddo adapters install claude --dry-run  # preview, no escribe nada
kaddo adapters install claude --inject   # agrega/actualiza solo el bloque Kaddo, preserva el resto
kaddo adapters install claude --force    # sobrescribe un CLAUDE.md existente
```

> Kaddo sigue siendo la fuente de verdad. `CLAUDE.md` es una **proyección generada** — regenéralo en
> vez de editarlo a mano. Referencia knowledge/agents/skills; nunca incrusta el contenido completo de
> los archivos.

Sigue el mismo [Adapter Contract](custom-adapters/) que el [adapter de Codex](codex-adapter/) de
referencia y reutiliza el mismo common core (metadata del proyecto, rutas de conocimiento/derivadas,
agentes, skills, detección de package manager, command fallback). Solo cambia el renderer destino
(`AGENTS.md` para Codex → `CLAUDE.md` para Claude Code).

## Qué contiene el CLAUDE.md generado

- Una explicación breve de que el repo usa Kaddo para Knowledge Driven Development (+ nombre del
  proyecto).
- El **mapa de conocimiento** (`knowledge/business|product|tech|delivery|agents|skills/`) y las rutas
  derivadas de `.kaddo/`, marcadas como salida generada (no editar a mano).
- **Reglas operativas** y el flujo **antes del roadmap** (readiness de preguntas abiertas — resolver,
  asumir o diferir las bloqueantes primero), **antes de implementar** (leer el Work Item activo;
  mantenerse en alcance) y **después de implementar** (sugerir `kaddo guard` / `impact` / `savings` /
  `drift`).
- Un **command fallback** ajustado al package manager detectado (pnpm/npm/yarn/bun), con el `kaddo`
  global siempre preferido.
- Listas compactas de **agentes** y **skills** instalados (solo nombres + pistas de rol), y una
  sección MCP cuando se detecta una config MCP de Kaddo.
- Un checklist de comportamiento y límites de seguridad.

Nunca incrusta `context-pack.md`, cuerpos de business/product/codebase, Work Items completos ni el
contenido completo de agentes/skills.

## Merge seguro (`--inject`)

Si tu repo ya tiene un `CLAUDE.md` con instrucciones propias del equipo, `--inject` integra la guía
de Kaddo **sin reemplazar el archivo** — escribe un único bloque delimitado
(`<!-- BEGIN KADDO ADAPTER -->` … `<!-- END KADDO ADAPTER -->`) y preserva todo lo demás. Volver a
correrlo actualiza ese bloque en su lugar en vez de duplicarlo. Es el mismo comportamiento de merge
seguro que el [adapter de Codex](codex-adapter/#merge-seguro---inject).

```bash
kaddo adapters install claude --inject             # agrega el bloque Kaddo, conserva instrucciones
kaddo adapters install claude --inject --dry-run   # previsualiza el resultado sin escribir
```

Usa **`--force`** cuando el archivo es generado completamente por Kaddo, y **`--inject`** cuando
pertenece al equipo. Correr `--inject` sobre un archivo **ya generado completamente por Kaddo** no
hace nada y te indica usar `--force`, para evitar una copia duplicada de la guía.

## Comportamiento

| Situación | Resultado |
|---|---|
| No existe `CLAUDE.md` | creado |
| `CLAUDE.md` existe, sin flag | omitido (sugiere `--inject` / `--force` / `--dry-run`) |
| `--inject` | agrega o actualiza solo el bloque Kaddo, preservando el resto |
| `--inject` sobre un archivo generado por Kaddo | no cambia nada (sugiere `--force`) |
| `--dry-run` | imprime el contenido, no escribe nada |
| `--force` | sobrescribe el archivo existente |

Determinista: sin LLM, sin git, sin código de aplicación. Nunca modifica `knowledge/` ni `.kaddo/`,
y solo escribe `CLAUDE.md` en la raíz del proyecto. Funciona en proyectos `new`, `pre-ai` y `legacy`
que ya tengan estructura Kaddo.

## Smoke tests

Después de `kaddo adapters install claude --force`, valida que Claude Code realmente usa `CLAUDE.md`:

1. **Leer sin modificar** — *"Read CLAUDE.md and tell me the correct Kaddo workflow to implement the
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

Esta versión genera solo `CLAUDE.md`. **No** genera skills nativas de Claude Code (potencial futuro
`VS-066.1 — Claude Code Skills Projection`) ni slash commands (potencial futuro
`VS-066.2 — Claude Code Commands Projection`). Las skills de Kaddo siguen en `knowledge/skills/`; la
proyección solo le indica a Claude leer las relevantes.
