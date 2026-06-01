# Design: Complete Templates & Documentation Alignment

## Template strategy

Kaddo templates follow three rules:

1. Complete enough to guide useful knowledge capture.
2. Lightweight enough to avoid documentation theater.
3. Structured enough for future CLI parsing.

Each template carries: purpose · when to use · front matter (where useful) · required
sections · optional sections · quality checklist · example/guidance.

## Template registry

A single, typed registry in `packages/cli/src/templates/registry.ts` exporting all
templates as data — easier to discover, test and align with docs than scattered
inline strings. (Existing inline command/module templates stay intact; the registry
is additive and authoritative for documentation and future reuse.)

```ts
export type TemplateCategory = 'core' | 'architecture' | 'module' | 'operations' | 'legacy'

export type KaddoTemplate = {
  id: string
  name: string
  category: TemplateCategory
  outputPath: string       // where the artifact lives
  description: string      // purpose
  whenToUse: string
  relatedCommand?: string  // e.g. `kaddo create`
  relatedAgent?: string    // e.g. roadmap-agent
  content: string          // the copyable artifact body
}

export const KADDO_TEMPLATES: KaddoTemplate[]
export function listTemplates(): KaddoTemplate[]
export function getTemplate(id: string): KaddoTemplate | undefined
export function templatesByCategory(c: TemplateCategory): KaddoTemplate[]
```

## Categories & templates

- **core**: `work-item`, `roadmap`, `capabilities`, `knowledge`
- **architecture**: `current-state`, `architecture-notes`, `decision-candidates`, `adr`
- **module**: `module-design`, `module-stack`, `module-security`, `module-standards`, `module-adr`
- **operations**: `security`, `standards`, `stack`, `git-strategy`, `incident`, `runbook`
- **legacy**: `legacy-risks`, `legacy-unknowns`, `modernization-candidates`

## Front matter

Templates that participate in traceability include front matter, e.g. Work Item:

```yaml
---
type: feature
id: WI-001
status: in-progress
knowledge_level: K2
source: manual
domains: []
capabilities: []
code: []
---
```

## Quality rules

Every template avoids huge forms, unnecessary required fields, vague/duplicate
sections, and sections that imply invented facts. Every template includes a quality
checklist and, where useful, Assumptions / Open questions / Evidence.

## Agent alignment

Agent prompts must target the same output paths as the templates:
`roadmap-agent → roadmap`, `module-design-agent → module-design`,
`security-agent → security`, `standards-agent → standards`, `stack-agent → stack`,
`git-strategy-agent → git-strategy`. A test asserts each agent prompt references its
template's `outputPath`.

## Documentation

A new **Templates** docs group (EN/ES): Overview, Core, Architecture, Module,
Operations, Legacy. Each page lists template purpose, when to use, generated path,
related command, related agent and structure. README gets a short Templates section.

## Alternatives considered

- *Keep templates embedded in commands* — rejected: hard to discover/reuse/align.
- *Force every template to be CLI-generated* — rejected: some are best produced by
  LLM agents and reviewed by humans.
- *Make all fields required* — rejected: violates Minimum Sufficient Knowledge.
