# Proposal: Complete Templates & Documentation Alignment

## Problem

Kaddo now supports a complete knowledge workflow (`scan → context → agents →
roadmap → work item → ownership → guard → explain`) and has expanded to include
multirepo modules, operational agents, standards, security, stack and Git strategy.

However, many artifacts still depend on inline content, minimal templates or
agent-generated structures that are not standardized in one place. Without complete,
discoverable templates, different users produce inconsistent artifacts, making it
harder for Kaddo to parse, explain, guard and evolve project knowledge.

## Proposed Change

Create and standardize complete templates for the main Kaddo artifacts in a central
**template registry**. Each template defines its purpose, when to use it, front
matter (where useful), required and optional sections, a quality checklist and the
output path / related command / related agent. Update the documentation (EN/ES) to
list and explain every template and how it fits into the workflow.

## Why Now

The core flow and the multirepo/operational layers already exist. The next step is to
make the knowledge artifacts consistent, reusable and easy to maintain — so the
promise of *living knowledge* holds across teams and repos.

## Scope

- Create a central template registry.
- Templates for core, architecture, module, operations and legacy artifacts.
- Align agent prompts with template output structures/paths.
- Update docs (EN/ES) with a Templates section, and the README.
- Keep templates lightweight: complete ≠ long.

## Out of Scope

- New CLI commands.
- Calling LLMs.
- Changing Guard logic.
- Changing the roadmap parser unless needed for compatibility.
- A web UI.
- Making templates mandatory or adding heavy enterprise governance.

## Expected Value

Users get consistent, high-quality artifacts without inventing structure from
scratch. Agents get clearer target formats, improving generated outputs.

## Risks

- Templates may become too verbose → keep them practical.
- Users may feel forced to fill everything → docs clarify templates are guides.
- Templates may drift from agent prompts → align and test output paths.

## Success Criteria

A user can list all available templates, understand when to use each one, and copy a
consistent artifact structure aligned with Kaddo's workflow — without bureaucracy.
