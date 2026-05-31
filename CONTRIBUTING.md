# Contributing to Kaddo

## Setup

```bash
git clone https://github.com/judlup/kaddo
cd kaddo
pnpm install
pnpm build
```

## Project structure

```
kaddo/
  packages/cli/src/
    commands/     — one file per CLI command
    core/         — pure logic (knowledge levels, diff analysis)
    services/     — I/O (git, filesystem, artifact parsing)
    utils/        — shared helpers (fs, ui)
    templates/    — markdown templates for work items
```

## Run tests

```bash
pnpm test              # all tests
cd packages/cli
pnpm test              # cli package only
```

## Build

```bash
pnpm build             # build all packages
cd packages/cli
pnpm dev               # watch mode
```

## Principles

- **No features beyond v1 scope** without a work item and discussion
- **Deterministic before AI** — if filesystem or git can answer it, don't use an LLM
- **One question at a time** — CLI must never feel like a form
- **No central ownership files** — each artifact declares what it protects via front matter
- **Non-blocking guard** — Guard Lite informs, never blocks

## What you can contribute

- Templates for new work item types (`vertical-slice`, `incident`, `migration`)
- New modules (`kaddo add adr`, `kaddo add incident`)
- Stack detection improvements in `scanner.ts`
- Bug fixes with a matching test

## What requires a discussion first

- New commands or flags
- Changes to the Knowledge Level question structure
- Changes to the front matter schema
- Guard behavior changes

Open an issue before starting work on any of these.

## Commit style

```
feat: short description
fix: short description
test: short description
docs: short description
```

One concern per commit. Reference a work item ID if applicable (`WI-001`).
