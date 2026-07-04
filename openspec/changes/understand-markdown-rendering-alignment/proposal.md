# Proposal: Understand Markdown Rendering Alignment (VS-079.1)

## Why

After VS-079, the console output of `kaddo understand` correctly shows state-aware delivery
recommendations (phase, agent, skill, secondary recommendations). However, the persisted file
`.kaddo/understand.md` still renders empty sections (Agent Prompts, Expected Outputs) when all
foundational knowledge exists, because the markdown renderer only had access to the foundational
agent flow — not the state-aware delivery data.

## What

Enrich the `UnderstandPlan` with state-aware delivery data from the project explanation and rewrite
`renderUnderstand` to produce a markdown handoff that matches the console output:

- `core/understand.ts`: `UnderstandPlan` gains optional `phase`, `nextStepRecommendation`,
  `deliveryState`, `activeWorkItems`, `recommendedPaths`, `recommendedSkillPaths`, `language`.
  New `enrichUnderstandPlan` function merges the delivery data into the base plan.
- `templates/understand-template.ts`: `renderUnderstand` rewritten to include Current Phase,
  Delivery State, Primary Recommendation, Secondary Recommendations, Active Work Items, and
  concrete agent/skill paths. No empty sections when data is available.
- `commands/understand.ts`: calls `enrichUnderstandPlan` with data from `buildProjectExplanation`,
  `buildDeliveryState`, and `discoverWorkItems` before rendering.

No changes to the recommendation logic, delivery decision tree, explain, context, or MCP.

## Impact

- `core/understand.ts`, `templates/understand-template.ts`, `commands/understand.ts`.
  Tests, docs (EN/ES). Minor bump 3.46.0.
