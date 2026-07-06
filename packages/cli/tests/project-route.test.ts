import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildProjectRoute, renderRouteMarkdown, renderRouteCompact } from '../src/core/project-route.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function writeConfig(state = 'pre-ai') {
  write('.kaddo/config.yml', [
    'version: 1',
    'project:',
    '  name: "demo"',
    `  state: ${state}`,
    '  structure: monorepo',
    'team:',
    '  size: indie',
  ].join('\n'))
}

function writeUseful(rel: string) {
  write(rel, [
    '---',
    'type: knowledge',
    '---',
    '',
    '# Real Knowledge',
    '',
    'This is a real useful knowledge artifact with enough content to pass the quality check.',
    'It contains meaningful information about the project that goes beyond placeholder text.',
    'The content is specific to this project and describes real technical decisions made by the team.',
    'Architecture patterns and domain models are documented here for future reference and alignment.',
    'Integration points between services are carefully described so that new team members can onboard.',
    '',
    '## Additional Details',
    '',
    'The system uses a microservices architecture with event-driven communication between bounded contexts.',
    'Each service owns its own database and exposes a well-defined API contract to other services.',
    'Deployment is automated through a continuous integration pipeline that runs tests and linting.',
    'The team follows trunk-based development with short-lived feature branches merged via pull requests.',
  ].join('\n'))
}

function writeWorkItem(id: string, status = 'draft') {
  write(`knowledge/delivery/work-items/${id}.md`, [
    '---',
    `id: ${id}`,
    `title: "Work Item ${id}"`,
    'type: feature',
    `status: ${status}`,
    '---',
    '',
    `# ${id}`,
  ].join('\n'))
}

