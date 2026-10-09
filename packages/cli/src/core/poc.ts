import { exists, join, readFile } from '../utils/fs.js'

export const POC_ARTIFACT_PATH = 'knowledge/delivery/poc.md'

export type PocConclusion = 'pending' | 'validated' | 'rejected' | 'inconclusive'

export type PocSummary = {
  exists: boolean
  hypothesisDefined: boolean
  successCriteriaCount: number
  constraintsDefined: boolean
  nonGoalsDefined: boolean
  conclusion: PocConclusion
}

const PLACEHOLDER = /^[_<].*[_>]$|^(describe|list|document|what|how)\b/i

function section(markdown: string, heading: string): string {
  const match = markdown.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, 'im'))
  return match?.[1] ?? ''
}

function meaningful(text: string): boolean {
  return text.split(/\r?\n/).some((line) => {
    const value = line.trim().replace(/^[-*]\s+(?:\[[^\]]+\]\s*)?/, '')
    return Boolean(value) && !PLACEHOLDER.test(value) && !/^status:\s*(pending|tbd)$/i.test(value)
  })
}

/** Read the small, canonical POC artifact without interpreting repository code. */
export function readPocSummary(dir: string): PocSummary {
  const path = join(dir, POC_ARTIFACT_PATH)
  if (!exists(path)) {
    return { exists: false, hypothesisDefined: false, successCriteriaCount: 0, constraintsDefined: false, nonGoalsDefined: false, conclusion: 'pending' }
  }
  let markdown = ''
  try { markdown = readFile(path) } catch { return { exists: false, hypothesisDefined: false, successCriteriaCount: 0, constraintsDefined: false, nonGoalsDefined: false, conclusion: 'pending' } }
  const criteria = section(markdown, 'Success Criteria')
    .split(/\r?\n/)
    .filter((line) => /^\s*[-*]\s+(?:\[[ xX]\]\s+)?/.test(line))
    .filter((line) => meaningful(line)).length
  const conclusionBody = section(markdown, 'Conclusion')
  const conclusionMatch = conclusionBody.match(/\b(?:status|outcome)\s*:\s*(validated|rejected|inconclusive)\b/i)
  return {
    exists: true,
    hypothesisDefined: meaningful(section(markdown, 'Hypothesis')),
    successCriteriaCount: criteria,
    constraintsDefined: meaningful(section(markdown, 'Constraints')),
    nonGoalsDefined: meaningful(section(markdown, 'Non-goals')),
    conclusion: conclusionMatch ? conclusionMatch[1].toLowerCase() as PocConclusion : 'pending',
  }
}
