---
title: Knowledge Capsules
description: Exporta e importa conocimiento mínimo y portable sobre sistemas externos — contexto sin mapear un repo completo ni leer su código.
---

Una **Knowledge Capsule** es un resumen mínimo, portable y versionable que un proyecto exporta
sobre sí mismo, para que otros proyectos lo consuman como **contexto externo** — sin mapearlo como
módulo multirepo ni tener acceso a su código.

> Kaddo no necesita todo el código externo. Necesita el conocimiento correcto.

En sistemas grandes, una solución depende de muchos repositorios (frontend, payments, identity,
orders…) que pertenecen a otros equipos, tienen acceso restringido, son demasiado grandes o están
fuera de alcance. Rara vez necesitas su código — necesitas saber **cómo integrarte con ellos**.

## Qué responde una cápsula

- ¿Qué hace este sistema? ¿Cuáles son sus responsabilidades y alcance?
- ¿Qué capacidades y **contratos públicos** (APIs, eventos) expone?
- ¿De qué depende y cuáles son los riesgos de integración conocidos?
- ¿Quién es responsable y qué ADRs afectan la integración?
- ¿Qué está **fuera de alcance** de esta cápsula?

## Exportar una cápsula

```bash
kaddo capsule export
```

Lee el `knowledge/` del proyecto (business, product, tech, capabilities, current-state, ADRs,
ownership) y escribe un **draft** determinista:

```text
.kaddo/exports/<project-name>.capsule.md
.kaddo/exports/<project-name>.capsule.json
```

El CLI nunca lee código fuente ni secretos. Refina el draft con el
[`capsule-agent`](/es/modules/agents/) antes de compartirlo — afina propósito, contratos, riesgos y
fuera de alcance, y marca incógnitas.

```md
---
type: knowledge-capsule
system: orders-service
version: 1
updated_at: 2026-06-10
owner: Orders Team
---

# Orders Service — Knowledge Capsule

## Purpose
Gestiona pedidos de clientes, su ciclo de vida y las transiciones de estado.

## Exposed Capabilities
- Order Creation
- Order Status Tracking

## Public Contracts
- `POST /orders`
- `OrderCreated`

## Known Risks
- Las transiciones de estado deben ser idempotentes.

## Out of Scope
- Autorización de pagos
```

## Importar una cápsula

```bash
kaddo capsule add ../orders-service/.kaddo/exports/orders-service.capsule.md
```

Copia la cápsula en `external/<id>.capsule.md` y la registra en `.kaddo/external.yml`:

```yaml
external:
  - id: orders-service
    type: knowledge-capsule
    path: external/orders-service.capsule.md
    owner: Orders Team
    lastImportedAt: 2026-06-10
```

## Dónde aparecen las cápsulas

- **`kaddo context`** agrega una sección `## External Knowledge` (propósito · capacidades ·
  contratos · owner · riesgos) para que el LLM tenga el contexto externo justo.
- **`kaddo explain`** lista las cápsulas registradas y advierte cuando alguna parece desactualizada
  (última actualización > 90 días).
- **`kaddo understand`** te recuerda revisar la cápsula relevante antes de cambiar el
  comportamiento de integración.

## Multirepo vs Knowledge Capsules

| Usa **multirepo** cuando… | Usa una **Knowledge Capsule** cuando… |
|---|---|
| tienes acceso al repo | no quieres mapear el repo completo |
| el repo está en alcance | no tienes acceso completo |
| necesitas mapear módulos | el repo pertenece a otro equipo |
| necesitas ownership cruzado | solo necesitas contexto de integración |
|  | quieres reducir ruido |

## Seguridad

Una cápsula **nunca** debe incluir secrets, tokens, contraseñas, llaves privadas, PII, credenciales
ni código fuente. Revísala antes de compartir. El `capsule-agent` tiene instrucción de nunca
exportarlos.

## Fuera de alcance

Sin escaneo remoto, GitHub API, sincronización automática, permisos, portal, MCP, RAG ni bases de
datos vectoriales. Las cápsulas son Markdown/JSON versionable — se copian como cualquier archivo.

## Ver también

- [Exportar el grafo de conocimiento](/es/knowledge-graph-export/) — las cápsulas importadas
  aparecen en el grafo como relaciones `provides_external_context` hacia tu proyecto.
