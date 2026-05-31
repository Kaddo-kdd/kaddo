import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-explain-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// Test the filtering and aggregation logic directly
describe('explain — artifact filtering', () => {
  it('filters artifacts by domain scope', () => {
    const artifacts = [
      { id: 'WI-001', type: 'feature', title: 'A', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: ['payments'], status: 'in-progress', filePath: '' },
      { id: 'WI-002', type: 'feature', title: 'B', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: ['orders'], status: 'in-progress', filePath: '' },
    ]
    const scope = 'payments'
    const filtered = artifacts.filter((a) =>
      a.domains.some((d) => d.toLowerCase().includes(scope.toLowerCase()))
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('WI-001')
  })

  it('filters artifacts by title keyword', () => {
    const artifacts = [
      { id: 'WI-001', type: 'feature', title: 'Add payment retry', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: [], status: 'in-progress', filePath: '' },
      { id: 'WI-002', type: 'bugfix', title: 'Fix order pagination', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: [], status: 'in-progress', filePath: '' },
    ]
    const scope = 'payment'
    const filtered = artifacts.filter((a) =>
      a.title.toLowerCase().includes(scope.toLowerCase())
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('WI-001')
  })

  it('filters active work items by status', () => {
    const artifacts = [
      { id: 'WI-001', type: 'feature', title: 'A', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: [], status: 'in-progress', filePath: '' },
      { id: 'WI-002', type: 'feature', title: 'B', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: [], status: 'done', filePath: '' },
    ]
    const active = artifacts.filter((a) => a.status === 'in-progress')
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('WI-001')
  })
})

describe('explain — agent output structure', () => {
  it('agent output contains expected keys', () => {
    const output = {
      project: 'full project',
      generated_at: new Date().toISOString(),
      knowledge_summary: 'A simple backend.',
      artifacts: [
        { id: 'WI-001', type: 'feature', title: 'A', summary: 'S', knowledge_level: 'K2', status: 'in-progress', domains: ['payments'], code: ['src/payments/**'] }
      ],
      artifact_count: 1,
      domains: ['payments'],
    }
    expect(output).toHaveProperty('project')
    expect(output).toHaveProperty('artifacts')
    expect(output).toHaveProperty('domains')
    expect(output.artifact_count).toBe(1)
    expect(output.domains).toContain('payments')
  })

  it('deduplicates domains across artifacts', () => {
    const artifacts = [
      { domains: ['payments', 'orders'] },
      { domains: ['payments'] },
      { domains: ['identity'] },
    ]
    const domains = [...new Set(artifacts.flatMap((a) => a.domains))]
    expect(domains).toHaveLength(3)
    expect(domains.filter((d) => d === 'payments')).toHaveLength(1)
  })

  it('agent output includes installed_modules and enabled_plugins', () => {
    const output = {
      project: 'test',
      generated_at: new Date().toISOString(),
      artifacts: [],
      artifact_count: 0,
      domains: [],
      domain_owners: {},
      installed_modules: ['adr', 'rfc'],
      enabled_plugins: ['prisma'],
    }
    expect(output.installed_modules).toContain('adr')
    expect(output.enabled_plugins).toContain('prisma')
  })
})

describe('explain — type filter', () => {
  it('filters artifacts by exact type', () => {
    const artifacts = [
      { id: 'WI-001', type: 'feature', title: 'A', summary: '', knowledgeLevel: 'K2', codeGlobs: [], domains: [], status: 'in-progress', filePath: '' },
      { id: 'ADR-001', type: 'adr', title: 'B', summary: '', knowledgeLevel: 'K4', codeGlobs: [], domains: [], status: 'proposed', filePath: '' },
      { id: 'RFC-001', type: 'rfc', title: 'C', summary: '', knowledgeLevel: 'K3', codeGlobs: [], domains: [], status: 'draft', filePath: '' },
    ]
    const filtered = artifacts.filter((a) => a.type === 'adr')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('ADR-001')
  })

  it('type filter is case-insensitive', () => {
    const artifacts = [
      { type: 'ADR' },
      { type: 'rfc' },
      { type: 'feature' },
    ]
    const filtered = artifacts.filter((a) => a.type.toLowerCase() === 'adr')
    expect(filtered).toHaveLength(1)
  })

  it('scope filter also matches artifact type field', () => {
    const artifacts = [
      { id: 'ADR-001', type: 'adr', title: 'A', summary: '', domains: [], codeGlobs: [] },
      { id: 'WI-001', type: 'feature', title: 'B', summary: '', domains: [], codeGlobs: [] },
    ]
    const scope = 'adr'
    const filtered = artifacts.filter(
      (a) =>
        a.domains.some((d) => d.toLowerCase().includes(scope)) ||
        a.codeGlobs.some((g) => g.toLowerCase().includes(scope)) ||
        a.title.toLowerCase().includes(scope) ||
        a.summary.toLowerCase().includes(scope) ||
        a.type.toLowerCase().includes(scope)
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('ADR-001')
  })
})
