// Derived generation tools (VS-058).
//
// These tools regenerate Kaddo's DERIVED artifacts under `.kaddo/` using the exact same core logic
// as the CLI (imported from @kaddo/cli source and bundled). They are deterministic: they never call
// an LLM, never run git, and never modify source knowledge (`knowledge/`), source code (`src/`) or
// external context (`external/`, `.kaddo/external.yml`). Every write goes through the derived-write
// allowlist in project.ts.

import { loadConfig } from '../../cli/src/core/config.js'
import { buildContextPack, serializeContextPackJson } from '../../cli/src/core/context-pack.js'
import { renderContextPack } from '../../cli/src/templates/context-pack-template.js'
import {
  buildProjectExplanation,
  renderExplanationHuman,
  renderExplanationAgent,
} from '../../cli/src/core/project-explain.js'
import { buildUnderstandPlan } from '../../cli/src/core/understand.js'
import { renderUnderstand } from '../../cli/src/templates/understand-template.js'
import { buildGraph, serializeGraphJson, renderGraphMermaid } from '../../cli/src/core/graph.js'
import {
  buildGraphHints,
  renderGraphHintsMarkdown,
  serializeGraphHintsJson,
} from '../../cli/src/core/graph-hints.js'
import { buildCapsule, renderCapsuleMarkdown, serializeCapsuleJson } from '../../cli/src/core/capsule.js'
import { buildImpactReport, renderImpactMarkdown, serializeImpactJson } from '../../cli/src/core/impact-report.js'
import { buildSavingsReport, renderSavingsMarkdown, serializeSavingsJson } from '../../cli/src/core/savings.js'
import { buildDriftReport, renderDriftMarkdown, serializeDriftJson } from '../../cli/src/core/drift-report.js'
import { buildOpenQuestionsReport, renderOpenQuestionsMarkdown, serializeOpenQuestionsJson } from '../../cli/src/core/open-questions.js'
import { writeDerived, hasKnowledge, KaddoMcpError } from './project.js'

export type GenerateResult = {
  status: 'ok'
  files_written: string[]
  summary: string
  warnings: string[]
  next_suggested_resources: string[]
}

function requireConfig(root: string) {
  const config = loadConfig(root)
  if (!config) throw new KaddoMcpError('Kaddo project not found. Run `kaddo init` first.')
  return config
}

function requireKnowledge(root: string): void {
  if (!hasKnowledge(root)) {
    throw new KaddoMcpError('Knowledge repository not found. Run `kaddo bootstrap` first.')
  }
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project'
}

/** kaddo_generate_context — regenerate the context pack. */
export function generateContext(root: string): GenerateResult {
  const config = requireConfig(root)
  requireKnowledge(root)
  const pack = buildContextPack(root, config)
  writeDerived(root, '.kaddo/context-pack.md', renderContextPack(pack))
  writeDerived(root, '.kaddo/context-pack.json', serializeContextPackJson(pack))
  return {
    status: 'ok',
    files_written: ['.kaddo/context-pack.md', '.kaddo/context-pack.json'],
    summary: 'Context pack generated successfully.',
    warnings: pack.missing ?? [],
    next_suggested_resources: ['kaddo://context-pack'],
  }
}

/** kaddo_generate_explain — regenerate the project explanation. */
export function generateExplain(root: string): GenerateResult {
  requireConfig(root)
  requireKnowledge(root)
  const exp = buildProjectExplanation(root)
  writeDerived(root, '.kaddo/explain.md', renderExplanationHuman(exp))
  writeDerived(root, '.kaddo/explain.json', renderExplanationAgent(exp))
  return {
    status: 'ok',
    files_written: ['.kaddo/explain.md', '.kaddo/explain.json'],
    summary: 'Explain output generated successfully.',
    warnings: exp.missingKnowledge ?? [],
    next_suggested_resources: ['kaddo://explain'],
  }
}

/** kaddo_generate_understand — regenerate the understand guide. */
export function generateUnderstand(root: string): GenerateResult {
  const config = requireConfig(root)
  requireKnowledge(root)
  const plan = buildUnderstandPlan(root, config)
  writeDerived(root, '.kaddo/understand.md', renderUnderstand(plan))
  return {
    status: 'ok',
    files_written: ['.kaddo/understand.md'],
    summary: 'Understand guide generated successfully.',
    warnings: [],
    next_suggested_resources: ['kaddo://understand'],
  }
}

/** kaddo_generate_graph — regenerate the knowledge graph + hints (scope: active|all, default active). */
export function generateGraph(root: string, scope: 'active' | 'all' = 'active'): GenerateResult {
  const config = requireConfig(root)
  requireKnowledge(root)
  const graph = buildGraph(root, config, { scope })
  const hints = buildGraphHints(root, graph)
  writeDerived(root, '.kaddo/graph.json', serializeGraphJson(graph))
  writeDerived(root, '.kaddo/graph.mmd', renderGraphMermaid(graph))
  writeDerived(root, '.kaddo/graph-hints.md', renderGraphHintsMarkdown(hints))
  writeDerived(root, '.kaddo/graph-hints.json', serializeGraphHintsJson(hints))
  const warnings =
    hints.summary.hints > 0
      ? [`Relationship quality: ${hints.quality} — ${hints.summary.hints} metadata hint(s).`]
      : []
  return {
    status: 'ok',
    files_written: [
      '.kaddo/graph.json',
      '.kaddo/graph.mmd',
      '.kaddo/graph-hints.md',
      '.kaddo/graph-hints.json',
    ],
    summary: `Knowledge graph and hints generated successfully (${scope} scope).`,
    warnings,
    next_suggested_resources: ['kaddo://graph', 'kaddo://graph-hints'],
  }
}

