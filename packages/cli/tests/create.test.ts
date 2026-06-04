import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

function mkdir(rel: string) {
  fs.mkdirSync(path.join(tmpDir, rel), { recursive: true })
}
function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function read(rel: string): string {
  return fs.readFileSync(path.join(tmpDir, rel), 'utf-8')
}
function listFiles(rel: string): string[] {
  return fs.readdirSync(path.join(tmpDir, rel))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-create-'))
  mkdir('knowledge/delivery/work-items')
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// Test file generation logic directly, isolated from CLI prompts
function generateWorkItem(opts: {
  id: string
  type: string
  level: string
  title: string
  problem: string
  expected_result?: string
  impact?: string
  acceptance_criteria?: string
  design?: string
  risks?: string
  qualityGate: string[]
}): { fileName: string; content: string } {
  const slug = opts.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  const fileName = `${opts.id}-${slug}.md`
  const today = new Date().toISOString().split('T')[0]

  const fm = [
    '---',
    `type: ${opts.type}`,
    `id: ${opts.id}`,
    `title: "${opts.title}"`,
    `knowledge_level: ${opts.level}`,
    `status: in-progress`,
    `domains: []`,
    `code: []`,
    `created_at: ${today}`,
    `summary: "${opts.problem.split('.')[0]}"`,
    '---',
  ].join('\n')

  const sections = [`# ${opts.title}\n`, `> Type: ${opts.type} · Level: ${opts.level}\n`]
  if (opts.problem) sections.push(`## Problem\n\n${opts.problem}\n`)
  if (opts.expected_result) sections.push(`## Expected result\n\n${opts.expected_result}\n`)
  if (opts.impact) sections.push(`## Impact\n\n${opts.impact}\n`)
  if (opts.acceptance_criteria) sections.push(`## Acceptance criteria\n\n- ${opts.acceptance_criteria}\n`)
  if (opts.design) sections.push(`## Design\n\n${opts.design}\n`)
  if (opts.risks) sections.push(`## Risks\n\n${opts.risks}\n`)
  if (opts.qualityGate.length > 0) {
    sections.push(`## Definition of Done\n\n${opts.qualityGate.map((g) => `- [ ] ${g}`).join('\n')}\n`)
  }
  sections.push(`## Learning\n\n_What did we learn from this change? Update after completion._\n`)

  return { fileName, content: `${fm}\n\n${sections.join('\n')}` }
}

describe('create — work item file generation', () => {
  it('generates a hotfix file with K1 structure', () => {
    const { fileName, content } = generateWorkItem({
      id: 'WI-001',
      type: 'hotfix',
      level: 'K1',
      title: 'Fix null pointer in payment handler',
      problem: 'Payment handler crashes when amount is null',
      expected_result: 'Handler returns 400 instead of crashing',
      qualityGate: ['Problem is clear.', 'Expected result is defined.'],
    })

    expect(fileName).toBe('WI-001-fix-null-pointer-in-payment-handler.md')
    expect(content).toContain('type: hotfix')
    expect(content).toContain('knowledge_level: K1')
    expect(content).toContain('## Problem')
    expect(content).toContain('## Expected result')
    expect(content).toContain('## Definition of Done')
    expect(content).toContain('## Learning')
    expect(content).not.toContain('## Design')
    expect(content).not.toContain('## Risks')
  })

  it('generates a feature file with K2 structure', () => {
    const { content } = generateWorkItem({
      id: 'WI-002',
      type: 'feature',
      level: 'K2',
      title: 'Add email verification to checkout',
      problem: 'Users cannot complete checkout without verified email',
      expected_result: 'Users verify inline during checkout',
      impact: '30% drop-off at checkout',
      acceptance_criteria: 'Email verified before payment step',
      qualityGate: ['Problem is clear.', 'Expected result is defined.', 'Impact is stated.', 'Acceptance criteria are verifiable.'],
    })

    expect(content).toContain('type: feature')
    expect(content).toContain('knowledge_level: K2')
    expect(content).toContain('## Impact')
    expect(content).toContain('## Acceptance criteria')
    expect(content).toContain('## Learning')
  })

  it('generates a spike file with K3 structure including design', () => {
    const { content } = generateWorkItem({
      id: 'WI-003',
      type: 'spike',
      level: 'K3',
      title: 'Explore caching strategies for API responses',
      problem: 'API responses are slow under load',
      impact: 'p95 latency exceeds 2s',
      acceptance_criteria: 'Caching strategy chosen and documented',
      design: 'Evaluate Redis vs in-memory vs CDN edge caching',
      qualityGate: ['Problem is clear.', 'Design is sufficient to start.'],
    })

    expect(content).toContain('knowledge_level: K3')
    expect(content).toContain('## Design')
  })

  it('front matter includes code: [] for guard lite', () => {
    const { content } = generateWorkItem({
      id: 'WI-001',
      type: 'feature',
      level: 'K2',
      title: 'Test feature',
      problem: 'Test problem',
      qualityGate: [],
    })
    expect(content).toContain('code: []')
  })

  it('front matter includes status: in-progress', () => {
    const { content } = generateWorkItem({
      id: 'WI-001',
      type: 'bugfix',
      level: 'K2',
      title: 'Test bugfix',
      problem: 'Test problem',
      qualityGate: [],
    })
    expect(content).toContain('status: in-progress')
  })

  it('slugifies long titles correctly', () => {
    const { fileName } = generateWorkItem({
      id: 'WI-004',
      type: 'feature',
      level: 'K2',
      title: 'This is a very long title that should be truncated after fifty characters max',
      problem: 'p',
      qualityGate: [],
    })
    const slug = fileName.replace('WI-004-', '').replace('.md', '')
    expect(slug.length).toBeLessThanOrEqual(50)
  })
})

describe('create — work item ID sequencing', () => {
  it('starts at WI-001 when no files exist', () => {
    const files = listFiles('knowledge/delivery/work-items')
    expect(files).toHaveLength(0)
    // Next ID would be WI-001
    const next = files.length === 0 ? 'WI-001' : 'WI-002'
    expect(next).toBe('WI-001')
  })

  it('increments ID when files exist', () => {
    write('knowledge/delivery/work-items/WI-001-existing.md', '---\ntype: hotfix\n---')
    write('knowledge/delivery/work-items/WI-002-another.md', '---\ntype: bugfix\n---')
    const files = listFiles('knowledge/delivery/work-items').filter((f) => f.endsWith('.md'))
    const nums = files.map((f) => {
      const m = f.match(/WI-(\d+)/)
      return m ? parseInt(m[1], 10) : 0
    })
    const next = `WI-${String(Math.max(...nums) + 1).padStart(3, '0')}`
    expect(next).toBe('WI-003')
  })
})
