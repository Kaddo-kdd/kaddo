# Agents

This directory contains Kaddo agent prompt packs — versionable Markdown prompts you
use in your preferred LLM chat (Claude, ChatGPT, Cursor, Copilot, Windsurf…).

**Kaddo does not execute these agents.** The CLI prepares context; the LLM interprets.

## Operating rules (apply to every agent)

- **Never run `git commit`, `git push` or `git merge` without explicit human confirmation.**
- Never push or merge automatically. Suggest a Conventional Commit message and wait.
- When implementing a Work Item, create a branch first (per the Git strategy in
  `.kaddo/git.yml`); never work directly on `main`.
- The Kaddo CLI never calls an LLM and never runs git — every git action is the human’s.

## How to use

1. Run `kaddo scan` then `kaddo context` to generate `.kaddo/context-pack.md`.
2. Open your LLM chat.
3. Paste `.kaddo/context-pack.md` together with the agent prompt for your task.
4. Save the agent output to the location each prompt specifies.

## Recommended order by project state

- **new** → business-agent → bootstrap-agent → codebase-agent → roadmap-agent
- **pre-ai** → capability-agent → architecture-agent → roadmap-agent
- **legacy** → legacy-agent → architecture-agent → capability-agent → roadmap-agent

Then, in delivery: backlog-agent (capture ideas) → work-item-agent (refine) →
ownership-agent (propose code: globs) → implementation-agent (build).

## Installed agents

### Bootstrap agents (new projects)

- `business-agent.md` — turn an idea into a business definition.
- `bootstrap-agent.md` — go from business to capabilities, quality attributes and roadmap.
- `codebase-agent.md` — propose a codebase foundation (no code).

### Understanding agents

- `capability-agent.md` — extract/propose system capabilities.
- `architecture-agent.md` — reconstruct/propose the architecture baseline.
- `roadmap-agent.md` — propose roadmap candidates.
- `legacy-agent.md` — analyze risks/unknowns before changing legacy code.
- `adr-agent.md` — propose candidate architecture decisions.

### Delivery agents

- `backlog-agent.md` — capture raw ideas/notes into a Work Item draft or roadmap candidate.
- `work-item-agent.md` — refine roadmap candidates or existing Work Items.
- `implementation-agent.md` — implement a refined Work Item (the only agent that may
  suggest a branch; never runs git).
- `ownership-agent.md` — propose precise `code:` globs (human applies with `kaddo owners suggest`).
- `git-strategy-agent.md` — define branch/commit/tag/release strategy.

### Operational agents

- `security-agent.md` — document security considerations (no scanning).
- `standards-agent.md` — propose lightweight coding/docs/architecture standards.
- `stack-agent.md` — document technologies and stack decisions.
- `module-design-agent.md` — document the design of a mapped module.
- `capsule-agent.md` — refine a Knowledge Capsule for external sharing (no secrets/source).
- `graph-agent.md` — review `kaddo graph export` hints and propose precise relationship front matter.