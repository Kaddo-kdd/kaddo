# Design: State-Aware Handoff & Command Clarification

## Phase model: `core/delivery-phase.ts`

```ts
type DeliveryPhase =
  'Discovery' | 'Planning' | 'Delivery Preparation' | 'Active Delivery' | 'Maintenance'

determinePhase(input): DeliveryPhase
assessPhase(input): { phase, reasons[], recommendedAgents[], nextStep }
```

`PhaseInput` is a structural subset (layers, roadmap stats, Work Item counts/items, ownership) so
both `explain` (via `ProjectExplanation`, which is structurally compatible) and `context` (which
builds it from discovered artifacts) reuse it with no coupling.

### Phase determination (precedence)

1. base layers (Business/Product/Tech) missing → **Discovery**
2. no roadmap → **Planning**
3. roadmap, 0 Work Items → **Delivery Preparation**
4. active Work Items (draft/ready/in-progress/blocked) → **Active Delivery**
5. otherwise (only completed/archived) → **Maintenance**

### Recommendation matrix

| Signal | Recommend |
|---|---|
| no roadmap | roadmap-agent |
| roadmap + 0 WI | `kaddo create --from roadmap`, work-item-agent |
| ready WI | implementation-agent (start WI) |
| in-progress WI | implementation-agent + scan/owners/guard |
| draft WI | work-item-agent (refine to ready) |
| ownership incomplete | + `kaddo owners suggest` |

## Consumers

- `understand`: prints Current phase / Reason / Recommended / Next step from `assessPhase(exp)`
  (replaces the old `project.state`-group steps).
- `context`: adds a `phase` field + a `## Current Phase` section.
- `explain`: adds a `## Phase` block with the reason.

## Command clarification (docs)

Formal table (purpose / input / output / question) and recommended order in commands overview;
Visual Guide diagram `scan → explain / context → understand → agent`.

## Compatibility

No behavior change to scan/guard/ownership/create. Pure additive recommendation + docs. Existing
tests pass; new tests cover the phase model and recommendations.
