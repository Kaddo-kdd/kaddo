# Commerce Stack — Multirepo Workspace Example

A demo of how Kaddo maps a **multi-repository system** into one shared knowledge
base. The system "Commerce Stack" is split across four repos:

| Repo | Module | Type | Main tech |
| --- | --- | --- | --- |
| `architecture-repo/` | _(the brain)_ | — | Markdown + Kaddo |
| `frontend/` | Storefront Web | frontend | Next.js |
| `backend/` | Orders API | backend | NestJS |
| `worker/` | Fulfillment Worker | worker | Node.js |
| `infra/` | Platform Infra | infrastructure | Terraform |

## The idea

In a multirepo setup, no single code repo owns the architecture. Kaddo solves
this with a dedicated **architecture repo** that holds the central knowledge and a
`.kaddo/modules.yml` descriptor pointing at each code repo.

```
architecture-repo/          ← central knowledge (this is where you run kaddo)
  .kaddo/modules.yml         ← registry of all modules
  architecture/modules/<id>/ ← per-module design / stack / security / standards
frontend/                    ← code only
backend/                     ← code only
worker/                      ← code only
infra/                       ← code only
```

You register each repo as a module with:

```bash
cd architecture-repo
kaddo modules map      # interactive: name, repo path, type, tech, owner
kaddo modules list     # see what's registered
```

That writes the descriptor **and** scaffolds `architecture/modules/<id>/` with
starter `module-design.md`, `stack.md`, `security.md`, `standards.md`. You then
refine those docs with the `module-design-agent` in your LLM.

## What is real vs illustrative

- **Real** (produced by the CLI): `.kaddo/modules.yml` and the
  `architecture/modules/<id>/*.md` starter scaffolds.
- **Illustrative** (hand-written for the demo): the filled-in module designs, the
  sample source files in each code repo, and `expected-flow.md`.

See [`expected-flow.md`](./expected-flow.md) for the step-by-step walkthrough.
