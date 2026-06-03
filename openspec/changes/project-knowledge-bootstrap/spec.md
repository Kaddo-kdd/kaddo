# Spec: Project Knowledge Bootstrap

## User Story

As someone starting a new project with Kaddo, I want a guided bootstrap that turns my
idea into structured knowledge across Business → Architecture → Codebase → Development, so
the project has intent, context and direction before any code is written.

## Acceptance Criteria

- **AC1** — `kaddo bootstrap` exists and requires an initialized Kaddo project.
- **AC2** — The flow and docs reflect `Business → Architecture → Codebase → Development`.
- **AC3** — Business artifacts are generated under `architecture/business/` (at least
  product-brief, problem, users, value-proposition, business-rules, constraints, glossary).
- **AC4** — Initial architecture artifacts are generated/prepared: capabilities,
  quality-attributes, stack, current-state, decision-candidates.
- **AC5** — `architecture/codebase-foundation.md` is generated, with **no** source code.
- **AC6** — `architecture/roadmap.md` is generated with a structure compatible with
  `kaddo create --from roadmap`.
- **AC7** — `architecture/work-items/` is prepared.
- **AC8** — Artifacts are generated from the template registry.
- **AC9** — `kaddo add agents` installs `business-agent`, `bootstrap-agent` and
  `codebase-foundation-agent`.
- **AC10** — `kaddo bootstrap` does not call an LLM.
- **AC11** — Existing artifacts are not overwritten (reported as skipped).
- **AC12** — Docs (EN/ES) explain when to use bootstrap, what it generates and how it
  relates to `context`, `understand`, `roadmap` and `create`.

## Edge Cases

- No `.kaddo/config.yml` → `Run 'kaddo init' first.` (exit 1).
- State not `new` → warn (`This project is not marked as new…`) and continue only on
  confirmation.
- Existing artifact → skipped; flow continues.
- Insufficient information → templates contain `TBD`, assumptions and open questions; never
  invent content.

## Expected Output

```
kaddo bootstrap

Project state: new
Bootstrap layers:
  ✓ Business
  ✓ Architecture
  ✓ Codebase
  ✓ Development

Created:
- architecture/business/product-brief.md
- architecture/business/users.md
- architecture/capabilities.md
- architecture/quality-attributes.md
- architecture/codebase-foundation.md
- architecture/roadmap.md
- architecture/work-items/

Next: run `kaddo context` and use the bootstrap-agent to refine these with your LLM.
```

## Validation

```bash
pnpm --filter "@kaddo/cli" test
pnpm -r build
```
