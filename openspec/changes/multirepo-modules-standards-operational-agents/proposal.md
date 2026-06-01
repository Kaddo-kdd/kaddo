# Proposal: Multirepo Modules, Standards & Operational Agents

## Problem

Kaddo supports project initialization and can identify repository structure, but multirepo
scenarios need a stronger model.

In real systems, a product may be distributed across multiple repositories: frontend,
backend, workers, infrastructure, mobile apps, shared libraries. The main architecture
repository can describe the whole product, but each repository/module also needs its own
design, decisions, diagrams, security notes, standards and technology definition.

Kaddo also lacks operational agents for: refining Work Items, defining Git strategy,
documenting standards, reviewing security concerns, documenting stack/technologies, and
documenting module design.

## Proposed Change

Add a multirepo module mapping capability and extend Kaddo agents with operational prompt
packs. The main repo manages global product knowledge; each repo/module is represented with
its own module-level artifacts.

## Why Now

Kaddo already supports the complete knowledge loop:

```txt
init → scan → context → agents → understand → roadmap → create from roadmap → owners suggest → guard → explain
```

The next step is to make this loop work across multiple repositories and operational
concerns.

## Scope

- Documenting and supporting multirepo module mapping (`kaddo modules map`).
- Defining module-level knowledge artifacts under `architecture/modules/<name>/`.
- Adding module design / stack / security / standards templates.
- Adding optional global standards/security/stack/git-strategy documentation via `kaddo add`.
- Adding missing agent prompt packs: work-item-agent, git-strategy-agent, security-agent,
  standards-agent, stack-agent, module-design-agent.
- Defining a default Git strategy and allowing customization.
- Updating docs and playbook. EN/ES parity.

## Out of Scope

- Automatic deep analysis of every repository.
- Calling LLMs.
- GitHub/GitLab API integration.
- Creating branches or tags automatically.
- Enforcing Git strategy in CI.
- Security scanning / dependency vulnerability scanning.
- Generating diagrams automatically from source code.
- Multirepo orchestration through remote providers.

## Expected Value

Kaddo becomes useful for real-world distributed systems where product knowledge is spread
across several repositories. Teams can map each repo as a module and preserve knowledge
consistently without forcing everything into a single repo.

## Risks

The VS may become too broad; multirepo support may add complexity; standards/security docs
may become bureaucratic; Git strategy may conflict with existing practices; too many agents.

## Success Criteria

A user can map additional repositories as modules, generate module-level knowledge
structure, install the new operational agents, and understand how Git strategy, standards,
security and stack definitions fit into Kaddo.
