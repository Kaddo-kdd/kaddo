# Proposal: Use Case Examples & Project Scope Documentation

## Problem

Kaddo now has a working end-to-end knowledge loop, but the documentation still needs concrete
examples that show how the workflow applies to different project states.

Users need to understand how Kaddo behaves in:

- new projects,
- pre-AI projects,
- legacy projects.

Without practical examples, Kaddo may still feel abstract even if the CLI flow is implemented.

## Proposed Change

Add use case documentation and example workflows for the main project states supported by
Kaddo. The documentation should show: when to use Kaddo, what commands to run, what happens in
the CLI, what happens in the LLM chat, what artifacts are produced, and what the user should do
next.

## Why Now

Kaddo already supports the first complete loop:

```txt
scan → context → agents → roadmap → work item → ownership → guard → explain
```

Now the docs need to demonstrate that loop through practical use cases. This makes Kaddo
easier to adopt, explain and share publicly.

## Scope

- Create a New Project use case.
- Create a Pre-AI Project use case.
- Create a Legacy Project use case.
- Create a Full Workflow example page.
- Create a Project Scope page.
- Update docs navigation/sidebar.
- Update README and docs homepage to link to use cases.
- Add expected artifacts for each workflow.
- Explain CLI vs LLM responsibilities in each use case.
- Keep EN/ES docs aligned.

## Out of Scope

- Implementing new CLI commands or changing CLI behavior.
- Calling LLMs.
- Creating real demo applications, screenshots or video tutorials.
- Creating a SaaS/platform.
- Rewriting the full manifesto.

## Expected Value

A new user can choose the use case closest to their situation and follow a concrete path. This
makes Kaddo feel practical, not just conceptual.

## Risks

- Examples may become too long.
- Use cases may duplicate command docs.
- Documentation may overpromise capabilities.
- Legacy examples may imply deeper analysis than Kaddo currently performs.

## Success Criteria

A user can read a use case and understand exactly how to apply Kaddo to their project state
without inferring the workflow from the manifesto.
