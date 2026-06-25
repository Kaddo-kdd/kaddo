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

## Comportamiento

| Situación | Resultado |
|---|---|
| No existe `AGENTS.md` | creado |
| `AGENTS.md` existe | omitido (usa `--force` o `--dry-run`) |
| `--dry-run` | imprime el contenido, no escribe nada |
| `--force` | sobrescribe el archivo existente |

Determinista: sin LLM, sin git, sin código de aplicación. Nunca modifica `knowledge/` ni `.kaddo/`,
y solo escribe `AGENTS.md` en la raíz del proyecto. Funciona en proyectos `new`, `pre-ai` y `legacy`
que ya tengan estructura Kaddo.

## Por qué

Un usuario nuevo ya no tiene que recordar decirle a Codex "lee el context pack, revisa el readiness
del roadmap, usa los Work Items, respeta Guard, no edites `.kaddo/`". Esas instrucciones vienen del
repositorio, haciendo Kaddo más portable y fácil de adoptar con Codex.

## Fuera de alcance

Otros adaptadores (Claude Code, Cursor, Copilot…), `AGENTS.md` por subdirectorio, merge inteligente
con un `AGENTS.md` existente y auto-sync no son parte de esta versión.
