import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildTechDecisions, parseDecisionCandidates, cleanCandidateTitle } from '../src/core/decisions.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { loadConfig } from '../src/core/config.js'
import { SKILLS } from '../src/skills/skills.js'

let dir: string
function write(rel: string, c: string) {
  const f = path.join(dir, rel)
  fs.mkdirSync(path.dirname(f), { recursive: true })
  fs.writeFileSync(f, c)
}
function config() {
  write('.kaddo/config.yml', 'version: 1\nproject:\n  name: d\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
const CANDIDATES = '# Decision Candidates\n\n## Shared secret for internal endpoints\n\n### Context\n...\n\n## Scheduled job orchestration\n\n### Context\n...\n'

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-dec-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('ADR candidate slug cleanup (VS-075.1)', () => {
  it('AC3/AC4: cleanCandidateTitle strips numeric/markdown list prefixes', () => {
    expect(cleanCandidateTitle('1. Seguridad Compartida')).toBe('Seguridad Compartida')
    expect(cleanCandidateTitle('2) Orquestación de Tareas')).toBe('Orquestación de Tareas')
    expect(cleanCandidateTitle('(3) Control de Webhooks')).toBe('Control de Webhooks')
    expect(cleanCandidateTitle('001. Something')).toBe('Something')
    expect(cleanCandidateTitle('## Heading title')).toBe('Heading title')
    expect(cleanCandidateTitle('- bulleted')).toBe('bulleted')
  })

  it('AC1/AC5/AC6: suggested ADR file has no duplicate numbering and normalizes acronyms', () => {
    const dirLocal = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-slug-'))
    fs.mkdirSync(path.join(dirLocal, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(dirLocal, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: d\n  state: pre-ai\n  structure: monorepo\n  language: es\nteam:\n  size: small\n')
    fs.mkdirSync(path.join(dirLocal, 'knowledge/tech'), { recursive: true })
    fs.writeFileSync(path.join(dirLocal, 'knowledge/tech/decision-candidates.md'), '# DC\n\n## 1. Seguridad Compartida para Microservicios Internos (INTERNAL_CRON_SECRET)\n\n## 2) Orquestación de Tareas Programadas (pg_cron vs Vercel Cron)\n')
    const td = buildTechDecisions(dirLocal)
    expect(td.candidate_list[0].title).toBe('Seguridad Compartida para Microservicios Internos (INTERNAL_CRON_SECRET)')
    expect(td.candidate_list[0].suggestedAdrFile).toBe('knowledge/tech/decisions/ADR-001-seguridad-compartida-para-microservicios-internos-internal-cron-secret.md')
    expect(td.candidate_list[1].suggestedAdrFile).toBe('knowledge/tech/decisions/ADR-002-orquestacion-de-tareas-programadas-pg-cron-vs-vercel-cron.md')
    for (const c of td.candidate_list) expect(c.suggestedAdrFile).not.toMatch(/ADR-00\d-\d-/)
    fs.rmSync(dirLocal, { recursive: true, force: true })
  })
})

describe('tech decisions detection (VS-075)', () => {
  it('AC2: parses candidate titles from decision-candidates.md', () => {
    expect(parseDecisionCandidates(CANDIDATES)).toEqual(['Shared secret for internal endpoints', 'Scheduled job orchestration'])
  })

  it('AC6: none when no candidates and no ADRs', () => {
    config()
    expect(buildTechDecisions(dir).status).toBe('none')
  })

  it('AC1/AC2/AC7/AC23/AC24: candidates when decision-candidates.md exists and no ADRs', () => {
    config()
    write('knowledge/tech/decision-candidates.md', CANDIDATES)
    const td = buildTechDecisions(dir)
    expect(td.status).toBe('candidates')
    expect(td.candidates).toBe(2)
    expect(td.candidate_list[0].suggestedAdrFile).toMatch(/^knowledge\/tech\/decisions\/ADR-001-/)
    expect(td.candidate_list[0].source).toBe('knowledge/tech/decision-candidates.md')
  })

  it('AC4/AC8: draft-adrs when an ADR draft exists', () => {
    config()
    write('knowledge/tech/decision-candidates.md', CANDIDATES)
    write('knowledge/tech/decisions/ADR-001-x.md', '---\ntype: adr\nstatus: draft\n---\n# ADR-001\n')
    const td = buildTechDecisions(dir)
    expect(td.status).toBe('draft-adrs')
    expect(td.adrs).toBe(1)
    expect(td.draft_adrs).toBe(1)
  })

  it('AC5/AC9: accepted-adrs when an ADR is accepted', () => {
    config()
    write('knowledge/tech/decisions/ADR-001-x.md', '---\ntype: adr\nstatus: accepted\n---\n# ADR-001\n')
    const td = buildTechDecisions(dir)
    expect(td.status).toBe('accepted-adrs')
    expect(td.accepted_adrs).toBe(1)
  })
})

describe('tech decisions surfaced in explain / context (VS-075)', () => {
  it('AC10: explain shows a Tech Decisions section + adr-writing recommendation', () => {
    config()
    write('knowledge/tech/decision-candidates.md', CANDIDATES)
    const md = renderExplanationHuman(buildProjectExplanation(dir))
    expect(md).toContain('## Tech Decisions')
    expect(md).toContain('Decision candidates: 2')
    expect(md).toContain('adr-writing')
  })

  it('AC11: context-pack carries techDecisions + a Missing Context note', () => {
    config()
    write('knowledge/tech/decision-candidates.md', CANDIDATES)
    const pack = buildContextPack(dir, loadConfig(dir)!)
    expect(pack.techDecisions.status).toBe('candidates')
    expect(pack.missing.some((m) => /decision candidate/i.test(m))).toBe(true)
  })
})

describe('adr command + skill (VS-075)', () => {
  it('AC22-AC24: kaddo adr lists candidates + suggested ADR files (read-only)', async () => {
    config()
    write('knowledge/tech/decision-candidates.md', CANDIDATES)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(process, 'cwd').mockReturnValue(dir)
    const { runAdr } = await import('../src/commands/adr.js')
    runAdr({})
    const out = logSpy.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(out).toContain('ADR candidates found')
    expect(out).toContain('Shared secret for internal endpoints')
    expect(out).toContain('ADR-001-')
    // No files created.
    expect(fs.existsSync(path.join(dir, 'knowledge/tech/decisions'))).toBe(false)
    vi.restoreAllMocks()
  })

  it('AC17-AC21: adr-writing skill documents ADR statuses + sections', () => {
    const s = SKILLS.find((k) => k.id === 'adr-writing')!.content
    for (const st of ['draft', 'accepted', 'superseded', 'deprecated']) expect(s).toContain(st)
    for (const sec of ['## Context', '## Options Considered', '## Decision', '## Consequences', '## Related Capabilities', '## Related Work Items']) {
      expect(s).toContain(sec)
    }
  })
})
