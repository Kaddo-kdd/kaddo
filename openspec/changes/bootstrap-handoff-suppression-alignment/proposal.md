# VS-083.1 — Bootstrap Handoff Suppression Alignment

## Goal

Complete the alignment started in VS-083 so that when the knowledge baseline is
incomplete (`nextStepRecommendation.id = bootstrap`), no Kaddo output presents an
actionable agent handoff. Bootstrap is not an agent handoff — it is a CLI step
that must complete before any agent handoff can occur.

## Approach

1. In `context-pack.ts`, when bootstrap is the next step: set `phase.phase` to
   `Setup`, `phase.recommendedAgents` to `[]`, override `phase.llmInstructions`
   with bootstrap-specific guidance, and set `handoff.recommendedAgents` to `[]`
   with bootstrap instructions.
2. In the `understand` command, resolve the next step early and set it on the
   plan before rendering the terminal output, so `renderUnderstandTerminal` sees
   the bootstrap recommendation and suppresses the agent flow.
3. In `understand-template.ts`, suppress Agent Prompts, Expected Outputs, and
   Copy/Paste Instructions sections when bootstrap is active; show the full
   bootstrap sequence in Next Steps.
4. Add `Setup` to the `DeliveryPhase` union type.
5. Skip the phase/agent console output in the understand command when bootstrap
   is active (the terminal render already shows the complete guidance).

## Constraints

- Pure, deterministic — no LLM, no network, no git mutation.
- After bootstrap completes, all agent handoff surfaces resume normal behavior.
- MCP resources are already aligned (they use `resolveNextStep()` and
  `buildProjectRoute()` directly).
