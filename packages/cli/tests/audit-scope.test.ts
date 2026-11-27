import { describe, it, expect } from 'vitest'
import { resolveAuditScope } from '../src/core/audit-scope.js'
import type { DiscoveredModuleRef } from '../src/core/audit-correlation.js'
import { runAudit } from '../src/core/audit-orchestrator.js'

// WI-096 (EP-001/INI-001, AUD-C3) — resolve a user selection into a validated AuditScope. Pure, honest
// (unknown module → error), modules/paths mutually exclusive, deterministic.

const modules: DiscoveredModuleRef[] = [
  { name: '@kaddo/cli', path: 'packages/cli' },
  { name: '@kaddo/admin', path: 'packages/admin' },
]

describe('audit scope resolution (WI-096)', () => {
  it('no selection → project (AC-02)', () => {
    expect(resolveAuditScope({}, modules)).toEqual({ kind: 'project' })
  })

  it('explicit project → project (AC-02)', () => {
    expect(resolveAuditScope({ project: true }, modules)).toEqual({ kind: 'project' })
  })

  it('module by short id resolves to the canonical name (AC-03)', () => {
    expect(resolveAuditScope({ modules: ['cli'] }, modules)).toEqual({ kind: 'module', modules: ['@kaddo/cli'] })
  })

  it('module by full package name resolves too (AC-03)', () => {
    expect(resolveAuditScope({ modules: ['@kaddo/admin'] }, modules)).toEqual({ kind: 'module', modules: ['@kaddo/admin'] })
  })

  it('multiple modules are deduped and sorted (AC-03/AC-07)', () => {
    expect(resolveAuditScope({ modules: ['admin', 'cli', '@kaddo/cli'] }, modules))
      .toEqual({ kind: 'module', modules: ['@kaddo/admin', '@kaddo/cli'] })
  })

  it('an unknown module throws, listing the valid modules — never silent whole-project (AC-04)', () => {
    expect(() => resolveAuditScope({ modules: ['nope'] }, modules))
      .toThrow(/Unknown module "nope"\. Valid modules: @kaddo\/admin, @kaddo\/cli\./)
  })

  it('paths are normalized, deduped and sorted (AC-05)', () => {
    expect(resolveAuditScope({ paths: ['src\\b.ts', 'src/a.ts', 'src/a.ts'] }, modules))
      .toEqual({ kind: 'paths', paths: ['src/a.ts', 'src/b.ts'] })
  })

  it('modules and paths together is an ambiguous-scope error (AC-06)', () => {
    expect(() => resolveAuditScope({ modules: ['cli'], paths: ['src/a.ts'] }, modules))
      .toThrow(/Ambiguous audit scope/)
  })

  it('is deterministic: same selection → same scope (AC-07)', () => {
    const sel = { modules: ['cli', 'admin'] }
    expect(resolveAuditScope(sel, modules)).toEqual(resolveAuditScope(sel, modules))
  })

  it('the resolved scope plugs into the orchestrator (AC-08)', async () => {
    const scope = resolveAuditScope({ modules: ['cli'] }, modules)
    const run = await runAudit({ id: 'AUD-001', createdAt: 't', scope, analyzers: [], context: { dir: '/x', scope } })
    expect(run.scope).toEqual({ kind: 'module', modules: ['@kaddo/cli'] })
  })

  it('is exported from the Core barrel (AC-08)', async () => {
    const core = await import('../src/core.js')
    expect(typeof core.resolveAuditScope).toBe('function')
  })
})
