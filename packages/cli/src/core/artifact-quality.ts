// Knowledge artifact quality (VS-073.1).
//
// A file existing is not the same as knowledge being ready. Bootstrap creates baseline files that are
// still template placeholders. This deterministic, conservative heuristic classifies a knowledge file
// as missing / placeholder / weak / useful so context / explain / understand / readiness don't treat
// scaffolding as consolidated knowledge. No LLM, no writes — pure content analysis. When in doubt it
// classifies down (never up).

import { exists, readFile, join } from '../utils/fs.js'

export type ArtifactQuality = 'missing' | 'placeholder' | 'weak' | 'useful'

/** A content line that is template guidance rather than real, project-specific knowledge. */
function isPlaceholderLine(line: string): boolean {
  const t = line.trim()
  // Pure italic guidance, e.g. `_Describe the confirmed current state of the system._`
  if (/^_.+_$/.test(t)) return true
  // Bullet whose payload (after an optional [tag]) is italic guidance, e.g. `- [open] _..._`
  if (/^[-*]\s+(\[[^\]]+\]\s*)?_.+_$/.test(t)) return true
  // Bare `- [open]` / `- [observed]` bullets with no real text.
  if (/^[-*]\s+\[[^\]]+\]\s*$/.test(t)) return true
  // Common template stems used in the bootstrap templates.
  if (/^_(?:Describe|List|Document|What|Which|Who|Use|To be defined|No production code)\b/i.test(t)) return true
  // Angle-bracket placeholders, e.g. `### <Capability name>` or `- Related capability: <name>`.
  if (/<[^>]+>/.test(t)) return true
  // Scaffolding field labels: a bullet `- Label:` with no value, or an enum of options `a | b | c`.
  if (/^[-*]\s+[^:]+:\s*$/.test(t)) return true
  if (/^[-*]\s+[^:]+:\s*\S.*\s\|\s/.test(t)) return true
  // Bold field labels used in the domain template: `**Purpose:**`, `**Purpose:** _..._`,
  // `**Criticality:** low | medium | high`.
  if (/^\*\*[^*]+:\*\*\s*$/.test(t)) return true
  if (/^\*\*[^*]+:\*\*\s*_.*_$/.test(t)) return true
  if (/^\*\*[^*]+:\*\*\s*\S.*\s\|\s/.test(t)) return true
  return false
}

/** Lines that don't count as content at all (front matter, headings, blanks, comments, directives). */
function isStructuralLine(line: string, inFrontMatter: boolean): boolean {
  const t = line.trim()
  if (inFrontMatter) return true
  if (t === '') return true
  if (/^#{1,6}\s/.test(t)) return true
  if (/^<!--/.test(t)) return true
  if (/^>/.test(t)) return true // blockquote (e.g. the project-language directive)
  return false
}

/** Classify raw markdown content into a quality level. */
export function analyzeContent(md: string): Exclude<ArtifactQuality, 'missing'> {
  const lines = md.split(/\r?\n/)
  let inFrontMatter = false
  let seenFmFence = 0
  let currentSectionHasUseful = false
  const sectionsWithUseful = new Set<number>()
  let sectionIndex = 0
  const contentLines: string[] = []
  const usefulLines: string[] = []

  for (const raw of lines) {
    const t = raw.trim()
    if (t === '---' && seenFmFence < 2) {
      seenFmFence += 1
      inFrontMatter = seenFmFence === 1
      continue
    }
    if (seenFmFence === 1) continue // inside front matter
    if (/^#{1,6}\s/.test(t)) {
      sectionIndex += 1
      currentSectionHasUseful = false
      continue
    }
    if (isStructuralLine(raw, false)) continue
    contentLines.push(t)
    if (!isPlaceholderLine(raw)) {
      usefulLines.push(t)
      if (!currentSectionHasUseful) {
        currentSectionHasUseful = true
        sectionsWithUseful.add(sectionIndex)
      }
    }
  }

  if (usefulLines.length === 0) return 'placeholder'

  const usefulWordCount = usefulLines.join(' ').split(/\s+/).filter(Boolean).length
  const placeholderRatio = contentLines.length > 0 ? (contentLines.length - usefulLines.length) / contentLines.length : 1

  if (usefulWordCount >= 80 && placeholderRatio < 0.25 && sectionsWithUseful.size >= 2) return 'useful'
  return 'weak'
}

/** Classify a knowledge file by path. Missing when the file does not exist. */
export function analyzeKnowledgeArtifact(dir: string, rel: string): ArtifactQuality {
  const p = join(dir, rel)
  if (!exists(p)) return 'missing'
  try {
    return analyzeContent(readFile(p))
  } catch {
    return 'missing'
  }
}
