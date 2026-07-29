// Knowledge file metadata health (VS-084).
//
// Detects frontmatter drift in knowledge files created by `kaddo bootstrap`. Content quality
// (artifact-quality.ts) stays independent: a file with useful content but drifted metadata is
// still useful. Metadata health is a separate, complementary signal.

import matter from 'gray-matter'
import { exists, readFile, readDir, join, isFile } from '../utils/fs.js'

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

  // Work Item legacy status detection: `done` → `completed` (VS-094).
  const wiDir = join(dir, 'knowledge/delivery/work-items')
  if (exists(wiDir)) {
    const walkWIs = (d: string) => {
      for (const entry of readDir(d)) {
        const p = join(d, entry)
        if (isFile(p) && entry.endsWith('.md')) {
          try {
            const raw = readFile(p)
            const fm = matter(raw).data as Record<string, unknown>
            if (fm.status === 'done') {
              const rel = p.replace(dir + '/', '').replace(dir + '\\', '').replace(/\\/g, '/')
              findings.push({
                file: rel,
                field: 'status',
                issue: 'inconsistent',
                detail: 'Legacy status `done` detected. Canonical status is `completed`.',
              })
            }
          } catch { /* skip */ }
        } else if (!isFile(p) && !entry.startsWith('.')) {
          walkWIs(p)
        }
      }
    }
    walkWIs(wiDir)
  }

  return { findings, healthy, drifted }
}
