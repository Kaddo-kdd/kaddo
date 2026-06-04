import { describe, it, expect } from 'vitest'
import { analyzeGuard } from '../src/core/diff-analysis.js'

// Test CI output structure using the same analyzeGuard logic
function buildCIOutput(
  touchedFiles: string[],
  activeMatches: ReturnType<typeof analyzeGuard>['matches'],
  ignoredCount: number
) {
  return {
    kaddo_guard: true,
    ci: true,
    touched_files: touchedFiles.length,
    fyi_count: activeMatches.length,
    ignored_count: ignoredCount,
    findings: activeMatches.map((m) => ({
      artifact_id: m.artifact.id || m.artifact.title,
      artifact_type: m.artifact.type,
      knowledge_level: m.artifact.knowledgeLevel,
      matched_files: m.matchedFiles,
      evidence: m.evidence.signals,
      message: `${m.artifact.id || m.artifact.title} was not modified in this diff`,
    })),
  }
}

describe('guard --ci JSON output', () => {
  it('produces valid JSON with expected shape', () => {
    const artifact = {
      filePath: 'knowledge/work-items/WI-001.md',
      id: 'WI-001', type: 'feature', title: 'Test', summary: '', knowledgeLevel: 'K2',
      codeGlobs: ['src/payments/**'], domains: ['payments'], status: 'in-progress',
    }
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], false)
    const activeMatches = result.matches.filter((m) => !m.artifactWasModified)
    const output = buildCIOutput(result.touchedFiles, activeMatches, 0)

    expect(output.kaddo_guard).toBe(true)
    expect(output.ci).toBe(true)
    expect(output.touched_files).toBe(1)
    expect(output.fyi_count).toBe(1)
    expect(output.ignored_count).toBe(0)
    expect(output.findings).toHaveLength(1)
    expect(output.findings[0].artifact_id).toBe('WI-001')
    expect(output.findings[0].knowledge_level).toBe('K2')
    expect(output.findings[0].matched_files).toContain('src/payments/payment.ts')
    expect(typeof JSON.stringify(output)).toBe('string')
  })

  it('fyi_count is 0 when artifact was also modified', () => {
    const artifact = {
      filePath: 'knowledge/work-items/WI-001.md',
      id: 'WI-001', type: 'feature', title: 'Test', summary: '', knowledgeLevel: 'K2',
      codeGlobs: ['src/payments/**'], domains: [], status: 'in-progress',
    }
    const files = ['src/payments/payment.ts', 'knowledge/work-items/WI-001.md']
    const result = analyzeGuard(files, [artifact], false)
    const activeMatches = result.matches.filter((m) => !m.artifactWasModified)
    const output = buildCIOutput(result.touchedFiles, activeMatches, 0)

    expect(output.fyi_count).toBe(0)
    expect(output.findings).toHaveLength(0)
  })

  it('ignored_count reflects suppressed findings', () => {
    const output = buildCIOutput(['src/payments/payment.ts'], [], 2)
    expect(output.ignored_count).toBe(2)
    expect(output.fyi_count).toBe(0)
  })
})
