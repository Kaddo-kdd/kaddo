---
name: learning-capture
description: "Standardize how a Work Item's learning is captured when it closes. Use when: When finishing a Work Item, after implementation and verification."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Learning Capture Skill

## Purpose

Standardize how a Work Item's learning is captured when it closes.

## When to use

When finishing a Work Item, after implementation and verification.

## Inputs

The Work Item, the diff/result, and any decisions or surprises that came up.

## Output

A learning record: what was implemented, what changed, what was learned, what decision emerged,
which knowledge must be updated, and what remains pending.

## Rules

- Do not close a Work Item without validation.
- Do not hide failures; record them honestly.
- Do not assume everything is done if errors remain.

## Quality checklist

- Implemented vs changed vs learned are distinct.
- Knowledge to update is named (ADR / capabilities / current-state).
- Pending items are listed.

## Example output

A short learning section appended to the Work Item or a learning note.
