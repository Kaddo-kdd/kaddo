import { ensureDir, exists, join, readFile, writeFile } from '../utils/fs.js'

export const POC_ARTIFACT_PATH = 'knowledge/delivery/poc.md'

export function pocTemplate(projectName: string): string {
  return `---
type: poc
status: active
generated_by: kaddo-init
template_version: 1
---

# ${projectName} — Proof of Concept

## Problem

_What are we trying to understand or solve?_

## Hypothesis

_What assumption are we testing?_

## Expected Value

_Why is validating this worth doing?_

## Scenario

_What concrete scenario will demonstrate the hypothesis?_

## Success Criteria

- [ ] _Observable result that would support the hypothesis._

## Constraints

_Technical, time, budget, compliance, or operational constraints._

## Non-goals

_What this experiment intentionally will not prove or deliver._

## Evidence

_Link experiments, Work Items, measurements, and observations here._

## Conclusion

Status: pending
`
}

export function ensurePocArtifact(dir: string, projectName: string): boolean {
  const path = join(dir, POC_ARTIFACT_PATH)
  if (exists(path)) return false
  ensureDir(join(dir, 'knowledge', 'delivery'))
  writeFile(path, pocTemplate(projectName))
  return true
}

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
