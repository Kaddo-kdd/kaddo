# Design: Ownership Front Matter Assistant

## Technical Approach

Add a guided, deterministic command that helps users add ownership metadata to artifacts. It
does not call an LLM. It uses available project signals:

```txt
.kaddo/scan.json
architecture/work-items/*.md
```

## Command Name

Preferred (reuses existing vocabulary):

```bash
kaddo owners suggest
```

The existing `kaddo owners` lists domain owners. We extend it with an optional `suggest`
action: `kaddo owners [action]`. `kaddo owners` keeps listing; `kaddo owners suggest` runs the
assistant. This avoids creating a second, parallel `ownership` concept.

## Inputs

- `.kaddo/config.yml` — required (project must be initialized).
- `.kaddo/scan.json` — optional scan baseline for glob suggestions.
- `architecture/work-items/*.md` — candidate artifacts (v1 scope).

## Candidate Artifacts (v1)

Focus on Work Items first to keep the MVP thin:

```txt
architecture/work-items/*.md
```

vNext can expand to all `architecture/**/*.md` once the artifact reader is reused fully.

## Artifact Selection Priority

Prioritize artifacts that:

- have no `code:` field, or `code: []`,
- come from roadmap (`source: roadmap`),
- declare `domains` or `capabilities` but no code globs.

## Glob Suggestions (deterministic)

Candidate globs come from scan signals + artifact metadata. No inference of meaning.

From scan baseline (`.kaddo/scan.json` → `detected`):

- `sourceDirectories` → `<dir>/**`
- `migrationDirectories` → `<dir>/**`
- `contractFiles` → literal path
- `infrastructureFiles` → literal path

From artifact metadata: if the artifact declares `domains`/`capabilities`, combine each source
directory with each term to produce **more specific candidate** globs:

```txt
domains: [payments] + sourceDirectories: [src]
→ src/payments/**
```

These domain-specific candidates are offered first (most specific), then generic
`<sourceDir>/**`, then migrations, then contracts/infra. All are clearly candidates the human
confirms — Kaddo never asserts they are correct.

If `.kaddo/scan.json` is missing, the assistant still works via manual glob entry.

## Interaction Flow

When running `kaddo owners suggest`:

1. Validate project is initialized (`.kaddo/config.yml`).
2. Load scan baseline if available.
3. Load candidate Work Items.
4. Show artifacts missing ownership.
5. Let the user select an artifact.
6. Show suggested globs (multiselect) + a "custom glob" option.
7. Allow manual glob entry.
8. Preview the front-matter update.
9. Ask for confirmation.
10. Update artifact front matter (preserving keys and body).
11. Print: `Run \`kaddo guard\` after changing related code.`

## Front Matter Update

Use `gray-matter` to parse `{ data, content }`, set `data.code`, and re-stringify with the
**unchanged body**. Existing keys (`type`, `id`, `knowledge_level`, `source`, `domains`,
`capabilities`, …) are preserved. The body is never rewritten.

If the artifact already has `code:` globs, ask whether to **append**, **replace**, or
**skip**. Default behavior treats artifacts with existing globs as "already owned" and skips
them in the missing-ownership list.

## Safe Behavior

- Never overwrite body content.
- Preserve unknown front matter keys.
- Never delete existing `domains`/`capabilities`.
- Ask before replacing existing `code:` globs; allow appending.
- Skip artifacts with invalid front matter (safe warning).

## Alternatives Considered

- **Automatically infer ownership** — rejected; the CLI suggests, it does not decide.
- **Require manual YAML editing** — rejected; too much friction.
- **Use an LLM to infer ownership** — rejected for this VS; keep v1 deterministic.

## Risks and Mitigation

- Noisy/broad globs → label as candidates, allow manual editing, preview before write.
- Front-matter formatting drift → tests assert existing keys and body are preserved.
