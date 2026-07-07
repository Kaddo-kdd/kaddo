// Work Item Source Metadata (VS-082).
//
// Normalizes the origin of each Work Item so Kaddo can trace where work comes from
// without creating a separate "work source" flow. Pure types + deterministic parsing.

export const VALID_SOURCES = [
  'manual', 'roadmap', 'jira', 'github', 'notion', 'xlsx', 'csv', 'api', 'external', 'unknown',
] as const

export type WorkItemSourceType = typeof VALID_SOURCES[number]

export type WorkItemSource = {
  type: WorkItemSourceType
  id?: string
  title?: string
  context?: string
  provider?: string
  url?: string
  imported_at?: string
  synced_at?: string
  inferred: boolean
  reason?: string
}

export function isValidSource(s: string): s is WorkItemSourceType {
  return (VALID_SOURCES as readonly string[]).includes(s)
}

/**
 * Parse source metadata from Work Item frontmatter.
 * Infers `roadmap` from legacy fields; defaults to `unknown` for items with no source metadata.
 */
export function parseWorkItemSource(frontmatter: Record<string, unknown>): WorkItemSource {
  const rawSource = frontmatter.source

  if (rawSource != null && typeof rawSource === 'object' && !Array.isArray(rawSource)) {
    const obj = rawSource as Record<string, unknown>
    const t = optStr(obj.type)
    const type: WorkItemSourceType = t && isValidSource(t) ? t : 'unknown'
    return {
      type,
      id: optStr(obj.id) ?? optStr(frontmatter.source_id),
      title: optStr(obj.title) ?? optStr(frontmatter.source_title),
      context: optStr(obj.context) ?? optStr(frontmatter.source_context),
      provider: optStr(obj.provider) ?? optStr(frontmatter.source_provider),
      url: optStr(obj.url) ?? optStr(frontmatter.source_url),
      imported_at: optStr(obj.imported_at) ?? optStr(frontmatter.source_imported_at),
      synced_at: optStr(obj.synced_at) ?? optStr(frontmatter.source_synced_at),
      inferred: obj.inferred === true || obj.inferred === 'true',
      reason: t && !isValidSource(t) ? `Invalid source type in object: "${t}".` : undefined,
    }
  }

  const raw = rawSource ? String(rawSource) : ''

  if (raw && isValidSource(raw)) {
    return {
      type: raw,
      id: optStr(frontmatter.source_id),
      title: optStr(frontmatter.source_title),
      context: optStr(frontmatter.source_context),
      provider: optStr(frontmatter.source_provider),
      url: optStr(frontmatter.source_url),
      imported_at: optStr(frontmatter.source_imported_at),
      synced_at: optStr(frontmatter.source_synced_at),
      inferred: false,
    }
  }

  if (raw && !isValidSource(raw)) {
    return {
      type: 'unknown',
      id: optStr(frontmatter.source_id),
      title: optStr(frontmatter.source_title),
      context: optStr(frontmatter.source_context),
      provider: optStr(frontmatter.source_provider),
      url: optStr(frontmatter.source_url),
      imported_at: optStr(frontmatter.source_imported_at),
      synced_at: optStr(frontmatter.source_synced_at),
      inferred: true,
      reason: `Invalid source value: "${raw}".`,
    }
  }

  // Infer from legacy roadmap fields
  if (frontmatter.source_work_item_candidate || frontmatter.source_roadmap_initiative) {
    return {
      type: 'roadmap',
      id: optStr(frontmatter.source_id) ?? optStr(frontmatter.source_work_item_candidate),
      title: optStr(frontmatter.source_initiative_title),
      inferred: true,
      reason: 'Inferred from legacy roadmap fields.',
    }
  }

  if (frontmatter.source_id) {
    return {
      type: 'unknown',
      id: optStr(frontmatter.source_id),
      inferred: true,
      reason: 'Has source_id but no source type.',
    }
  }

  return {
    type: 'unknown',
    inferred: true,
    reason: 'No source metadata found.',
  }
}

export type WorkItemSourceSummary = Record<WorkItemSourceType, number>

export function summarizeWorkItemSources(sources: WorkItemSource[]): WorkItemSourceSummary {
  const summary = Object.fromEntries(VALID_SOURCES.map((s) => [s, 0])) as WorkItemSourceSummary
  for (const s of sources) summary[s.type]++
  return summary
}

export function renderSourceCompact(source: WorkItemSource): string {
  const parts: string[] = [source.type]
  if (source.id) parts.push(source.id)
  return parts.join(' · ')
}

export function renderSourcesSummary(summary: WorkItemSourceSummary): string {
  return (Object.entries(summary) as [WorkItemSourceType, number][])
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${n}`)
    .join('\n')
}

function optStr(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return undefined
}
