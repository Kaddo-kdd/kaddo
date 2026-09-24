---
name: capsule-writing
description: "Standardize how a Knowledge Capsule is written/reviewed so external consumers get safe, useful context. Use when: When creating or refining a Knowledge Capsule for sharing with another project."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Capsule Writing Skill

## Purpose

Standardize how a Knowledge Capsule is written/reviewed so external consumers get safe, useful
context.

## When to use

When creating or refining a Knowledge Capsule for sharing with another project.

## Inputs

The context pack, capabilities, current-state, decisions and any public contracts.

## Output

A capsule with: purpose, responsibilities, capabilities, contracts, dependencies, risks, owners,
out of scope and usage notes.

## Rules

- Never include secrets, tokens, credentials, source code, PII or unnecessary internal detail.
- Never invent contracts; mark unknowns.
- Summarize boundaries; prefer "unknown" over guessing.

## Quality checklist

- Purpose and boundaries are clear.
- Contracts are real, not invented.
- No secrets/source/PII included.

## Example output

A `*.capsule.md` with the sections above.
