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

En cada sección de abajo, el bloque **inicial** es exactamente lo que instala el CLI; el
bloque **rellenado** es un resultado ilustrativo tras refinarlo con el agente en tu LLM.

## Estándares

Convenciones ligeras de código, documentación y testing más un checklist de PR —
unas pocas reglas de alto valor superan a una política larga.

Inicial (`architecture/standards.md` tal como se instala):

```md
# Standards

> Starter template. Refine it with the Kaddo `standards-agent` in your LLM.
> Keep it lightweight — a handful of high-value rules beats a long policy.

## Coding standards

- TODO: language/style conventions aligned with the detected stack.

## Documentation standards

- TODO: what must be documented, and where (artifacts near the code).

## Testing expectations

- TODO: minimum testing expectations per change type.

## PR checklist

- [ ] Linked to the right Work Item.
- [ ] Knowledge updated or intentionally left unchanged.
- [ ] Tests added/updated where it matters.
```

Ejemplo rellenado (ilustrativo):

```md
# Standards

## Coding standards

- TypeScript en modo strict; sin `any` sin un comentario `// reason:`.
- ESLint + Prettier son la fuente de verdad — sin debates de estilo en review.
- La lógica de dominio vive en `src/<domain>/`; sin reglas de negocio en controllers.

## Documentation standards

- Cada Work Item lleva globs `code:` de los archivos que posee.
- ADRs para decisiones caras de revertir (`kaddo add adr`).

## Testing expectations

- Los bug fixes incluyen un test de regresión.
- La lógica de dominio nueva incluye unit tests; controllers cubiertos por integración.

## PR checklist

- [ ] Linked to the right Work Item.
- [ ] Knowledge updated or intentionally left unchanged.
- [ ] Tests added/updated where it matters.
```

## Seguridad

Documenta **consideraciones de seguridad** (auth, sensibilidad de datos, secretos,
riesgos de dependencias y despliegue, preguntas abiertas).

> Kaddo **no** realiza escaneo de seguridad ni de vulnerabilidades. El artefacto
> documenta inquietudes para humanos y agentes — no audita el código.

Inicial (`architecture/security.md` tal como se instala):

```md
# Security Considerations

> Starter template. Refine it with the Kaddo `security-agent` in your LLM.
> Kaddo does **not** perform security scanning — this documents concerns for humans.

## Authentication & authorization

- TODO

## Data sensitivity

- TODO

## Secrets handling

- TODO

## Dependency risks

- TODO

## Deployment risks

- TODO

## Open questions

- TODO
```

Ejemplo rellenado (ilustrativo):

```md
# Security Considerations

## Authentication & authorization

- Access tokens JWT (15 min) + refresh tokens rotativos en cookie httpOnly.
- Los checks de rol se aplican en `src/auth/guards/`; nunca confíes en el rol del cliente.

## Data sensitivity

- PII: email, dirección. Cifrados en reposo; nunca se loguean.
- Los datos de pago se tokenizan vía el proveedor — no guardamos números de tarjeta.

## Secrets handling

- Los secretos vienen de variables de entorno; `.env` está en git-ignore.
- La rotación la gestiona el equipo de plataforma; sin secretos en código ni artefactos.

## Dependency risks

- `npm audit` revisado antes de cada release (manual, no impuesto en CI).

## Deployment risks

- Las migraciones corren antes del deploy; las destructivas requieren un ADR.

## Open questions

- ¿Necesitamos cifrado a nivel de campo para direcciones? Pendiente de revisión legal.
```

## Stack

Lenguajes, frameworks, datos, infraestructura, tooling e incógnitas por confirmar.

Inicial (`architecture/stack.md` tal como se instala):

```md
# Stack

> Starter template. Refine it with the Kaddo `stack-agent` in your LLM.

## Languages

- TODO

## Frameworks

- TODO

## Data

- TODO

## Infrastructure

- TODO

## Tooling

- TODO

## Unknowns / needs confirmation

- TODO
```

Ejemplo rellenado (ilustrativo):

```md
# Stack

## Languages

- TypeScript (Node.js 20).

## Frameworks

- NestJS (API), Prisma (ORM), Next.js (web).

## Data

- PostgreSQL (primaria), Redis (cache + colas).

## Infrastructure

- Docker + AWS ECS; Terraform para infra-as-code.

## Tooling

- pnpm workspaces, Vitest, ESLint, GitHub Actions.

## Unknowns / needs confirmation

- Si el worker debería pasar de Redis a SQS a escala.
```

> Los archivos existentes nunca se sobrescriben. Re-ejecutar `kaddo add` solo instala
> los que falten. Los ejemplos rellenados son ilustrativos — Kaddo nunca genera
> contenido automáticamente; lo produces tú ejecutando los agentes en tu propio LLM.
