import { describe, it, expect } from 'vitest'
import { analyzeGuard } from '../src/core/diff-analysis.js'
import type { Artifact } from '../src/services/artifact-reader.js'

function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    filePath: 'knowledge/work-items/WI-001-test.md',
    id: 'WI-001',
    type: 'feature',
    title: 'Test feature',
    summary: 'Test',
    knowledgeLevel: 'K2',
    codeGlobs: ['src/payments/**'],
    domains: [],
    status: 'in-progress',
    ...overrides,
  }
}

describe('analyzeGuard — no ownership', () => {
  it('is silenced when no artifacts have globs and silentWithoutOwnership=true', () => {
    const artifact = makeArtifact({ codeGlobs: [] })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], true)
    expect(result.silenced).toBe(true)
    expect(result.matches).toHaveLength(0)
  })

  it('reports no matches when no artifacts have globs and silentWithoutOwnership=false', () => {
    const artifact = makeArtifact({ codeGlobs: [] })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], false)
    expect(result.silenced).toBe(false)
    expect(result.matches).toHaveLength(0)
  })
})

describe('analyzeGuard — glob matching', () => {
  it('matches file against glob', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const result = analyzeGuard(['src/payments/payment.service.ts'], [artifact], true)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].matchedFiles).toContain('src/payments/payment.service.ts')
  })

  it('does not match file outside glob', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const result = analyzeGuard(['src/orders/order.service.ts'], [artifact], true)
    expect(result.matches).toHaveLength(0)
  })

  it('matches multiple files against same artifact', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const files = ['src/payments/payment.service.ts', 'src/payments/payment.model.ts', 'src/orders/order.ts']
    const result = analyzeGuard(files, [artifact], true)
    expect(result.matches[0].matchedFiles).toHaveLength(2)
  })

  it('matches across multiple artifacts', () => {
    const a1 = makeArtifact({ id: 'WI-001', codeGlobs: ['src/payments/**'] })
    const a2 = makeArtifact({ id: 'WI-002', filePath: 'knowledge/work-items/WI-002.md', codeGlobs: ['src/orders/**'] })
    const files = ['src/payments/payment.ts', 'src/orders/order.ts']
    const result = analyzeGuard(files, [a1, a2], true)
    expect(result.matches).toHaveLength(2)
  })

  it('handles glob with specific extension', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/**/*.service.ts'] })
    const result = analyzeGuard(['src/payments/payment.service.ts'], [artifact], true)
    expect(result.matches).toHaveLength(1)
  })
})

describe('analyzeGuard — artifact modification detection', () => {
  it('marks artifact as not modified when not in touched files', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], true)
    expect(result.matches[0].artifactWasModified).toBe(false)
  })

  it('marks artifact as modified when its path appears in touched files', () => {
    const artifact = makeArtifact({
      filePath: 'knowledge/work-items/WI-001-test.md',
      codeGlobs: ['src/payments/**'],
    })
    const files = ['src/payments/payment.ts', 'knowledge/work-items/WI-001-test.md']
    const result = analyzeGuard(files, [artifact], true)
    expect(result.matches[0].artifactWasModified).toBe(true)
  })
})

describe('analyzeGuard — evidence score', () => {
  it('includes evidence with matched glob count', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**', 'src/shared/**'] })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], true)
    expect(result.matches[0].evidence.matched).toBe(1)
    expect(result.matches[0].evidence.total).toBe(2)
    expect(result.matches[0].evidence.label).toBe('1/2 globs matched')
  })

  it('evidence signals include knowledge level and domain', () => {
    const artifact = makeArtifact({
      codeGlobs: ['src/payments/**'],
      knowledgeLevel: 'K2',
      domains: ['payments'],
    })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], true)
    const { signals } = result.matches[0].evidence
    expect(signals.join(' ')).toContain('K2')
    expect(signals.join(' ')).toContain('payments')
  })

  it('evidence matched equals total when all globs hit', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const result = analyzeGuard(['src/payments/payment.ts'], [artifact], true)
    expect(result.matches[0].evidence.matched).toBe(1)
    expect(result.matches[0].evidence.total).toBe(1)
  })
})

describe('analyzeGuard — empty diff', () => {
  it('returns no matches for empty file list', () => {
    const artifact = makeArtifact({ codeGlobs: ['src/payments/**'] })
    const result = analyzeGuard([], [artifact], true)
    expect(result.matches).toHaveLength(0)
  })
})
