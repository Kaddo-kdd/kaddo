# Proposal: Demo Examples & Sample Repositories

## Problem

Kaddo has a complete knowledge workflow, but users still need concrete examples to
understand how it works in real project scenarios. Documentation explains the concepts;
examples make the workflow tangible. Without examples, Kaddo may still feel abstract for
new users.

## Proposed Change

Add example projects and sample repositories that demonstrate Kaddo in the main
supported scenarios: **new project**, **pre-AI project**, **legacy project** and
**multirepo workspace**. Each example shows the project context, command flow, generated
Kaddo artifacts, the LLM handoff, expected agent outputs, roadmap, work items, ownership,
Guard and explain output.

## Why Now

Kaddo now has enough functionality to support an end-to-end demo. The next step is to
make that workflow visible and reproducible.

## Scope

- Create `examples/` folders for the four scenarios.
- A `README.md` and `expected-flow.md` per example.
- Minimal sample source files where useful.
- Sample Kaddo artifacts and clearly-marked sample agent outputs.
- A Guard drift demo in at least one example.
- Update docs and README to link to examples.
- Avoid overpromising functionality.

## Out of Scope

- Production-ready demo applications.
- New CLI commands.
- Calling LLMs.
- External integrations or hosted live demos.
- Heavy CI for examples.
- Complex fake enterprise systems.

## Expected Value

Users understand Kaddo faster by following realistic examples. The examples become
reusable material for docs, talks, videos and product demos.

## Risks

- Examples may become too large → keep them small.
- Examples may drift from CLI behavior → prefer static files, validate on docs build.
- Fake examples may feel unrealistic → use familiar, minimal domains.

## Success Criteria

A user can open an example folder, follow the README, and understand how Kaddo works in
that scenario — without implying automation Kaddo does not perform.
