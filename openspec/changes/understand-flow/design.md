# Design: Understand Flow

## Technical Approach

Add a `kaddo understand` command that acts as a guided handoff generator. It does not
execute LLMs. It reuses existing functionality: config loading (`core/config.ts`), context
pack generation (`core/context-pack.ts`), agent recommendations (`recommendedAgentsForState`)
and agent install checks (`architecture/agents/`).

```txt
src/core/understand.ts             # buildUnderstandPlan(dir, config): UnderstandPlan
src/templates/understand-template.ts  # renderUnderstand(plan): string (terminal + file)
src/commands/understand.ts         # runUnderstand(): read → ensure context → guide
```

## Inputs

```txt
.kaddo/config.yml          # required
.kaddo/scan.json           # checked; suggest `kaddo scan` if missing
.kaddo/context-pack.md     # generated/refreshed by the command
architecture/agents/       # checked; suggest `kaddo add agents` if missing
```

## Output

The command prints a concise handoff plan and writes `.kaddo/understand.md` (the same
guidance, reusable and copyable).

## State-Aware Recommended Flow

Each step maps an agent → its expected output artifact.

**new**
1. roadmap-agent → `architecture/roadmap.md`
2. architecture-agent → `architecture/current-state.md`

**pre-ai**
1. capability-agent → `architecture/capabilities.md`
2. architecture-agent → `architecture/current-state.md`
3. roadmap-agent → `architecture/roadmap.md`

**legacy**
1. legacy-agent → `architecture/legacy/risks.md`
2. architecture-agent → `architecture/current-state.md`
3. capability-agent → `architecture/capabilities.md`
4. roadmap-agent → `architecture/roadmap.md`

The agent ordering reuses `recommendedAgentsForState` from `core/context-pack.ts` extended
to include legacy's four-step flow; understand owns the step→output mapping.

## CLI Behavior

`kaddo understand`:

1. Validate the project is initialized (else "run `kaddo init` first", exit non-zero).
2. Read project state from config.
3. Check the scan baseline; if missing, warn "Run `kaddo scan` first." (continue with a
   marked-incomplete context pack).
4. Generate or refresh the context pack (reuse `buildContextPack`).
5. Check installed agents; flag missing recommended agents and suggest `kaddo add agents`.
6. Print the recommended flow, expected output locations and a copy/paste handoff.
7. Write `.kaddo/understand.md`.

## Flags

Keep v1 simple — implement only `kaddo understand`. `--agent <name>` (focus on one agent)
may be added only if trivial; do not overbuild.

## Generated `.kaddo/understand.md`

Sections: Project · Recommended Agent Flow · Context Pack · Agent Prompts · Expected
Outputs · Copy/Paste Instructions · Next Steps. Includes the "Kaddo does not call an LLM —
you stay in control of the interpretation" note.

## Alternatives Considered

- **Make understand call the LLM** — rejected: stay provider-agnostic, no API keys.
- **Merge understand into context** — rejected: `context` assembles the input;
  `understand` guides how to use it.
- **Auto-create capabilities.md** — rejected: interpretation happens in the LLM chat with
  human review.

## Risks & Mitigation

- Duplicating context logic → reuse `buildContextPack`.
- A command that only prints instructions → also write `.kaddo/understand.md` for reuse.
- Users ignore the handoff file → keep output concise and next steps obvious.
