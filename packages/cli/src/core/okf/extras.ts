// OKF extras (WI-065): on-demand concepts that are not plain knowledge/*.md artifacts — reports and
// external Knowledge Capsule references. Kept separate so the core bundle stays deterministic; reports
// carry a generation timestamp by nature and are opt-in.

import { buildImpactReport, renderImpactMarkdown } from '../impact-report.js'
import { buildDriftReport, renderDriftMarkdown } from '../drift-report.js'
import { buildSavingsReport, renderSavingsMarkdown } from '../savings.js'
import { loadExternalRegistry } from '../capsule.js'
import type { OkfConcept } from './types.js'

/**
 * Project Kaddo's reports (Impact / Drift / Savings) as OKF "Report" concepts. Bodies are the existing
 * rendered Markdown, so findings, assumptions, confidence, limitations and the Savings disclaimer are
 * preserved verbatim — estimates are never turned into observed values, and formulas are not modified.
 * Each is skipped (with a warning) if it cannot be built.
 */
export function reportConcepts(dir: string, now: Date = new Date()): { concepts: OkfConcept[]; warnings: string[] } {
  const concepts: OkfConcept[] = []
  const warnings: string[] = []
  const at = now.toISOString()

  const add = (id: string, title: string, description: string, build: () => string) => {
    try {
      const body = build()
      concepts.push({
        id, type: 'Report', title, description, tags: ['report'],
        path: `reports/${id}.md`, sourcePath: null, generatedAt: at, related: [], body,
      })
    } catch (e) {
      warnings.push(`Report "${id}" skipped: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  add('report-impact', 'Impact Report', 'Knowledge-code impact, derived from evidence.',
    () => renderImpactMarkdown(buildImpactReport(dir, {}, now), { details: true }))
  add('report-drift', 'Drift Report', 'Drift trend across code, knowledge, Work Items and architecture.',
    () => renderDriftMarkdown(buildDriftReport(dir, now)))
  add('report-savings', 'Savings Report', 'Evidence-based savings estimates (not exact ROI).',
    () => renderSavingsMarkdown(buildSavingsReport(dir, {}, now)))

  return { concepts, warnings }
}

/**
 * Represent EXTERNAL Knowledge Capsules (from `.kaddo/external.yml`) as OKF "Knowledge Reference"
 * concepts, preserving their source and known access limitation — without assuming access to the
 * origin system or pulling its private sources.
 */
export function externalCapsuleConcepts(dir: string): OkfConcept[] {
  return loadExternalRegistry(dir).map((e) => {
    const lines = [
      `# ${e.id}`,
      '',
      'External Knowledge Reference. Access is limited to its source system; its private sources are not',
      'included in this bundle and no operational access to the origin system is implied.',
      '',
      `- Source: \`${e.path}\``,
      ...(e.owner ? [`- Owner: ${e.owner}`] : []),
      ...(e.lastImportedAt ? [`- Last imported: ${e.lastImportedAt}`] : []),
    ]
    return {
      id: e.id, type: 'Knowledge Reference', title: e.id,
      description: 'External knowledge reference (capsule).', tags: ['reference', 'external'],
      path: `external/${e.id}.md`, sourcePath: e.path, related: [], body: lines.join('\n'),
    }
  })
}
