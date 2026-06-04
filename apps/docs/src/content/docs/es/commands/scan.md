---
title: kaddo scan
description: Detecta tu stack de forma determinista.
---

```bash
kaddo scan
```

Detecta lenguaje, framework, gestor de paquetes, directorios de código,
directorios de migraciones, archivos de contratos, infraestructura y directorios de
test. Sugiere dominios para confirmación humana — nunca asume.

## Artifacts generados

`kaddo scan` persiste una base reutilizable del estado técnico del proyecto:

- **`.kaddo/scan.json`** — estructurado, legible por máquina. Lo usan el CLI y los
  futuros comandos de context pack. Se regenera en cada scan.
- **`knowledge/inventory.md`** — inventario legible para humanos que puedes pegar en
  un chat LLM. Si el archivo ya existe, se pide confirmación antes de sobrescribir.

Esta base es el primer insumo del flujo de Knowledge Driven Development: el CLI prepara
señales determinísticas y tus agentes LLM las convierten en entendimiento.

> El scan **no** interpreta tu sistema. Detecta señales y hace preguntas de
> confirmación — nunca afirma conocer tus capacidades de negocio ni tu arquitectura.

Ejemplo de `knowledge/inventory.md`:

```markdown
# Project Inventory

## Detected Stack

- Language: typescript
- Framework: next
- Package manager: pnpm

## Possible Domains

- auth
- payments

## Open Questions

- Confirm whether the 'payments' domain reflects a real bounded context.
```
