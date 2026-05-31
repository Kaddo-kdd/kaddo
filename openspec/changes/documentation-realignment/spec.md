# Spec: Documentation Realignment

## User Story

As a new Kaddo user, I want the documentation to clearly explain what Kaddo is and how to use
it, so that I can understand the workflow without reading the full manifesto.

## Expected Behavior

After this change, the documentation clearly explains: what Kaddo is, what problem it solves,
how the CLI and LLM agents work together, how to use it for new/pre-AI/legacy projects, how to
run the full workflow, and what Kaddo does not do.

## Acceptance Criteria

### AC1 — README explains Kaddo clearly
The main README includes a one-line description, a practical value proposition, the full
workflow, the CLI vs LLM split and supported project states.

### AC2 — Docs homepage is aligned
The docs homepage explains Kaddo as a practical CLI + agent prompt toolkit and does not label
shipped commands as upcoming.

### AC3 — Quickstart uses the real workflow
Getting started shows `init → scan → context → add agents → understand` and then explains how
to use the LLM.

### AC4 — Full workflow is documented
Docs include `create --from roadmap`, `owners suggest`, `guard` and `explain`.

### AC5 — CLI vs LLM responsibility is explicit
Docs state that the CLI prepares and stores context, the LLM interprets using Kaddo agents,
and Kaddo does not call an LLM by default.

### AC6 — Project states are explained
Docs explain new, pre-AI and legacy projects.

### AC7 — Commands overview is updated
Command overview lists init, scan, context, add agents, understand, create, owners, guard,
explain.

### AC8 — No overpromise
Docs avoid claiming Kaddo fully understands code automatically, calls LLMs, generates a roadmap
by itself, infers business truth or replaces human review.

### AC9 — EN/ES docs are aligned
Spanish and English docs communicate the same product story.

## Validation

Run `pnpm -r build`. Confirm the docs site builds and sidebar/links remain valid.
