# Tasks: State-Aware Handoff & Command Clarification

## Phase 1 — Phase model & consumers
- [x] `core/delivery-phase.ts`: determinePhase + assessPhase (phase/reasons/recommended/nextStep).
- [x] understand: recommend from real state (phase/reason/recommended/next step).
- [x] context: `phase` field + `## Current Phase` section.
- [x] explain: `## Phase` block with reason.
- [x] Tests for phase determination + recommendations (AC10).

## Phase 2 — Command clarification docs (EN/ES)
- [x] commands overview: formal table (purpose/input/output/question) + recommended order.
- [x] understand + context docs: state-aware phase output.
- [x] Visual Guide: command-roles diagram.

## Validation
- [x] vitest run (422 passing)
- [x] build (cli + docs)
