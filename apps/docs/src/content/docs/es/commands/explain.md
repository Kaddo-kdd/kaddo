---
title: kaddo explain
description: Explica el Repositorio de Conocimiento para humanos o agentes.
---

```bash
kaddo explain                      # resumen legible para humanos
kaddo explain --for agent          # JSON estructurado para herramientas de IA
kaddo explain --scope payments     # limita a un dominio o palabra clave
kaddo explain --type adr           # limita a un tipo de artefacto
kaddo explain --since 2026-01-01   # limita por fecha de creación
```

La salida de `--for agent` es JSON estructurado que incluye artefactos, dominios,
`domain_owners`, `installed_modules` y `enabled_plugins` — para que los agentes
partan de contexto real en lugar de suposiciones.
