# Design: Demo Examples & Sample Repositories

## Example strategy

Examples are small, readable and focused — not full production apps. Each demonstrates a
Kaddo workflow clearly using static, committed files (no runnable services required).

## Names

- `new-project` → **Task Pilot** (simple task app)
- `pre-ai-project` → **Loyalty Lite** (Next.js + API + loyalty domain)
- `legacy-project` → **Old Orders** (legacy Express MVC app)
- `multirepo-workspace` → **Commerce Stack** (architecture repo + frontend/backend/worker/infra)

## Structure

```txt
examples/
  README.md
  new-project/        README.md  expected-flow.md  .kaddo/  architecture/  sample/
  pre-ai-project/     README.md  expected-flow.md  .kaddo/  architecture/  sample/  sample-agent-outputs/
  legacy-project/     README.md  expected-flow.md  .kaddo/  architecture/  sample/
  multirepo-workspace/ README.md expected-flow.md  architecture-repo/  frontend/  backend/  worker/  infra/
```

## Common files

- **README.md** — what the example represents, when to use the scenario, the commands to
  run, the artifacts to inspect, and what happens in the CLI vs the LLM chat.
- **expected-flow.md** — a table of `command → expected output → generated artifact → next step`.

## Per-example focus

- **new-project**: structured knowledge from day one (`init → context → add agents →
  understand → create --from roadmap → owners suggest → explain`).
- **pre-ai-project**: prepare an existing project; full loop incl. `scan` and **Guard
  drift demo** (a Work Item with `code:` globs over `sample/src/loyalty/**`).
- **legacy-project**: understand-before-change; `legacy-agent` first; legacy
  risks/unknowns/modernization artifacts.
- **multirepo-workspace**: `modules map` → `.kaddo/modules.yml` + per-module artifacts.

## Sample agent outputs

Stored under `sample-agent-outputs/` and clearly marked:

```txt
> Sample output generated from Kaddo agent prompts in an LLM chat. Illustrative — review before using.
```

## Guard demo (pre-ai-project)

A Work Item declares `code: [sample/src/loyalty/**]`. The README shows: edit
`sample/src/loyalty/points.ts`, run `kaddo guard`, expect a non-blocking *Possible
knowledge drift* FYI.

## Documentation

- New `examples` docs page (EN/ES) linking the four scenarios.
- README "Examples" section.
- Links from the use-case pages.

## Risks & mitigation

Examples can become stale → keep them small, avoid dependencies, prefer static files,
validate with the docs build.
