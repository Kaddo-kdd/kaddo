---
title: Standards, security & stack
description: Optional global knowledge artifacts for the whole system.
---

These are **global** knowledge artifacts — they describe the whole system, not a
single module. They are not created during `kaddo init`; install them on demand so
knowledge stays progressive.

```bash
kaddo add standards   # → knowledge/tech/standards.md
kaddo add security    # → knowledge/tech/security.md
kaddo add stack       # → knowledge/tech/stack.md
```

Each ships a thin starter template you refine with the matching operational agent
in your LLM, using `.kaddo/context-pack.md` as input.

| Module | Artifact | Refine with |
|---|---|---|
| `standards` | `knowledge/tech/standards.md` | `standards-agent` |
| `security` | `knowledge/tech/security.md` | `security-agent` |
| `stack` | `knowledge/tech/stack.md` | `stack-agent` |

In each section below, the **starter** block is exactly what the CLI installs; the
**filled** block is an illustrative result after refining it with the agent in your LLM.

## Standards

Lightweight coding, documentation and testing conventions plus a PR checklist —
a handful of high-value rules beats a long policy.

Starter (`knowledge/tech/standards.md` as installed):

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

Filled example (illustrative):

```md
# Standards

## Coding standards

- TypeScript strict mode on; no `any` without a `// reason:` comment.
- ESLint + Prettier are the source of truth — no manual style debates in review.
- Domain logic lives in `src/<domain>/`; no business rules in controllers.

## Documentation standards

- Every Work Item carries `code:` globs for the files it owns.
- ADRs for decisions that are expensive to reverse (`kaddo add adr`).

## Testing expectations

- Bug fixes ship with a regression test.
- New domain logic ships with unit tests; controllers covered by integration tests.

## PR checklist

- [ ] Linked to the right Work Item.
- [ ] Knowledge updated or intentionally left unchanged.
- [ ] Tests added/updated where it matters.
```

## Security

Documents **security considerations** (auth, data sensitivity, secrets,
dependency and deployment risks, open questions).

> Kaddo does **not** perform security scanning or vulnerability scanning. The
> artifact documents concerns for humans and agents — it does not audit code.

Starter (`knowledge/tech/security.md` as installed):

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

Filled example (illustrative):

```md
# Security Considerations

## Authentication & authorization

- JWT access tokens (15 min) + rotating refresh tokens stored httpOnly.
- Role checks enforced in `src/auth/guards/`; never trust the client role claim.

## Data sensitivity

- PII: email, address. Stored encrypted at rest; never logged.
- Payment data is tokenized via the provider — we never store card numbers.

## Secrets handling

- Secrets come from environment variables; `.env` is git-ignored.
- Rotation owned by the platform team; no secrets in code or artifacts.

## Dependency risks

- `npm audit` reviewed before each release (manual, not enforced in CI).

## Deployment risks

- Migrations run before deploy; destructive migrations need an ADR.

## Open questions

- Do we need field-level encryption for addresses? Pending legal review.
```

## Stack

Languages, frameworks, data, infrastructure, tooling and unknowns to confirm.

Starter (`knowledge/tech/stack.md` as installed):

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

Filled example (illustrative):

```md
# Stack

## Languages

- TypeScript (Node.js 20).

## Frameworks

- NestJS (API), Prisma (ORM), Next.js (web).

## Data

- PostgreSQL (primary), Redis (cache + queues).

## Infrastructure

- Docker + AWS ECS; Terraform for infra-as-code.

## Tooling

- pnpm workspaces, Vitest, ESLint, GitHub Actions.

## Unknowns / needs confirmation

- Whether the worker should move from Redis to SQS at scale.
```

> Existing files are never overwritten. Re-running `kaddo add` only installs
> missing files. Filled examples above are illustrative — Kaddo never generates
> content automatically; you produce it by running the agents in your own LLM.
