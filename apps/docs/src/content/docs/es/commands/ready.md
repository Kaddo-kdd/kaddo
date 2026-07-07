---
title: kaddo ready
description: Marcar un Work Item en draft como listo para implementación después de revisión humana.
---

```bash
kaddo ready WI-001
```

Transiciona un Work Item en `draft` a `ready` después de revisión humana. Es el paso explícito
de aprobación entre el refinamiento (work-item-agent) y la implementación (implementation-agent).

## Qué hace

1. Encuentra el Work Item por ID en todas las carpetas de ciclo de vida.
2. Muestra un resumen: tipo, nivel de conocimiento, dominios, fuente, ownership de código,
   cantidad de criterios de aceptación y advertencias.
3. Pide confirmación (a menos que se pase `--yes`).
4. Actualiza `status: draft` → `status: ready` en el frontmatter.
5. Agrega un timestamp `ready_at`.
6. Mueve el archivo de `work-items/draft/` a `work-items/ready/`.

## Advertencias

Antes de confirmar, Kaddo verifica problemas comunes:

- No se encontró sección de criterios de aceptación.
- No se declararon globs de ownership de código.
- No se encontró sección de validación.
- Hay preguntas abiertas (se ignora si están marcadas como "Ninguna", "Resueltas" o "Diferidas").
- No se declararon dominios.

Las advertencias son informativas — el usuario puede continuar de todas formas.

## Opciones

| Flag    | Descripción                              |
|---------|------------------------------------------|
| `--yes` | Omitir la confirmación interactiva.      |

## Después de marcar como ready

Ejecuta `kaddo context && kaddo understand` para refrescar el handoff. Kaddo cambiará de
recomendar `work-item-agent` a `implementation-agent`.

```bash
kaddo ready WI-001
kaddo context
kaddo understand
```

## Principios de diseño

- **Aprobación humana**: los agentes refinan, los humanos aprueban. `kaddo ready` es la puerta de aprobación.
- **Ready ≠ implementado**: marcar como ready significa que el alcance está claro, no que el código existe.
- **Sin LLM, sin git**: el comando es completamente determinista y nunca muta control de versiones.
- **Metadata preservada**: source, domains, code globs, generated_by, template_version y
  todo el cuerpo markdown se mantienen intactos.

## Ejemplo

```text
┌  kaddo ready WI-001
│
●  Work Item encontrado:
│  WI-001 — Listar últimas compras en reportes de métricas generales
│
●  Status: draft → ready
●  Tipo: bugfix
●  Nivel de conocimiento: K2
●  Dominios: loyalty
●  Fuente: manual
●  Ownership de código:
│    - src/hooks/useAdminMetrics.ts
│    - src/app/dashboard/page.tsx
│
◇  ¿Marcar este Work Item como listo para implementación?
│  Sí
│
◆  Status actualizado: ready
◆  Archivo movido:
│  knowledge/delivery/work-items/draft/WI-001-...md
│  → knowledge/delivery/work-items/ready/WI-001-...md
│
└  Work Item WI-001 está listo.
```
