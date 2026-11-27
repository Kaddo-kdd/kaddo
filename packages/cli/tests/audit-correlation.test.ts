import { describe, it, expect } from 'vitest'
import { correlateFindings, type DiscoveredModuleRef } from '../src/core/audit-correlation.js'
import { stableFindingId, type AuditFinding } from '../src/core/audit.js'
import type { KnowledgeArtifact } from '../src/services/knowledge-artifacts.js'

// WI-094 (EP-001/INI-001, AUD-C6) — the Correlate step: enrich findings with references to ADRs,
// capabilities, Work Items, ownership and risks by deterministic module/path/domain matching. Read-only,
// advisory, honest (matchStrength), and non-mutating. Tested with fixture artifacts + ownership.

function artifact(over: Partial<KnowledgeArtifact> & { id: string; type: string }): KnowledgeArtifact {
  return {
    filePath: `/repo/knowledge/${over.id}.md`, title: over.id, summary: '', knowledgeLevel: 'K2',
    codeGlobs: [], domains: [], capabilities: [], status: 'ready', phase: 'now', initiative: '',
    source: '', sourceId: '', rawFrontmatter: {}, decisions: [], capsules: [],
    implementationStatus: '', validationStatus: '', releaseStatus: '', affectedModules: [],
    refinedBy: '', implementedBy: '', closedBy: '', scopeConfidence: null, moduleCoverage: null,
    impactAnalysis: null, relPath: `knowledge/${over.id}.md`, layer: 'delivery', isWorkItem: false,
    ...over,
  } as KnowledgeArtifact
}

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: over.id ?? stableFindingId({ category: 'types', location: over.location, fingerprint: 'f' }),
    category: 'types', title: 'x', description: 'x', evidence: 'e', provenance: 'tsc',
    severity: 'high', confidence: 'confirmed', recommendation: 'fix', status: 'open', references: {}, ...over,
  }
}

const modules: DiscoveredModuleRef[] = [{ name: 'cli', path: 'packages/cli' }]

describe('audit correlation (WI-094)', () => {
  it('matches a finding to a Work Item by file glob (exact) and populates references.workItems (AC-02/AC-06)', () => {
    const wi = artifact({ id: 'WI-050', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/src/**'] })
    const [c] = correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })], artifacts: [wi], modules })
    expect(c.references.workItems).toEqual(['WI-050'])
    expect(c.correlation.matchStrength).toBe('exact')
  })

  it('matches by affected module when no glob matches (module strength) (AC-02/AC-06)', () => {
    const wi = artifact({ id: 'WI-051', type: 'feature', isWorkItem: true, affectedModules: ['cli'] })
    const [c] = correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/b.ts', line: 2 } })], artifacts: [wi], modules })
    expect(c.references.workItems).toEqual(['WI-051'])
    expect(c.correlation.matchStrength).toBe('module')
  })

  it('correlates with governing ADRs and capabilities (AC-03)', () => {
    const adr = artifact({ id: 'ADR-003', type: 'decision', codeGlobs: ['packages/cli/**'], capabilities: ['audit-core'] })
    const [c] = correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })], artifacts: [adr], modules })
    expect(c.references.adrs).toEqual(['ADR-003'])
    expect(c.references.capabilities).toEqual(['audit-core'])
  })

  it('resolves ownership from matched artifact domains (AC-04)', () => {
    const wi = artifact({ id: 'WI-052', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/**'], domains: ['Tech'] })
    const [c] = correlateFindings({
      findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })],
      artifacts: [wi], owners: { Tech: ['alice', 'bob'] }, modules,
    })
    expect(c.correlation.owners).toEqual([{ domain: 'Tech', owners: ['alice', 'bob'] }])
    expect(c.correlation.notes.join(' ')).toMatch(/Owners: Tech → alice\/bob/)
  })

  it('surfaces documented risks for the area (AC-05)', () => {
    const risk = artifact({ id: 'RISK-001', type: 'risk', codeGlobs: ['packages/cli/**'] })
    const [c] = correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })], artifacts: [risk], modules })
    expect(c.correlation.risks).toEqual(['RISK-001'])
  })

  it('a finding with no matches gets empty references and a "no correlation" note, never fabricated (AC-08)', () => {
    const wi = artifact({ id: 'WI-060', type: 'feature', isWorkItem: true, codeGlobs: ['packages/admin/**'] })
    const [c] = correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })], artifacts: [wi], modules })
    expect(c.references.workItems).toEqual([])
    expect(c.correlation.matchStrength).toBe('none')
    expect(c.correlation.notes).toEqual(['No correlation found in project knowledge.'])
  })

  it('is read-only: does not mutate inputs nor change severity/confidence/status (AC-07)', () => {
    const f = finding({ location: { file: 'packages/cli/src/a.ts', line: 1 }, severity: 'critical', confidence: 'inferred' })
    const wi = artifact({ id: 'WI-070', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/**'] })
    const [c] = correlateFindings({ findings: [f], artifacts: [wi], modules })
    expect(f.references).toEqual({}) // original untouched
    expect(c.severity).toBe('critical')
    expect(c.confidence).toBe('inferred')
    expect(c.status).toBe('open')
  })

  it('is deterministic with stable reference order (AC-09)', () => {
    const arts = [
      artifact({ id: 'WI-002', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/**'] }),
      artifact({ id: 'WI-001', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/**'] }),
    ]
    const run = () => correlateFindings({ findings: [finding({ location: { file: 'packages/cli/src/a.ts', line: 1 } })], artifacts: arts, modules })
    expect(run()[0].references.workItems).toEqual(['WI-001', 'WI-002'])
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })

  it('merges with references the finding already carried (AC-01)', () => {
    const wi = artifact({ id: 'WI-003', type: 'feature', isWorkItem: true, codeGlobs: ['packages/cli/**'] })
    const f = finding({ location: { file: 'packages/cli/src/a.ts', line: 1 }, references: { workItems: ['WI-999'] } })
    const [c] = correlateFindings({ findings: [f], artifacts: [wi], modules })
    expect(c.references.workItems).toEqual(['WI-003', 'WI-999'])
  })

  it('is exported from the Core barrel (AC-09)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.correlateFindings).toBe('function')
  })
})
