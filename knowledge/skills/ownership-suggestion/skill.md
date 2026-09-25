---
type: skill
id: ownership-suggestion
name: ownership-suggestion
title: Ownership Suggestion Skill
version: 3.89.0
group: tech
applies_to:
  - ownership-agent
  - work-item-agent
  - graph-agent
  - implementation-agent
---
# Ownership Suggestion Skill

## Purpose

Standardize how precise `code:` ownership globs are proposed so Guard can relate code changes to
the right knowledge.

## When to use

When a Work Item or artifact is missing ownership, or its ownership is too broad/inaccurate.

## Inputs

The context pack, the Work Item, and the technical inventory / codebase notes.

## Output

A `code:` glob proposal, e.g.

```yaml
code:
  - src/database/**
  - src/cli/**
```

## Rules

- Prefer small, specific globs; avoid `src/**`.
- Use only real paths; validate intent against the Work Item.
- Explain uncertainty instead of guessing.
- Propose only — the human applies with `kaddo owners suggest`.

## Quality checklist

- Every glob maps to a real path relevant to the item.
- No catch-all globs.
- Uncertainty is marked.

## Example output

The YAML `code:` block above plus a one-line rationale per glob.
