import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { discoverProject, discoverKnowledge } from '@kaddo/cli/core'
import { getAuditAdmin } from '../src/audit-adapter.js'

// WI-102 regression: the audit store is validated atomically at the point of read, so a store directory
// swapped for an out-of-project symlink DURING isolated discovery (after the initial validation) is rejected
// before any file is read — it can no longer redirect the read outside the project (TOCTOU).
describe('audit storage race probe', () => {
  it('rejects an audit directory replaced (by an out-of-project symlink) after validation', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-storage-project-'))
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-storage-outside-'))
    const audits = path.join(root, '.kaddo', 'audits'), saved = path.join(root, '.kaddo', 'audits-saved')
    let swapped = false
    try {
      fs.mkdirSync(audits, { recursive: true })
      fs.writeFileSync(path.join(root, 'package.json'), '{"name":"fixture"}')
      const base = { id: 'AUD-001', createdAt: '2026-01-01T00:00:00Z', scope: { kind: 'project' }, status: 'completed', tools: [], coverage: { complete: true, evaluated: [], notEvaluated: [] }, findings: [], limitations: [] }
      fs.writeFileSync(path.join(audits, 'AUD-001.json'), JSON.stringify(base))
      fs.writeFileSync(path.join(outside, 'AUD-001.json'), JSON.stringify({ ...base, limitations: ['outside-sentinel'] }))
      const snapshot = { discovery: discoverProject(root), artifacts: discoverKnowledge(root), owners: {}, configured: true }
      // The store is swapped mid-discovery; the guarded read must reject it rather than leak the outside file.
      await expect(getAuditAdmin(root, 'AUD-001', {}, {}, async () => {
        fs.renameSync(audits, saved)
        fs.symlinkSync(outside, audits, process.platform === 'win32' ? 'junction' : 'dir')
        swapped = true
        return snapshot
      })).rejects.toThrow(/audit storage|audit file|outside project|symlinked/i)
    } finally {
      if (swapped) { fs.unlinkSync(audits); fs.renameSync(saved, audits) }
      fs.rmSync(root, { recursive: true, force: true })
      fs.rmSync(outside, { recursive: true, force: true })
    }
  })
})
