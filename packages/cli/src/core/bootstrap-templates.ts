// State-aware bootstrap baseline templates (VS-073).
//
// Deterministic knowledge-baseline templates keyed by project state (new / pre-ai / legacy). No LLM,
// no interpretation — just the right scaffolding prose per state. Bootstrap writes these; existing
// files are never overwritten.

import type { ProjectState } from './config.js'

export type BaselineKind = 'business' | 'product' | 'capabilities' | 'codebase' | 'current-state' | 'roadmap'

// `generated_by` + `template_version` mark freshly scaffolded files. Quality detection does NOT rely
// on this metadata (older files won't have it) — it's an extra, best-effort hint (VS-073.1).
function fm(type: string, state: ProjectState): string {
  return `---\ntype: ${type}\nproject_state: ${state}\ngenerated_by: kaddo-bootstrap\ntemplate_version: 1\n---\n\n`
}

const T: Record<BaselineKind, Record<ProjectState, string>> = {
  business: {
    new: `# Business Context\n\n## Problem\n\n_What problem are we solving?_\n\n## Users\n\n_Who will use this product?_\n\n## Business goals\n\n_What outcomes matter?_\n\n## Constraints\n\n_Business, operational or regulatory constraints._\n`,
    'pre-ai': `# Business Context\n\n## What this product appears to support\n\n_Describe the business purpose based on confirmed knowledge._\n\n## Users or roles\n\n_List known users or roles. Mark unknowns explicitly._\n\n## Existing business rules\n\n_Document confirmed business rules._\n\n## Open questions\n\n- [open] _What business context still needs confirmation?_\n`,
    legacy: `# Business Context\n\n## Critical business purpose\n\n_What critical business process does this system support?_\n\n## Users and operational dependency\n\n_Who depends on this system?_\n\n## Business continuity constraints\n\n_What cannot be interrupted?_\n\n## Open questions\n\n- [open] _What business risk still needs confirmation?_\n`,
  },
  product: {
    new: `# Product Context\n\n## Product vision\n\n_What are we building?_\n\n## User journeys\n\n_Main user journeys._\n\n## Scope\n\n_What is in scope and out of scope?_\n\n## Success criteria\n\n_How will we know this product is working?_\n`,
    'pre-ai': `# Product Context\n\n## Existing product behavior\n\n_Describe what the product currently does._\n\n## Main flows\n\n_List confirmed user or system flows._\n\n## Inferred or uncertain behavior\n\n_Document uncertain behavior as assumptions, not facts._\n\n## Open questions\n\n- [open] _What product behavior still needs confirmation?_\n`,
    legacy: `# Product Context\n\n## Existing behavior\n\n_What does the legacy system do today?_\n\n## Critical flows\n\n_Which flows are business-critical?_\n\n## Known pain points\n\n_What problems are known?_\n\n## Out of scope\n\n_What should not be changed yet?_\n`,
  },
  capabilities: {
    new: `# Capabilities\n\n## Planned capabilities\n\n- [planned] _Capability name_\n\n## Capability map\n\n_Document the product capabilities that should exist._\n\n## Open questions\n\n- [open] _What capability decisions are still unclear?_\n`,
    'pre-ai': `# Existing Capabilities\n\n## Observed capabilities\n\n- [observed] _Capability observed in the existing system._\n\n## Partial capabilities\n\n- [partial] _Capability that appears incomplete or uncertain._\n\n## Assumptions\n\n- [assumed] _Safe assumption to confirm later._\n\n## Open questions\n\n- [open] _What capability is unclear?_\n`,
    legacy: `# Legacy Capabilities\n\n## Critical capabilities\n\n- [critical] _Capability that must keep working._\n\n## Risky capabilities\n\n- [risky] _Capability that is hard to change or poorly understood._\n\n## Replacement candidates\n\n- [candidate] _Capability that may be modernized later._\n\n## Open questions\n\n- [open] _What capability risk is unclear?_\n`,
  },
  codebase: {
    new: `# Codebase Map\n\n## Repository structure\n\n_No production code yet. Describe the intended structure as it emerges._\n\n## Entry points\n\n_To be defined._\n\n## How to run\n\n_To be defined._\n\n## How to test\n\n_To be defined._\n\n## Open questions\n\n- [open] _What structural decisions are still open?_\n`,
    'pre-ai': `# Codebase Map\n\n## Repository structure\n\n_Describe the main folders and their purpose._\n\n## Entry points\n\n_List known entry points._\n\n## Important modules\n\n_List modules or areas that appear important._\n\n## How to run\n\n_Document commands to run the project._\n\n## How to test\n\n_Document how this project is tested. If unknown, mark as open._\n\n## Open questions\n\n- [open] _What part of the codebase still needs explanation?_\n`,
    legacy: `# Codebase Map\n\n## Repository structure\n\n_Describe the main folders and their purpose._\n\n## Entry points\n\n_List known entry points._\n\n## Fragile / delicate areas\n\n_List modules that are risky to change._\n\n## How to run\n\n_Document commands to run the project._\n\n## How to test\n\n_Document how this project is tested. If unknown, mark as open._\n\n## Open questions\n\n- [open] _What part of the codebase still needs explanation?_\n`,
  },
  'current-state': {
    new: `# Current State\n\n## Initial technical direction\n\n_What technical direction has been decided?_\n\n## Known constraints\n\n_What constraints shape implementation?_\n\n## Unknowns\n\n- [open] _What technical questions remain open?_\n`,
    'pre-ai': `# Current State\n\n## What exists today\n\n_Describe the confirmed current state of the system._\n\n## Observed technical signals\n\n_Use \`kaddo scan\` output to document language, framework, package manager, source directories and infrastructure._\n\n## Inferred architecture\n\n_Document inferred architecture carefully. Mark uncertainty._\n\n## Known constraints\n\n_List technical, operational, business or infrastructure constraints._\n\n## Risks of interpretation\n\n_What could an agent misunderstand?_\n\n## Open questions\n\n- [open] _What technical decisions still need confirmation?_\n`,
    legacy: `# Legacy Current State\n\n## Current architecture\n\n_Describe the existing architecture._\n\n## Critical dependencies\n\n_List systems, databases, integrations or manual operations this system depends on._\n\n## Known risks\n\n_List known technical or operational risks._\n\n## Change constraints\n\n_What should not be changed without validation?_\n\n## Modernization notes\n\n_Initial notes about possible modernization paths._\n\n## Open questions\n\n- [open] _What legacy risk still needs confirmation?_\n`,
  },
  roadmap: {
    new: `# Roadmap\n\n## Now\n\n_First outcomes to pursue._\n\n## Next\n\n_What comes after._\n\n## Later\n\n_Deferred ideas._\n`,
    'pre-ai': `# Roadmap\n\n## Now\n\n_First outcomes to pursue for this existing project._\n\n## Next\n\n_What comes after._\n\n## Later\n\n_Deferred ideas._\n`,
    legacy: `# Modernization Roadmap\n\n## Stabilize\n\n_What must be made safe first._\n\n## Modernize\n\n_Controlled modernization steps._\n\n## Later\n\n_Deferred modernization ideas._\n`,
  },
}

/** State-aware baseline content (front matter + body) for a knowledge file. */
export function baselineTemplate(kind: BaselineKind, state: ProjectState): string {
  const st: ProjectState = state === 'pre-ai' || state === 'legacy' ? state : 'new'
  return fm(kind, st) + T[kind][st]
}
