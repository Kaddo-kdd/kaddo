# Spec: Knowledge Refinement Handoff Alignment (VS-083.2)

## User Story

As a Kaddo user whose bootstrap baseline exists but contains thin/placeholder knowledge,
I want `understand` and `context` to recommend the specific agent I need and tell me
whether that agent is installed, so I can refine my knowledge without confusion.

## Acceptance Criteria

- **AC1** — `business-agent.md` is included in the `pre-ai` recommended agent set.
- **AC2** — `NextStepRecommendation` includes `agentPath`, `agentInstalled`, and
  `installCommand` fields when a refine-* step is active.
- **AC3** — `agentInstalled` is `true` when the agent file exists on disk; `false` otherwise.
- **AC4** — `installCommand` is populated only when the agent is not installed.
- **AC5** — `mapNextStepId` maps `refine-business` → `define-business`,
  `refine-product` → `define-product`, `refine-capabilities` → `discover-capabilities`,
  `refine-current-state` → `describe-architecture`, `refine-codebase` → `describe-architecture`.
- **AC6** — When the recommended agent is **not installed**, `.kaddo/understand.md` shows a
  **Missing Agent** section with the install command instead of Agent Prompts.
- **AC7** — When the recommended agent **is installed**, `.kaddo/understand.md` shows the
  agent prompt path in the Agent Prompts section.
- **AC8** — The terminal output shows a missing-agent warning with install command when
  the agent is not installed.
- **AC9** — The context pack markdown shows install instructions in the Recommended Agent
  Handoff section when the agent is not installed.
- **AC10** — The context pack markdown shows the agent prompt path when the agent is installed.
- **AC11** — Bootstrap suppression (VS-083.1) is not regressed — bootstrap still suppresses
  agent handoff sections.
- **AC12** — `refine()` includes `agent`, `target`, `reason`, and `instructions`.
- **AC13** — Documentation EN/ES updated.
- **AC14** — Tests pass (890+).
- **AC15** — Build passes (CLI + MCP + docs).

## Edge Cases

- Agent installed in a non-standard path → only the canonical `agentInstallPath` is checked.
- Multiple refine candidates → `resolveNextStep` picks the first applicable one.
- Bootstrap incomplete → bootstrap recommendation takes precedence over refine.

## Implementation Notes

- `resolveAgent` helper in `next-step.ts` centralizes agent-path resolution.
- Template changes are additive — existing agent-installed flow is wrapped in an `else` branch.
- The `understand` command console output adds agent path/install info after the recommended agent line.
