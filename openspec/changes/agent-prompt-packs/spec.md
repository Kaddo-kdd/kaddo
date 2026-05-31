# Spec: Agent Prompt Packs

## User Story

As a Kaddo user, I want to install reusable agent prompts, so that I can use my preferred
LLM chat to transform Kaddo context packs into structured project knowledge.

## Expected Behavior

When the user runs `kaddo add agents`, Kaddo creates:

```
architecture/agents/capability-agent.md
architecture/agents/architecture-agent.md
architecture/agents/roadmap-agent.md
architecture/agents/legacy-agent.md
architecture/agents/adr-agent.md
```

Each file is a complete prompt pack with role, input, output, constraints and save location.

## Acceptance Criteria

- [x] AC1 — `architecture/agents/` is created if missing.
- [x] AC2 — The five base agent files exist after the command.
- [x] AC3 — Agents are not installed by `kaddo init`.
- [x] AC4 — Each agent is a `.md` prompt pack, pasteable into an LLM chat.
- [x] AC5 — Each agent declares: Role, When to Use, Input Required, Expected Output,
  Constraints, Output Format, Where to Save the Result, Quality Checklist.
- [x] AC6 — Each agent references `.kaddo/context-pack.md` as the primary input.
- [x] AC7 — No LLM execution.
- [x] AC8 — Existing agent files are not overwritten silently.
- [x] AC9 — Docs explain install, usage, recommended order by state, CLI vs LLM responsibility.
- [x] AC10 — Tests verify install, required sections, protection of existing files, and that
  `kaddo init` does not install agents.

## Edge Cases

- **Project not initialized** — `.kaddo/config.yml` missing → "Kaddo is not initialized in
  this project. Run `kaddo init` first." and exit non-zero.
- **Agents already installed** — do not overwrite; report kept files.
- **Partial installation** — install missing agents, protect existing ones.
- **Missing architecture directory** — created automatically.

## Output Example

```
Created architecture/agents/capability-agent.md
Created architecture/agents/architecture-agent.md
Created architecture/agents/roadmap-agent.md
Created architecture/agents/legacy-agent.md
Created architecture/agents/adr-agent.md

Next:
1. Run `kaddo context`
2. Open your preferred LLM chat
3. Paste `.kaddo/context-pack.md`
4. Use the recommended agent for your project state
```

## Validation

```bash
pnpm test
pnpm build
kaddo add agents
```

Confirm: agent files exist, content is readable, no LLM is called, init remains minimal.
