// Legacy-aware guard analysis (WI-012).
//
// Detects when touched files intersect with areas flagged in legacy risk analysis.
// Non-blocking: adds context to guard output, never prevents a commit.

import { exists, join, readFile } from '../utils/fs.js'
import { minimatch } from 'minimatch'

const RISKS_PATH = 'knowledge/legacy/risks.md'

export type LegacyRiskIntersection = {
  riskId: string
  title: string
  area: string
  blastRadius: string
  confidence: string
  matchedFiles: string[]
}

type ParsedRisk = {
  id: string
  title: string
  area: string
  blastRadius: string
  confidence: string
  areaPatterns: string[]
}

function parseRisks(content: string): ParsedRisk[] {
  const risks: ParsedRisk[] = []
  const sections = content.split(/^## /gm).slice(1)

  for (const section of sections) {
    const headerMatch = section.match(/^(RISK-\d+):\s*(.+)$/m)
    if (!headerMatch) continue

    const id = headerMatch[1]
    const title = headerMatch[2].trim()

    const areaMatch = section.match(/\*\*Area:\*\*\s*(.+)/i)
    const blastMatch = section.match(/\*\*Blast radius:\*\*\s*(\w+)/i)
    const confMatch = section.match(/\*\*Confidence:\*\*\s*(\w+)/i)

    const area = areaMatch?.[1]?.trim() ?? ''
    const blastRadius = blastMatch?.[1]?.trim() ?? 'unknown'
    const confidence = confMatch?.[1]?.trim() ?? 'unknown'

    const areaPatterns = area
      .split(/[,;]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .flatMap((p) => {
        if (p.includes('*')) return [p]
        if (p.includes('/')) return [`${p}/**`, `${p}*`]
        return [`**/${p}/**`, `**/${p}*`, `**/*${p}*`]
      })

    risks.push({ id, title, area, blastRadius, confidence, areaPatterns })
  }

  return risks
}

/**
 * Analyze touched files against known legacy risks. Returns intersections where touched
 * files overlap with risk areas — used by guard to provide additional context.
 */
export function analyzeLegacyRiskIntersections(dir: string, touchedFiles: string[]): LegacyRiskIntersection[] {
  const risksPath = join(dir, RISKS_PATH)
  if (!exists(risksPath) || touchedFiles.length === 0) return []

  const content = readFile(risksPath)
  const risks = parseRisks(content)
  const intersections: LegacyRiskIntersection[] = []

  for (const risk of risks) {
    if (risk.areaPatterns.length === 0) continue

    const matched = touchedFiles.filter((f) =>
      risk.areaPatterns.some((pattern) => minimatch(f, pattern, { dot: true }))
    )

    if (matched.length > 0) {
      intersections.push({
        riskId: risk.id,
        title: risk.title,
        area: risk.area,
        blastRadius: risk.blastRadius,
        confidence: risk.confidence,
        matchedFiles: matched,
      })
    }
  }

  return intersections
}
