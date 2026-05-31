import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadIgnores, saveIgnore, isIgnored, removeIgnore } from '../src/services/ignore-store.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ignores-'))
  fs.mkdirSync(path.join(tmpDir, '.kaddo'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('ignore-store', () => {
  it('returns empty array when no ignore file exists', () => {
    expect(loadIgnores(tmpDir)).toEqual([])
  })

  it('saves and loads an ignore entry', () => {
    saveIgnore(tmpDir, {
      artifact_id: 'WI-001',
      reason: 'File was moved, not functionally changed',
      created_at: '2026-05-31',
      files: ['src/payments/payment.ts'],
    })
    const ignores = loadIgnores(tmpDir)
    expect(ignores).toHaveLength(1)
    expect(ignores[0].artifact_id).toBe('WI-001')
    expect(ignores[0].reason).toBe('File was moved, not functionally changed')
  })

  it('replaces existing entry for same artifact_id', () => {
    saveIgnore(tmpDir, { artifact_id: 'WI-001', reason: 'first', created_at: '2026-05-31', files: [] })
    saveIgnore(tmpDir, { artifact_id: 'WI-001', reason: 'updated', created_at: '2026-05-31', files: [] })
    const ignores = loadIgnores(tmpDir)
    expect(ignores).toHaveLength(1)
    expect(ignores[0].reason).toBe('updated')
  })

  it('saves multiple entries for different artifact ids', () => {
    saveIgnore(tmpDir, { artifact_id: 'WI-001', reason: 'reason 1', created_at: '2026-05-31', files: [] })
    saveIgnore(tmpDir, { artifact_id: 'WI-002', reason: 'reason 2', created_at: '2026-05-31', files: [] })
    expect(loadIgnores(tmpDir)).toHaveLength(2)
  })

  it('isIgnored returns entry when artifact is ignored', () => {
    saveIgnore(tmpDir, { artifact_id: 'WI-001', reason: 'test', created_at: '2026-05-31', files: [] })
    const ignores = loadIgnores(tmpDir)
    expect(isIgnored(ignores, 'WI-001')).toBeDefined()
    expect(isIgnored(ignores, 'WI-002')).toBeUndefined()
  })

  it('removeIgnore deletes entry and returns true', () => {
    saveIgnore(tmpDir, { artifact_id: 'WI-001', reason: 'test', created_at: '2026-05-31', files: [] })
    const removed = removeIgnore(tmpDir, 'WI-001')
    expect(removed).toBe(true)
    expect(loadIgnores(tmpDir)).toHaveLength(0)
  })

  it('removeIgnore returns false when entry does not exist', () => {
    const removed = removeIgnore(tmpDir, 'WI-999')
    expect(removed).toBe(false)
  })
})
