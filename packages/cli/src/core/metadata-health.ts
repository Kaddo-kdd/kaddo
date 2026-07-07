// Knowledge file metadata health (VS-084).
//
// Detects frontmatter drift in knowledge files created by `kaddo bootstrap`. Content quality
// (artifact-quality.ts) stays independent: a file with useful content but drifted metadata is
// still useful. Metadata health is a separate, complementary signal.

import matter from 'gray-matter'
import { exists, readFile, join } from '../utils/fs.js'

export type MetadataFinding = {
  file: string
  field: string
  issue: 'missing' | 'inconsistent'
  detail: string
}

export type MetadataHealth = {
  findings: MetadataFinding[]
  healthy: number
  drifted: number
}

const KNOWLEDGE_FILES = [
  'knowledge/business/business.md',
  'knowledge/product/product.md',
  'knowledge/product/capabilities.md',
  'knowledge/tech/codebase.md',
  'knowledge/tech/current-state.md',
  'knowledge/delivery/roadmap.md',
] as const

const REQUIRED_FIELDS = ['type', 'generated_by', 'template_version'] as const

export function analyzeMetadataHealth(dir: string): MetadataHealth {
  const findings: MetadataFinding[] = []
  let healthy = 0
  let drifted = 0

  for (const rel of KNOWLEDGE_FILES) {
    const p = join(dir, rel)
    if (!exists(p)) continue

    let data: Record<string, unknown>
    try {
      const raw = readFile(p)
      data = matter(raw).data as Record<string, unknown>
    } catch {
      continue
    }

    // No frontmatter at all — skip (pre-bootstrap file or manually created).
    if (Object.keys(data).length === 0) continue

    let fileDrifted = false
    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        findings.push({ file: rel, field, issue: 'missing', detail: `Missing \`${field}\` in frontmatter.` })
        fileDrifted = true
      }
    }

    // project_state consistency: if refined_by is set, project_state should be 'ai-assisted'.
    if (data.refined_by && data.project_state && data.project_state !== 'ai-assisted') {
      findings.push({
        file: rel,
        field: 'project_state',
        issue: 'inconsistent',
        detail: `File has \`refined_by: ${data.refined_by}\` but \`project_state\` is \`${data.project_state}\`, expected \`ai-assisted\`.`,
      })
      fileDrifted = true
    }

    if (fileDrifted) drifted++
    else healthy++
  }

  return { findings, healthy, drifted }
}
