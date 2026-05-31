# Spec: Ownership Front Matter Assistant

## User Story

As a Kaddo user, I want the CLI to help me add ownership metadata to knowledge artifacts, so
that Guard can detect when code changes may impact project knowledge.

## Expected Behavior

When the user runs `kaddo owners suggest`, Kaddo helps them select an artifact and add `code:`
globs to its front matter.

## Acceptance Criteria

### AC1 — Requires initialized project
If `.kaddo/config.yml` does not exist, show:
`No .kaddo/config.yml found. Run \`kaddo init\` first.`

### AC2 — Finds artifacts missing ownership
The command lists Work Items without `code:` or with empty `code: []`.

### AC3 — Suggests globs from scan baseline
If `.kaddo/scan.json` exists, the command uses scan data to suggest candidate globs.

### AC4 — Allows manual glob entry
The user can add a custom glob if suggestions are insufficient.

### AC5 — Preserves existing front matter
Existing keys must remain intact.

### AC6 — Preserves artifact body
Only front matter is updated.

### AC7 — Confirms before writing
The user must confirm before the file is updated.

### AC8 — Supports existing ownership
If an artifact already has `code:` globs, the command skips it by default or allows
appending/replacing intentionally.

### AC9 — No LLM execution
The command must not call an LLM.

### AC10 — Guard becomes usable afterward
After adding ownership, `kaddo guard` detects changes matching the selected globs.

## Edge Cases

- **No scan baseline** — still allow manual glob entry.
- **No artifacts found** — show: `No knowledge artifacts found. Create a Work Item first.`
- **All artifacts already have ownership** — show: `All detected artifacts already declare code ownership.`
- **Invalid glob** — warn but allow if syntactically usable.
- **Artifact has invalid front matter** — skip it with a safe warning.
- **Existing code globs** — ask whether to append, replace, or skip.

## Validation

Run `pnpm test`, `pnpm build`, `kaddo owners suggest`. Then: select an artifact, add a code
glob, modify a matching file, run `kaddo guard`, confirm a warning appears; update the
artifact too and confirm the warning is suppressed.
