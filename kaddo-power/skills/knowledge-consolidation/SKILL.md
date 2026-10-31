---
name: knowledge-consolidation
description: "Standardize the SEMANTIC review of a deterministic Consolidation Plan so canonical knowledge becomes more precise, connected, consistent and retrievable — without losing history, decisions or evidence. Use when: After `kaddo knowledge consolidate` (or the `kaddo_generate_consolidation_plan` tool) has produced `.kaddo/consolidation-plan.{md,json}`, and a human or agent wants to review the opportunities and prepare refinements. Never as an autonomous rewrite of `knowledge/`."
---

<!-- Generated from packages/cli/src/skills/skills.ts. Run `pnpm agent-plugin:sync`; do not edit directly. -->

# Knowledge Consolidation Skill

## Purpose

Standardize the SEMANTIC review of a deterministic Consolidation Plan so canonical knowledge becomes
more precise, connected, consistent and retrievable — without losing history, decisions or evidence.

## When to use

After `kaddo knowledge consolidate` (or the `kaddo_generate_consolidation_plan` tool) has produced
`.kaddo/consolidation-plan.{md,json}`, and a human or agent wants to review the opportunities and
prepare refinements. Never as an autonomous rewrite of `knowledge/`.

## Inputs

The Consolidation Plan (`.kaddo/consolidation-plan.json`), the referenced source artifacts, and the
context pack. Each opportunity carries: category, classification, confidence, source/target, evidence,
rationale, suggested action, and `requires_semantic_review`.

## Output

For each opportunity the agent chooses to act on: a reviewable proposal that states what would change,
what content is added/moved/summarized, what must be preserved, and which claims still need
confirmation — with a diff or equivalent. No canonical file is edited by this skill; application goes
through the existing controlled-edit flows after human approval.

## Rules

- Distinguish `observed` (verifiable fact) from `suggested` (a candidate needing judgement). Never
  present a `suggested` candidate as a verified conclusion.
- Classify every claim as Observed / Derived / Suggested / Unknown.
- Do not merge Business/Product/Tech just because they share a topic — preserve layer responsibilities.
- Do not move every historical learning into current knowledge; incorporate only live rules, WITH a
  reference back to the originating Work Item. Never summarize or delete the Work Item.
- Do not invent relationships, decisions or business rules; a missing optional relationship is an
  opportunity, not an error.
- For a potential inconsistency, present BOTH sources and say whether the conflict is verified or
  potential. Never pick a winner arbitrarily.
- Preserve critical constraints, decisions and reasons, exceptions, known risks, technical contracts,
  implementation evidence, provenance and necessary history.
- Never reveal secret values or resolve secret references; never connect to a Project Resource.
- Do not commit, push or release automatically.

## Quality checklist

- Every proposal cites its source artifact(s) and evidence.
- Facts are separated from interpretations.
- Preserved information is named explicitly.
- Claims needing confirmation are flagged.
- No canonical artifact was modified by the analysis or the review.

## Example output

A short set of proposals, each with evidence, a before/after (or diff) and an explicit list of what
must be preserved, ready for human approval.
