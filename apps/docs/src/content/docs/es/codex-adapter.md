---
title: Adaptador Codex (AGENTS.md)
description: Genera un AGENTS.md para que Codex entienda cómo trabajar dentro de un repositorio gestionado con Kaddo — instrucciones nativas, sin pegar contexto a mano.
---

`kaddo adapters install codex` genera un **`AGENTS.md`** en la raíz del proyecto para que
[Codex](https://openai.com/codex) (y otras herramientas que leen `AGENTS.md`) tenga instrucciones
nativas para trabajar en un repo Kaddo — sin que pegues el context pack, los prompts o las reglas en
el chat.

```bash
kaddo adapters install codex            # escribe AGENTS.md
kaddo export codex                      # alias
kaddo adapters install codex --dry-run  # preview, no escribe nada
kaddo adapters install codex --inject   # agrega/actualiza solo el bloque Kaddo, preserva el resto
kaddo adapters install codex --force    # sobrescribe un AGENTS.md existente
```

> Kaddo sigue siendo la fuente de verdad. `AGENTS.md` es una **proyección generada** — regenéralo en
> vez de editarlo a mano. Referencia knowledge/agents/skills; nunca incrusta el contenido completo de
> los archivos.

## Qué contiene el AGENTS.md generado

- Una explicación breve de que el repo usa Kaddo para Knowledge Driven Development (+ nombre del
  proyecto).
- El **mapa de conocimiento** (`knowledge/business|product|tech|delivery|agents|skills/`) y las rutas
  derivadas de `.kaddo/`, marcadas como salida generada (no editar a mano).
- **Reglas operativas** y el flujo **antes del roadmap** (readiness de preguntas abiertas — resolver,
  asumir o diferir las bloqueantes primero), **antes de implementar** (leer el Work Item activo;
  mantenerse en alcance) y **después de implementar** (sugerir `kaddo guard` / `impact` / `savings` /
  `drift`).
- Listas compactas de **agentes** y **skills** instalados (solo nombres + pistas de rol), y una
  sección MCP cuando se detecta una config MCP de Kaddo.
- Comandos útiles, un checklist de comportamiento del agente y límites de seguridad.

Es deliberadamente compacto — referencias y reglas, no documentos completos. Nunca incrusta
`context-pack.md`, cuerpos de business/product/codebase ni el contenido completo de agentes/skills.

## Command fallback

El `AGENTS.md` generado incluye una sección **Command fallback** para que Codex pueda ejecutar Kaddo
aunque el binario global `kaddo` no esté en `PATH` (común en sandboxes, Codex Cloud, máquinas nuevas
o setups con pnpm local). Le indica a Codex probar, en orden, antes de declarar que Kaddo no está
disponible:

```bash
kaddo <command>                      # preferido
corepack pnpm exec kaddo <command>   # runner local
pnpm exec kaddo <command>
npx kaddo <command>                  # último recurso
```

El adapter solo **documenta** estos comandos para Codex — nunca los ejecuta. Para probarlo, corre
`kaddo adapters install codex --force` y pregúntale a Codex qué haría si `kaddo questions` no está en
`PATH`: debería mencionar probar `corepack pnpm exec kaddo questions`, luego `pnpm exec` y luego `npx`
antes de concluir que Kaddo no está disponible.

## Merge seguro (`--inject`)

Si tu repo ya tiene un `AGENTS.md` con instrucciones propias del equipo, `--inject` integra la guía
de Kaddo **sin reemplazar el archivo**. Escribe un único bloque delimitado:

```md
<!-- BEGIN KADDO CODEX ADAPTER -->
## Kaddo guidance
…
<!-- END KADDO CODEX ADAPTER -->
```

Todo lo que está fuera de los markers se preserva exacto. Volver a correr `--inject` **actualiza ese
bloque en su lugar** en vez de duplicarlo, así puedes regenerar la guía de Kaddo cuando quieras sin
tocar el contenido del equipo. Si el archivo tiene un bloque incompleto (un BEGIN sin END, o
viceversa), el comando falla con un mensaje claro y no cambia nada — corrígelo a mano o usa `--force`.

```bash
# AGENTS.md existente → agrega el bloque Kaddo, conserva las instrucciones del equipo
kaddo adapters install codex --inject

# Previsualiza el resultado combinado sin escribir
kaddo adapters install codex --inject --dry-run
```

Para probarlo: crea un `AGENTS.md` con un par de reglas del equipo, corre
`kaddo adapters install codex --inject`, confirma que tus reglas siguen ahí con un bloque Kaddo
agregado, luego córrelo de nuevo y confirma que el bloque se actualizó — no se duplicó.

## Comportamiento

| Situación | Resultado |
|---|---|
| No existe `AGENTS.md` | creado (proyección completa) |
| `AGENTS.md` existe, sin flag | omitido (sugiere `--inject` / `--force` / `--dry-run`) |
| `--dry-run` | imprime el contenido, no escribe nada |
| `--inject` | agrega o actualiza solo el bloque Kaddo, preservando el resto |
| `--inject --dry-run` | imprime el resultado combinado, no escribe nada |
| `--inject` con markers inválidos | error, archivo intacto |
| `--force` | sobrescribe el archivo completo |

Determinista: sin LLM, sin git, sin código de aplicación. Nunca modifica `knowledge/` ni `.kaddo/`,
y solo escribe `AGENTS.md` en la raíz del proyecto. Funciona en proyectos `new`, `pre-ai` y `legacy`
que ya tengan estructura Kaddo.

## Por qué

Un usuario nuevo ya no tiene que recordar decirle a Codex "lee el context pack, revisa el readiness
del roadmap, usa los Work Items, respeta Guard, no edites `.kaddo/`". Esas instrucciones vienen del
repositorio, haciendo Kaddo más portable y fácil de adoptar con Codex.

## Fuera de alcance

Otros adaptadores (Claude Code, Cursor, Copilot…), `AGENTS.md` por subdirectorio, merge semántico/
inteligente (resolución de conflictos, reordenar secciones externas, múltiples bloques Kaddo) y
auto-sync no son parte de esta versión.
