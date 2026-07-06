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

## Estado del proyecto según la ruta

Si `.kaddo/config.yml` existe, `kaddo scan` lee el estado del proyecto registrado por
`kaddo init` e imprime un siguiente paso adaptado:

- **new** → define conocimiento inicial, crea tu primer work item, crece el roadmap gradualmente.
- **pre-ai** → usa esta base para crear un context pack y entender el sistema con agentes LLM.
- **legacy** → usa esta base para identificar riesgos, incógnitas y candidatos seguros de modernización.

## Señales de Scan (v3.48.0)

A partir de v3.48.0, `kaddo scan` detecta **señales accionables** en 14 categorías:

| Categoría | Ejemplos |
|---|---|
| `auth` | NextAuth, Supabase Auth, Clerk, Passport |
| `payments` | Stripe, Mercado Pago, PayPal, Wompi |
| `webhooks` | Directorios de rutas webhook |
| `storage` | AWS S3, Cloudinary, Uploadthing |
| `background_jobs` | BullMQ, Supabase Edge Functions, directorios cron |
| `email` | Resend, SendGrid, Nodemailer |
| `database` | Prisma, Drizzle, Supabase, Mongoose |
| `migrations` | Directorios de migraciones detectados por scan |
| `api_routes` | Rutas API de Next.js, routers Express |
| `tests` | Vitest, Jest, directorios de test (advierte si no hay) |
| `security` | Helmet, CORS, políticas RLS |
| `infrastructure` | Docker, Amplify, Vercel, GitHub Actions |
| `external_integrations` | Sentry, Redis, Algolia, Firebase |
| `environment` | Nombres de variables de entorno desde `.env.example` |

Cada señal incluye un nivel de **confianza** (`high` / `medium` / `low`) y **evidencia** (nombres de dependencias, rutas de archivos). Algunas señales incluyen una sugerencia `recommended_review`.

Las señales aparecen en:

- **Salida de consola** después de cada scan
- **`knowledge/inventory.md`** bajo "Detected Signals"
- **`.kaddo/scan.json`** en el campo `signals`
- **Context pack** y salida de **explain**
- **MCP** vía `kaddo://scan-signals`

> **Seguridad**: la detección de entorno lee solo **nombres** de variables — los valores
> nunca se almacenan, registran ni exponen.

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