function writeRoadmap(candidates = 3) {
  const lines = ['# Roadmap', '']
  for (let i = 1; i <= candidates; i++) {
    lines.push(`- WI-CANDIDATE-00${i}: Candidate ${i}`)
  }
  write('knowledge/delivery/roadmap.md', lines.join('\n'))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-route-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('buildProjectRoute (VS-080)', () => {
  it('AC1: builds route for new project', () => {
    writeConfig('new')
    const route = buildProjectRoute(tmpDir)
    expect(route.type).toBe('new')
    expect(route.steps.length).toBeGreaterThan(0)
  })

  it('AC2: builds route for pre-ai project', () => {
    writeConfig('pre-ai')
    const route = buildProjectRoute(tmpDir)
    expect(route.type).toBe('pre-ai')
    expect(route.steps.length).toBeGreaterThan(0)
  })

  it('AC3: builds route for legacy project', () => {
    writeConfig('legacy')
    const route = buildProjectRoute(tmpDir)
    expect(route.type).toBe('legacy')
    expect(route.steps.length).toBeGreaterThan(0)
  })

  it('AC4-9: route includes type, currentStep, completed, total, progressPercent, steps', () => {
    writeConfig('pre-ai')
    const route = buildProjectRoute(tmpDir)
    expect(route).toHaveProperty('type')
    expect(route).toHaveProperty('currentStep')
    expect(route).toHaveProperty('completed')
    expect(route).toHaveProperty('total')
    expect(route).toHaveProperty('progressPercent')
    expect(route).toHaveProperty('steps')
    expect(route.steps[0]).toHaveProperty('id')
    expect(route.steps[0]).toHaveProperty('label')
    expect(route.steps[0]).toHaveProperty('status')
  })

  it('AC18: pre-ai marks scan done when scan exists', () => {
    writeConfig('pre-ai')
    write('.kaddo/scan.json', '{}')
    const route = buildProjectRoute(tmpDir)
    const scan = route.steps.find((s) => s.id === 'scan-repository')
    expect(scan?.status).toBe('done')
  })

  it('AC19: pre-ai marks business done when useful', () => {
    writeConfig('pre-ai')
    writeUseful('knowledge/business/business.md')
    const route = buildProjectRoute(tmpDir)
    const biz = route.steps.find((s) => s.id === 'define-business')
    expect(biz?.status).toBe('done')
  })

  it('AC20: pre-ai marks product done when useful', () => {
    writeConfig('pre-ai')
    writeUseful('knowledge/product/product.md')
    const route = buildProjectRoute(tmpDir)
    const prod = route.steps.find((s) => s.id === 'define-product')
    expect(prod?.status).toBe('done')
  })

  it('AC21: pre-ai marks capabilities done when useful', () => {
    writeConfig('pre-ai')
    writeUseful('knowledge/product/capabilities.md')
    const route = buildProjectRoute(tmpDir)
    const cap = route.steps.find((s) => s.id === 'discover-capabilities')
    expect(cap?.status).toBe('done')
  })

  it('AC22: pre-ai marks architecture done when both files useful', () => {
    writeConfig('pre-ai')
    writeUseful('knowledge/tech/current-state.md')
    writeUseful('knowledge/tech/codebase.md')
    const route = buildProjectRoute(tmpDir)
    const arch = route.steps.find((s) => s.id === 'describe-architecture')
    expect(arch?.status).toBe('done')
  })

  it('AC23: marks technical decisions warning when candidates exist but no ADRs', () => {
    writeConfig('pre-ai')
    write('knowledge/tech/decision-candidates.md', '# Decision Candidates\n\n## 1. Use Redis\n\n### Context\nfoo\n')
    const route = buildProjectRoute(tmpDir)
    const td = route.steps.find((s) => s.id === 'capture-technical-decisions')
    expect(td?.status).toBe('warning')
  })

  it('AC24: marks materialize done when a Work Item exists', () => {
    writeConfig('pre-ai')
    writeWorkItem('WI-001')
    const route = buildProjectRoute(tmpDir)
    const mat = route.steps.find((s) => s.id === 'materialize-work-item')
    expect(mat?.status).toBe('done')
  })

  it('AC25: marks refine current when draft exists', () => {
    writeConfig('pre-ai')
    writeWorkItem('WI-001', 'draft')
    const route = buildProjectRoute(tmpDir)
    const ref = route.steps.find((s) => s.id === 'refine-work-item')
    expect(ref?.status).toBe('current')
  })

  it('AC26: marks ownership next when coverage < 100%', () => {
    writeConfig('pre-ai')
    writeWorkItem('WI-001', 'ready')
    const route = buildProjectRoute(tmpDir)
    const own = route.steps.find((s) => s.id === 'suggest-ownership')
    expect(own?.status).toBe('next')
  })

  it('AC27: currentStep aligns with nextStepRecommendation', () => {
    writeConfig('pre-ai')
    const route = buildProjectRoute(tmpDir)
    const current = route.steps.find((s) => s.status === 'current')
    expect(current).toBeDefined()
    expect(route.currentStep).toBe(current!.id)
  })

  it('completed count and progressPercent are correct', () => {
    writeConfig('pre-ai')
    write('.kaddo/scan.json', '{}')
    writeUseful('knowledge/business/business.md')
    const route = buildProjectRoute(tmpDir)
    const done = route.steps.filter((s) => s.status === 'done').length
    expect(route.completed).toBe(done)
    expect(route.progressPercent).toBe(Math.round((done / route.total) * 100))
  })
})

describe('route rendering (VS-080)', () => {
  it('AC28: renderRouteMarkdown includes Project Route', () => {
    writeConfig('pre-ai')
    const md = renderRouteMarkdown(buildProjectRoute(tmpDir))
    expect(md).toContain('## Project Route')
    expect(md).toContain('Route: pre-ai')
    expect(md).toContain('Progress:')
  })

  it('renderRouteCompact includes current step and warnings', () => {
    writeConfig('pre-ai')
    write('knowledge/tech/decision-candidates.md', '# Decision Candidates\n\n## 1. Use Redis\n\n### Context\nfoo\n')
    const compact = renderRouteCompact(buildProjectRoute(tmpDir))
    expect(compact).toContain('Route: pre-ai')
    expect(compact).toContain('Current:')
  })

  it('steps can include reason, command, agent, skill, evidence', () => {
    writeConfig('pre-ai')
    write('knowledge/tech/decision-candidates.md', '# Decision Candidates\n\n## 1. Use Redis\n\n### Context\nfoo\n')
    writeWorkItem('WI-001', 'draft')
    const route = buildProjectRoute(tmpDir)
    const td = route.steps.find((s) => s.id === 'capture-technical-decisions')!
    expect(td.reason).toBeDefined()
    expect(td.command).toBe('kaddo adr')
    expect(td.skill).toBe('adr-writing')
    const ref = route.steps.find((s) => s.id === 'refine-work-item')!
    expect(ref.agent).toBe('work-item-agent')
    const enable = route.steps.find((s) => s.id === 'enable-kaddo')!
    expect(enable.evidence).toBeDefined()
  })
})
