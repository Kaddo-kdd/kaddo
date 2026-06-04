# Example: New Project — *Task Pilot*

A greenfield task app. Shows how Kaddo gives you **structured knowledge from day one**,
before there is much code to scan.

- **Project state:** `new`
- **Structure:** monorepo
- **Domain:** tasks, lists, reminders

## The flow

```bash
kaddo init                       # → .kaddo/config.yml, knowledge/{knowledge,roadmap}.md
kaddo context                    # → .kaddo/context-pack.md
kaddo add agents                 # → knowledge/agents/*.md
kaddo understand                 # recommends agents for a `new` project
# in your LLM chat: run roadmap-agent, then architecture-agent
kaddo create --from roadmap      # → knowledge/delivery/work-items/WI-001-*.md
kaddo owners suggest             # declare code: globs on the work item
kaddo explain                    # → .kaddo/explain.md
```

See [`expected-flow.md`](./expected-flow.md) for the step-by-step output, and
[`prompt-flow.md`](./prompt-flow.md) for the prompts, diagram and CLI↔LLM handoff.

## What to inspect

| File | Who wrote it |
|---|---|
| `.kaddo/config.yml` | CLI (`init`) |
| `knowledge/delivery/roadmap.md` | CLI skeleton (`init`) → filled by `roadmap-agent` (LLM) |
| `sample-agent-outputs/roadmap.md` | **Illustrative** LLM output |
| `knowledge/delivery/work-items/WI-001-add-task-reminders.md` | CLI (`create --from roadmap`) |
| `.kaddo/explain.md` | CLI (`explain`) |

## CLI vs LLM

The CLI scaffolds and stores; your LLM (via the agent prompts) proposes the roadmap and
architecture. You review and decide. Kaddo never calls the model for you.
