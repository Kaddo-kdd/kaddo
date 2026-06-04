# Contributing to Kaddo

## Setup

```bash
git clone https://github.com/Kaddo-kdd/kaddo
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

## OpenSpec: define before you build

Relevant changes to the CLI are defined with OpenSpec **before** any code is written —
a `proposal.md`, `design.md`, `spec.md` and `tasks.md` under
`openspec/changes/<change-id>/`. Copy the templates in `openspec/templates/` to start.
See [`openspec/README.md`](openspec/README.md) for the full convention.

## Commit style

```
feat: short description
fix: short description
test: short description
docs: short description
```

One concern per commit. Reference a work item ID if applicable (`WI-001`).

## Releasing

CI (`.github/workflows/ci.yml`) builds and tests on every push to `main` and PR.

Publishing is automated by `.github/workflows/release.yml` — pushing a `vX.Y.Z` tag whose
version matches `packages/cli/package.json` builds, tests, publishes `@kaddo/cli` to npm
(with provenance) and creates a GitHub Release.

```bash
# bump packages/cli/package.json + the .version() in src/index.ts to X.Y.Z, then:
git commit -am "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z — …"
git push && git push origin vX.Y.Z   # the Release workflow does the rest
```

Requires a repository secret **`NPM_TOKEN`** (an npm automation token with publish access to
the `@kaddo` org): Settings → Secrets and variables → Actions → New repository secret.
