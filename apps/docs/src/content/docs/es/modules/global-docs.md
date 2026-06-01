---
title: Estándares, seguridad y stack
description: Artefactos de conocimiento globales opcionales para todo el sistema.
---

Son artefactos de conocimiento **globales** — describen todo el sistema, no un
módulo concreto. No se crean en `kaddo init`; instálalos a demanda para que el
conocimiento sea progresivo.

```bash
kaddo add standards   # → architecture/standards.md
kaddo add security    # → architecture/security.md
kaddo add stack       # → architecture/stack.md
```

Cada uno trae una plantilla inicial ligera que refinas con el agente operativo
correspondiente en tu LLM, usando `.kaddo/context-pack.md` como input.

| Módulo | Artefacto | Refinar con |
|---|---|---|
| `standards` | `architecture/standards.md` | `standards-agent` |
| `security` | `architecture/security.md` | `security-agent` |
| `stack` | `architecture/stack.md` | `stack-agent` |

## Estándares

Convenciones ligeras de código, documentación y testing más un checklist de PR —
unas pocas reglas de alto valor superan a una política larga.

## Seguridad

Documenta **consideraciones de seguridad** (auth, sensibilidad de datos, secretos,
riesgos de dependencias y despliegue, preguntas abiertas).

> Kaddo **no** realiza escaneo de seguridad ni de vulnerabilidades. El artefacto
> documenta inquietudes para humanos y agentes — no audita el código.

## Stack

Lenguajes, frameworks, datos, infraestructura, tooling e incógnitas por confirmar.

> Los archivos existentes nunca se sobrescriben. Re-ejecutar `kaddo add` solo instala
> los que falten.
