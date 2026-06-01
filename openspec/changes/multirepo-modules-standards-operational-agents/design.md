# Design: Multirepo Modules, Standards & Operational Agents

## Technical Approach

Implement progressively. The initial version does not scan or orchestrate all repositories.
Kaddo: (1) registers modules, (2) generates module knowledge structure, (3) provides
templates, (4) provides agents, (5) documents how to use them.

## Command naming

The existing `kaddo module` (singular) manages this repo's own descriptor
(`architecture/module.yml`) and is kept unchanged. This VS adds a new **plural** command
`kaddo modules` with subcommands:

- `kaddo modules map` — register a secondary repository as a module and generate its
  knowledge structure.
- `kaddo modules list` — list mapped modules.

## Module descriptor — `.kaddo/modules.yml`

Machine-readable workspace config, listing every mapped module:

```yaml
version: 1
modules:
  - id: frontend
    name: Frontend Web
    repoPath: ../frontend
    type: frontend
    status: active
    mainTechnology: Next.js
    owner: unknown
    capabilities:
      - customer-dashboard
    code:
      - ../frontend/src/**
    docs:
      moduleDesign: architecture/modules/frontend/module-design.md
      stack: architecture/modules/frontend/stack.md
      security: architecture/modules/frontend/security.md
      standards: architecture/modules/frontend/standards.md
```

## Generated module structure

For each mapped module, under `architecture/modules/<id>/`:

```txt
module-design.md
stack.md
security.md
standards.md
diagrams/.gitkeep
adrs/.gitkeep
```

Existing module artifacts are never overwritten without confirmation.

## Module types

`frontend · backend · worker · mobile · library · infrastructure · data · unknown`

## Global knowledge artifacts (optional, via `kaddo add`)

Not created during `init`. Installed on demand:

```bash
kaddo add standards    # architecture/standards.md
kaddo add security     # architecture/security.md
kaddo add stack        # architecture/stack.md
kaddo add git-strategy # architecture/git-strategy.md + .kaddo/git.yml
```

## Git strategy

Default: **GitHub Flow + Conventional Commits + SemVer tags** — simple, popular, works for
small/medium teams, CI/CD-friendly. Branch naming
`{type}/{workItemId}-{slug}`; commits `type(scope): message`; tags `vMAJOR.MINOR.PATCH`;
release notes from Work Items + Conventional Commits. `.kaddo/git.yml` allows customization;
other strategies (`gitflow`, `trunk-based`, `custom`) are documented.

## New agents

Six new prompt packs added to `src/agents/prompts.ts` and `AGENT_PROMPTS`, each following
the existing agent contract sections (Role / When to Use / Input Required / Expected Output /
Instructions / Constraints / Output Format / Where to Save the Result / Quality Checklist):

- **work-item-agent** → `architecture/work-items/*.md` — refine candidates, split, validate
  Knowledge Level, propose acceptance criteria/DoD, identify open questions, suggest
  ownership; does not write code.
- **git-strategy-agent** → `architecture/git-strategy.md` — recommend default strategy, adapt
  to team size and mono/multirepo, propose branch/tag/release conventions, allow custom.
- **security-agent** → `architecture/security.md` / module `security.md` — identify security
  concerns from context; does **not** perform vulnerability scanning.
- **standards-agent** → `architecture/standards.md` / module `standards.md` — lightweight
  coding/docs/architecture standards + PR checklist.
- **stack-agent** → `architecture/stack.md` / module `stack.md` — document detected
  technologies by layer, unknowns, risky tech needing confirmation.
- **module-design-agent** → `architecture/modules/<name>/module-design.md` — purpose,
  boundaries, inputs/outputs, dependencies, related capabilities, ownership, diagrams, risks.

The agents README is reorganized into **Understanding agents** and **Operational agents**.

## Alternatives considered

- Fully scan all repos automatically — rejected for now (future VS).
- Create standards/security/stack during init — rejected (violates progressive knowledge).
- Force a single Git strategy — rejected (provide a useful default, allow custom).

## Mitigation

Progressive disclosure; group agents by purpose; keep module mapping simple; clearly
distinguish global vs module-level artifacts.
