# Proposal: Ownership Front Matter Assistant

## Problem

Kaddo Guard Lite works only when knowledge artifacts declare ownership through front matter:

```yaml
code:
  - src/payments/**
```

However, users currently need to add this metadata manually. This creates friction and makes
Guard less useful — especially right after creating Work Items from roadmap candidates, which
start with `code: []`. Without easy ownership declaration, Guard stays correct but silent.

Kaddo needs a lightweight assistant that helps users connect artifacts to the code they
protect:

```txt
artifact without ownership
→ ownership suggestions
→ human confirms
→ artifact updated
→ guard becomes useful
```

## Proposed Change

Add an ownership assistant that helps users add or update `code:` ownership globs in Markdown
artifacts. Reuse the existing `owners` command vocabulary:

```bash
kaddo owners suggest
```

The command inspects existing Work Items, detects missing ownership, suggests possible code
globs based on deterministic scan signals, and lets the user confirm or edit before updating
front matter. Kaddo suggests; the human confirms.

## Why Now

VS-012 validated Guard Lite end-to-end. The next bottleneck is ownership declaration. This
change makes Guard easy to adopt.

## Scope

- Find Markdown artifacts that can declare ownership (v1: `architecture/work-items/*.md`).
- Detect artifacts missing `code:` globs (absent or `code: []`).
- Read `.kaddo/scan.json` for candidate folders/files.
- Suggest possible `code:` globs from scan signals and artifact metadata.
- Allow the user to confirm, select, or enter custom globs.
- Update front matter safely, preserving existing keys.
- Preserve the existing artifact body.
- Support Work Items created from roadmap.
- Add tests and docs.

## Out of Scope

- Automatic semantic ownership inference.
- LLM usage.
- Updating multiple artifacts without user confirmation.
- Domain ownership enterprise workflows.
- CI enforcement.
- Confidence or evidence scoring.
- Multi-repo ownership orchestration.
- Updating source code.
- v1: ADRs, capabilities, contracts, current-state (deferred to vNext).

## Expected Value

Users can connect knowledge artifacts to code paths without editing YAML by hand. This
increases the usefulness of Guard Lite and makes the Kaddo workflow more complete.

## Risks

- Suggested globs may be too generic.
- Users may accept inaccurate ownership.
- The assistant may become annoying if too interactive.
- Bad globs may create noisy Guard warnings.

## Success Criteria

A user can run `kaddo owners suggest`, select a Work Item, confirm or edit suggested globs,
and see the artifact updated with valid ownership front matter — after which `kaddo guard`
can detect drift on matching files.
