---
title: Assets instalados (versiones de agentes y skills)
description: Kaddo versiona el conocimiento operativo que instala. kaddo agents status / skills status muestran si tus agentes y skills instalados están alineados con la versión actual del paquete.
---

La versión del CLI no garantiza la versión de los **agentes y skills instalados en tu proyecto**. Un
`@kaddo/cli` actualizado puede convivir con un `capability-agent.md` o `adr-writing/skill.md` generado
por una versión anterior — lo que puede dar comportamiento inconsistente. Kaddo ahora versiona ese
conocimiento operativo y reporta si está alineado.

```bash
kaddo agents status     # agentes instalados, su versión y estado
kaddo skills status     # skills instaladas, su versión y estado
kaddo agents update     # refresca agentes desactualizados (no sobrescribe ediciones sin --force)
kaddo skills update
```

Los agentes y skills instalados llevan un campo `version:` en el front matter, fijado a la versión del
paquete Kaddo al instalar. `kaddo add agents` / `kaddo add skills` lo escriben automáticamente.

## Estados

Cada agente/skill instalado se clasifica contra el paquete actual:

| Estado | Significado | `update` |
|---|---|---|
| `up-to-date` | versión instalada = versión del paquete, contenido coincide | nada |
| `outdated` | la versión instalada es menor | se refresca |
| `unknown-version` | el archivo no tiene `version:` (instalado antes de esta feature) | se omite salvo `--force` |
| `modified` | la versión coincide pero el contenido fue editado localmente | se omite salvo `--force` |
| `missing` | el asset del catálogo no está instalado | queda para `kaddo add` |

`update` es seguro por defecto: refresca los `outdated` pero **nunca sobrescribe** un archivo
`modified` o `unknown-version` sin `--force`, protegiendo las ediciones locales. Nunca usa LLM ni
ejecuta git.

## Dónde aparece

- `kaddo explain` muestra un bloque compacto `## Installed Assets` (versión del CLI + conteos de
  outdated/unknown/modified) y sugiere correr los comandos de status.
- `kaddo understand` advierte cuando un agente **recomendado** está desactualizado.
- `kaddo context` (`.kaddo/context-pack.json`) incluye un resumen `installedAssets`.
- El recurso MCP de solo lectura `kaddo://installed-assets` devuelve el mismo estado a los agentes
  conectados; nunca actualiza.

## La regla

> Kaddo no solo versiona el CLI — también versiona el conocimiento operativo (agentes y skills) que
> instala en el proyecto.
