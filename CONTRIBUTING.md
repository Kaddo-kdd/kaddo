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

## Contribution principle: One Work Item → One Branch → One Pull Request

Kaddo is built with its own Knowledge-Driven Development model, and contributions follow the same
idea: **knowledge and intent come before implementation, and code is reviewed against an explicit
Work Item.**

> **One Work Item → One Branch → One Pull Request.**

A contribution should represent a single coherent outcome. This does not mean "small PR" — a K3/K4
Work Item can justify a large PR. It means a PR should not bundle independent outcomes (e.g. a
feature **and** an unrelated refactor **and** a separate bug fix). If work you discover during
implementation does not belong to the current Work Item's scope or acceptance criteria, open a
**separate** Work Item, branch and PR instead of growing the contribution silently.

## Contribution workflow

1. **Start from the latest `main`.**
2. **Understand the relevant knowledge first.** Use the project's own knowledge before defining or
   implementing — business/product/tech artifacts, architecture, capabilities, initiatives, the
   roadmap, completed Work Items and their learnings. Explore it via the CLI (`kaddo context`,
   `kaddo explain`), the MCP server, Kaddo agents, or your preferred LLM. You do not need to read the
   whole repo by hand.
3. **Define or select one Work Item.** The change needs a definition proportional to its size
   (intent/problem, target outcome, scope, out of scope when relevant, acceptance criteria,
   validation). Trivial changes can use a light definition.
   - **Planned work:** if the change is already defined in Kaddo (an Initiative → a canonical
     `WI-xxx`), just **reference** that Work Item — don't duplicate it.
   - **New / external contributions:** you may propose work that has no canonical Work Item yet.
     Include the Work Item **definition in the PR** instead of creating a `WI-xxx` in your fork (this
     avoids ID conflicts across forks and parallel branches). A maintainer decides later whether to
     materialize it into Kaddo's canonical traceability.
   - An **Initiative is not required** — standalone contributions are fine.
4. **Discuss first when required** (see "What requires a discussion first").
5. **Create one dedicated branch** for the Work Item, e.g. `feat/initiative-gap-analysis`,
   `fix/admin-work-item-rendering`, `docs/contribution-workflow`. Git stays your responsibility —
   Kaddo Core does not manage branches.
6. **Refine / prepare the implementation handoff** when the change warrants it (see the Build
   Contract below and the `implementation-planning` skill).
7. **Implement** the change with tests and documentation.
8. **Validate / verify** against the acceptance criteria (`kaddo verify <WI-ID>` for canonical WIs).
9. **Open one Pull Request** for the Work Item, using the PR template
   (`.github/PULL_REQUEST_TEMPLATE.md`). Reference the canonical WI **or** embed the definition you
   used, and include validation/evidence and any knowledge impact.

**Review is against intent, not just the diff.** Reviewers check whether the implementation satisfies
the Work Item — intent, scope, acceptance criteria and validation — without introducing undeclared
scope. The PR template also asks whether business/product/tech/delivery knowledge needs updating;
update the relevant artifacts when the change requires it (no forced documentation otherwise).

**Example.** A contributor wants to improve scanner detection for a stack. They read the relevant
tech knowledge, write a proportional Work Item definition, branch `fix/scanner-x`, implement with
tests, and open a PR that embeds the Work Item definition plus validation. If, mid-way, they also
spot an unrelated Admin improvement, that goes into its **own** Work Item, branch and PR — not this
one. (For planned work the flow is the same, except the PR references an existing `WI-xxx` instead of
embedding a definition.)

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

All five workspace packages share one version. Bump every `package.json` to the same `X.Y.Z` (the
CLI reads its version from `package.json` at runtime, so there is nothing to change in
`src/index.ts`), then:

```bash
# bump the version in all 5 packages/*/package.json to X.Y.Z, then:
git commit -am "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z — …"
git push && git push origin vX.Y.Z   # the Release workflow does the rest
```

Requires a repository secret **`NPM_TOKEN`** (an npm automation token with publish access to
the `@kaddo` org): Settings → Secrets and variables → Actions → New repository secret.