/** kaddo_generate_impact_report — write the impact report under .kaddo/reports/ (VS-061). */
export function generateImpactReport(
  root: string,
  opts: { format?: 'markdown' | 'json'; scope?: 'active' | 'all'; output?: string } = {}
): GenerateResult {
  requireConfig(root)
  requireKnowledge(root)
  const format = opts.format ?? 'markdown'
  const report = buildImpactReport(root, { scope: opts.scope ?? 'all', scopeSource: opts.scope ? 'explicit' : 'default' })
  const content = format === 'json' ? serializeImpactJson(report) : renderImpactMarkdown(report)
  const out = opts.output ?? `.kaddo/reports/impact-report.${format === 'json' ? 'json' : 'md'}`
  writeDerived(root, out, content) // allowlist enforces .kaddo/reports/
  return {
    status: 'ok',
    files_written: [out.replace(/\\/g, '/')],
    summary: `Impact report generated (${format}, ${report.scope} scope).`,
    warnings: report.score === null ? ['Impact score not available — add Work Items to compute it.'] : [],
    next_suggested_resources: ['kaddo://impact-report'],
  }
}

/** kaddo_generate_savings_report — write the estimated savings report under .kaddo/reports/ (VS-062). */
export function generateSavingsReport(
  root: string,
  opts: { format?: 'markdown' | 'json'; scope?: 'active' | 'all'; output?: string } = {}
): GenerateResult {
  requireConfig(root)
  requireKnowledge(root)
  const format = opts.format ?? 'markdown'
  const report = buildSavingsReport(root, { scope: opts.scope ?? 'all', scopeSource: opts.scope ? 'explicit' : 'default' })
  const content = format === 'json' ? serializeSavingsJson(report) : renderSavingsMarkdown(report)
  const out = opts.output ?? `.kaddo/reports/savings-report.${format === 'json' ? 'json' : 'md'}`
  writeDerived(root, out, content) // allowlist enforces .kaddo/reports/
  return {
    status: 'ok',
    files_written: [out.replace(/\\/g, '/')],
    summary: `Savings report generated (${format}, ${report.scope} scope, ~${report.total.estimated_hours_saved}h).`,
    warnings: report.assumptions_source === 'default' ? ['Using default assumptions — run `kaddo savings init` to calibrate.'] : [],
    next_suggested_resources: ['kaddo://savings-report'],
  }
}

/** kaddo_generate_drift_report — write the drift trend report under .kaddo/reports/ (VS-063). */
export function generateDriftReport(
  root: string,
  opts: { format?: 'markdown' | 'json'; output?: string } = {}
): GenerateResult {
  requireConfig(root)
  const format = opts.format ?? 'markdown'
  const report = buildDriftReport(root)
  const content = format === 'json' ? serializeDriftJson(report) : renderDriftMarkdown(report)
  const out = opts.output ?? `.kaddo/reports/drift-report.${format === 'json' ? 'json' : 'md'}`
  writeDerived(root, out, content) // allowlist enforces .kaddo/reports/
  return {
    status: 'ok',
    files_written: [out.replace(/\\/g, '/')],
    summary: report.guard_history.available
      ? `Drift report generated (${report.drift_warnings.open} open, ${report.drift_warnings.resolved} resolved).`
      : 'Drift report generated (no guard history yet — run `kaddo guard --record`).',
    warnings: report.guard_history.available ? [] : ['No guard history recorded yet.'],
    next_suggested_resources: ['kaddo://drift-report'],
  }
}

/** kaddo_generate_questions_report — write the open-questions readiness report under .kaddo/reports/ (VS-064). */
export function generateQuestionsReport(
  root: string,
  opts: { format?: 'markdown' | 'json'; output?: string } = {}
): GenerateResult {
  requireConfig(root)
  const format = opts.format ?? 'markdown'
  const report = buildOpenQuestionsReport(root)
  const content = format === 'json' ? serializeOpenQuestionsJson(report) : renderOpenQuestionsMarkdown(report)
  const out = opts.output ?? `.kaddo/reports/questions-report.${format === 'json' ? 'json' : 'md'}`
  writeDerived(root, out, content) // allowlist enforces .kaddo/reports/
  return {
    status: 'ok',
    files_written: [out.replace(/\\/g, '/')],
    summary: `Open questions report generated (readiness: ${report.summary.roadmap_readiness}, ${report.summary.blocking} blocking).`,
    warnings: report.summary.blocking > 0 ? [`${report.summary.blocking} blocking question(s) before the roadmap.`] : [],
    next_suggested_resources: ['kaddo://open-questions', 'kaddo://roadmap-readiness'],
  }
}

/** kaddo_generate_capsule_draft — write a capsule DRAFT under .kaddo/exports/ (never registers it). */
export function generateCapsuleDraft(root: string): GenerateResult {
  const config = requireConfig(root)
  requireKnowledge(root)
  const capsule = buildCapsule(root, config)
  const name = slug(config.project.name)
  const md = `.kaddo/exports/${name}.capsule.md`
  const json = `.kaddo/exports/${name}.capsule.json`
  writeDerived(root, md, renderCapsuleMarkdown(capsule))
  writeDerived(root, json, serializeCapsuleJson(capsule))
  return {
    status: 'ok',
    files_written: [md, json],
    summary: `Capsule draft generated at ${md}. It is NOT registered as external context.`,
    warnings: [
      'Review the draft for secrets/source before sharing.',
      'This draft is not imported anywhere. Use the CLI `kaddo capsule add` to register an external capsule.',
    ],
    next_suggested_resources: [],
  }
}
