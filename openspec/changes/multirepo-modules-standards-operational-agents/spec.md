# Spec: Multirepo Modules, Standards & Operational Agents

## User Story

As a Kaddo user working in a multirepo system, I want to map each repository as a module and
generate module-level knowledge artifacts, so that the full product can be understood and
evolved across repos. I also want guidance for Work Items, Git strategy, security, standards
and stack definition, so that the team can operate Kaddo consistently.

## Acceptance Criteria

### AC1 — Multirepo module mapping exists

A user can register a module/repository with `kaddo modules map`.

### AC2 — Module structure is generated

For each mapped module, Kaddo creates `architecture/modules/<name>/` containing
`module-design.md`, `stack.md`, `security.md`, `standards.md`, `diagrams/` and `adrs/`.

### AC3 — Module descriptor exists

Kaddo stores module metadata in `.kaddo/modules.yml`.

### AC4 — Global optional artifacts are supported

Kaddo can generate `architecture/security.md`, `architecture/standards.md`,
`architecture/stack.md` and `architecture/git-strategy.md` via `kaddo add`.

### AC5 — Work Item Agent exists

`work-item-agent.md` is installed and explains how to refine roadmap candidates or existing
Work Items.

### AC6 — Git Strategy Agent exists

`git-strategy-agent.md` is installed, produces `architecture/git-strategy.md`, includes the
default `GitHub Flow + Conventional Commits + SemVer` and explains how to customize it.

### AC7 — Security Agent exists

`security-agent.md` is installed and produces security documentation without claiming to
perform security scanning.

### AC8 — Standards Agent exists

`standards-agent.md` is installed and produces lightweight team/project standards.

### AC9 — Stack Agent exists

`stack-agent.md` is installed and produces stack/technology documentation.

### AC10 — Module Design Agent exists

`module-design-agent.md` is installed and produces module-level design documentation.

### AC11 — Docs explain multirepo workflow

Docs include a clear example of `architecture-repo + frontend + backend + infra`.

### AC12 — No overpromise

Docs and agents must not claim Kaddo scans all repos deeply by default, calls LLMs, enforces
Git strategy, performs security scanning, replaces architecture review, or generates diagrams
from source.

## Edge Cases

- **Module path does not exist** — warn but allow registering anyway.
- **Module already exists** — do not overwrite module artifacts without confirmation.
- **Custom Git strategy** — allow `custom` and document how to write it.
- **Monorepo user runs module mapping** — allowed for internal modules, explained as optional.
- **Missing scan** — module mapping still works with manual input.

## Validation

```bash
pnpm test
pnpm -r build
```

Manual: `kaddo modules map`, `kaddo add agents` — confirm module artifacts and new agents
exist.
