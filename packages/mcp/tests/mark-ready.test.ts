import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { markWorkItemReady } from '../src/tools.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

const DRAFT_WI = (id: string, extra = '') => [
  '---',
  `id: ${id}`,
  'type: bugfix',
  `title: ${id} title`,
  'status: draft',
  'domains:',
  '  - loyalty',
  'code:',
  '  - src/x.ts',
  'source:',
  '  type: manual',
  '  inferred: false',
  'refined_by: work-item-agent',
  'generated_by: kaddo-create',
  'template_version: 1',
  extra,
  '---',
  '',
  '## Problem',
  '',
  'Something broken.',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Fix it.',
  '',
  '## Validation',
  '',
  'Check it.',
].join('\n')

describe('markWorkItemReady (VS-088)', () => {
  it('AC16: returns not_found for unknown WI', () => {
    root = makeProject()
    config(root)
    const r = markWorkItemReady(root, 'WI-999')
    expect(r.ok).toBe(false)
  })

  it('AC15: idempotent if already ready', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/ready/WI-001.md', DRAFT_WI('WI-001').replace('status: draft', 'status: ready'))
    const r = markWorkItemReady(root, 'WI-001')
    expect(r.ok).toBe(true)
    expect((r as { data: { status: string } }).data.status).toBe('already_ready')
  })

  it('AC4: without confirm returns preview and does not modify files', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    const r = markWorkItemReady(root, 'WI-001')
    expect(r.ok).toBe(true)
    const data = (r as { data: Record<string, unknown> }).data
    expect(data.status).toBe('needs_confirmation')
    expect((data.workItem as { id: string }).id).toBe('WI-001')
    expect(fs.existsSync(path.join(root, 'knowledge/delivery/work-items/draft/WI-001.md'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'))).toBe(false)
  })

  it('AC5: with confirm transitions draft to ready', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    const r = markWorkItemReady(root, 'WI-001', true)
    expect(r.ok).toBe(true)
    const data = (r as { data: Record<string, unknown> }).data
    expect(data.status).toBe('ready')
    expect(data.from).toBe('draft')
    expect(data.to).toBe('ready')
  })

  it('AC6: moves file from draft/ to ready/', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    expect(fs.existsSync(path.join(root, 'knowledge/delivery/work-items/draft/WI-001.md'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'))).toBe(true)
  })

  it('AC7: creates ready/ if missing', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    const readyDir = path.join(root, 'knowledge/delivery/work-items/ready')
    expect(fs.existsSync(readyDir)).toBe(false)
    markWorkItemReady(root, 'WI-001', true)
    expect(fs.existsSync(readyDir)).toBe(true)
  })

  it('AC8: adds ready_at', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toMatch(/ready_at:.*\d{4}-\d{2}-\d{2}/)
  })

  it('AC9: preserves source', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toContain('type: manual')
  })

  it('AC10: preserves domains', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toContain('loyalty')
  })

  it('AC11: preserves code', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toContain('src/x.ts')
  })

  it('AC12-13: preserves generated_by and template_version', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toContain('generated_by: kaddo-create')
    expect(content).toContain('template_version: 1')
  })

  it('AC14: does not modify body', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-001.md', DRAFT_WI('WI-001'))
    markWorkItemReady(root, 'WI-001', true)
    const content = fs.readFileSync(path.join(root, 'knowledge/delivery/work-items/ready/WI-001.md'), 'utf-8')
    expect(content).toContain('Something broken.')
    expect(content).toContain('## Acceptance criteria')
  })

  it('AC17: returns warnings when readiness checks fail', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-002.md', [
      '---',
      'id: WI-002',
      'type: feature',
      'title: Minimal',
      'status: draft',
      'source:',
      '  type: manual',
      '---',
      '',
      '## Problem',
      '',
      'Something.',
    ].join('\n'))
    const r = markWorkItemReady(root, 'WI-002')
    expect(r.ok).toBe(true)
    const data = (r as { data: Record<string, unknown> }).data
    const wi = data.workItem as { readiness?: { warnings: string[] } }
    expect(wi.readiness!.warnings.length).toBeGreaterThan(0)
  })

  it('confirm with warnings returns ready_with_warnings', () => {
    root = makeProject()
    config(root)
    write(root, 'knowledge/delivery/work-items/draft/WI-002.md', [
      '---',
      'id: WI-002',
      'type: feature',
      'title: Minimal',
      'status: draft',
      'source:',
      '  type: manual',
      '---',
      '',
      '## Problem',
      '',
      'Something.',
    ].join('\n'))
    const r = markWorkItemReady(root, 'WI-002', true)
    expect(r.ok).toBe(true)
    const data = (r as { data: Record<string, unknown> }).data
    expect(data.status).toBe('ready_with_warnings')
    expect((data.warnings as string[]).length).toBeGreaterThan(0)
  })
})
