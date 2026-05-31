---
title: Resumen de módulos
description: Módulos opcionales instalados con kaddo add.
---

Los módulos extienden Kaddo con nuevos tipos de artefacto y directorios. Instala uno con:

```bash
kaddo add adr
```

| Módulo | Agrega |
|---|---|
| `adr` | Architecture Decision Records (K4) |
| `rfc` | Request for Comments (K3) |
| `incident` | Reportes de incidentes (K3) |
| `migration` | Planes de migración (K4) |
| `legacy` | Notas de sistemas legacy (K3) |
| `contracts` | Contratos de API/datos (K4) |
| `capabilities` | Capacidades de producto (K3) |
| `guard-advanced` | Reglas de guard para CI (`rules.yml`) |
| `agents` | Definiciones de agentes |
| `skills` | Definiciones de skills |

Cada módulo declara sus directorios, tipos de work item y quality gates. Los módulos
se registran en `.kaddo/config.yml` bajo una clave `module_<name>`.
