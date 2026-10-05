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
  kaddo-power/        â€” portable Agent Plugin; generated Skills and client guidance
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
pnpm agent-plugin:check # verify generated Agent Plugin Skill drift
cd packages/cli
pnpm test              # cli package only
```

## Build

```bash
pnpm build             # build all packages
cd packages/cli
pnpm dev               # watch mode
```

When a canonical Skill changes, regenerate its Agent Plugin projection and commit both changes:

```bash
pnpm agent-plugin:sync
pnpm agent-plugin:check
```

Do not edit `kaddo-power/skills/*/SKILL.md` directly. Client-specific guidance belongs under its
extension directory, such as `kaddo-power/dev.kiro/`.

### npm README

`packages/cli/README.md` is the README shown on npm for `@kaddo/cli`, and it is **generated** from
the canonical root `README.md`. Edit the root `README.md`, then regenerate and verify:

```bash
pnpm npm-readme:sync    # regenerate packages/cli/README.md from README.md
pnpm npm-readme:check   # fail if it is out of sync (runs in CI and release)
```

The sync only rewrites relative asset/link references to absolute URLs so the README renders on npm.
Do not edit `packages/cli/README.md` directly. `packages/mcp/README.md` is separate (MCP-specific)
and is not generated.

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

## Build Contract: the Kaddo-native workflow

Changes follow the Kaddo Work Item lifecycle:

1. **Draft** a Work Item in `knowledge/delivery/work-items/draft/`
2. **Refine** with current/target behavior, acceptance criteria and scope confidence
3. **Ready** — move to `work-items/ready/` after human review
4. **Handoff** — produce an implementation plan (use the `implementation-planning` skill)
5. **Implement** — write code, tests and documentation
6. **Verify** — run `kaddo verify <WI-ID>` to collect evidence and check ACs
7. **Complete** — move to `work-items/completed/` with a learning section

See [`knowledge/delivery/build-contract.md`](knowledge/delivery/build-contract.md) for the
full Build Contract and the `implementation-planning` skill for design deliberation.

> **Note:** Kaddo previously used OpenSpec during its early development. Those artifacts have
> been removed from the working tree but remain available through Git history.

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
