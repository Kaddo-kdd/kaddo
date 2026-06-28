import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  buildOpenQuestionsReport,
  renderOpenQuestionsMarkdown,
  serializeOpenQuestionsJson,
  classifyQuestion,
  roadmapReadinessSummary,
} from '../src/core/open-questions.js'

let tmp: string
function write(rel: string, content: string) {
  const full = path.join(tmp, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}
function config(name = 'EventBoard') {
  write('.kaddo/config.yml', `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: es\nteam:\n  size: small\n`)
}
function withQuestions() {
  config()
  write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n\n## Open Questions\n\n- ¿EventBoard iniciará como API backend, aplicación web o CLI?\n- ¿Los sponsors tendrán niveles desde el inicio?\n- ¿Habrá integración con Google Calendar?\n')
  write('knowledge/tech/codebase.md', '---\ntype: codebase\n---\n# C\n\n## Open Questions\n\n- ¿Se usará Fastify o NestJS?\n')
}

beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-oq-')) })
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Open questions classification (VS-064)', () => {
  it('AC6/AC24: classifies blocking / important / deferred deterministically', () => {
    expect(classifyQuestion('¿Se usará Fastify o NestJS?').classification).toBe('blocking')
    expect(classifyQuestion('Will there be authentication in the MVP?').classification).toBe('blocking')
    expect(classifyQuestion('¿Los sponsors tendrán niveles?').classification).toBe('important')
    expect(classifyQuestion('¿Habrá integración con Google Calendar?').classification).toBe('deferred')
    // Ambiguous → important (conservative).
    expect(classifyQuestion('¿Qué color usaremos?').classification).toBe('important')
  })
})

describe('Open questions extraction + readiness (VS-064)', () => {
  it('AC3/AC23: extracts questions from product.md and codebase.md', () => {
    withQuestions()
    const r = buildOpenQuestionsReport(tmp)
    expect(r.summary.open_questions).toBe(4)
    expect(r.questions.some((q) => q.source === 'knowledge/product/product.md')).toBe(true)
    expect(r.questions.some((q) => q.source === 'knowledge/tech/codebase.md')).toBe(true)
    expect(r.questions[0].id).toBe('OQ-001')
  })

  it('AC4/AC5/AC25: needs_decisions when blocking questions exist + suggested assumptions', () => {
    withQuestions()
    const r = buildOpenQuestionsReport(tmp)
    expect(r.summary.roadmap_readiness).toBe('needs_decisions')
    expect(r.summary.blocking).toBe(2)
    expect(r.suggested_assumptions.length).toBe(2)
    expect(r.blocking_questions[0].suggested_assumption).toBeTruthy()
  })

  it('AC5/AC26: ready when no blocking, unknown when no questions', () => {
    config()
    write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n\n## Open Questions\n\n- ¿Los sponsors tendrán niveles?\n')
    expect(buildOpenQuestionsReport(tmp).summary.roadmap_readiness).toBe('ready')

    // Remove the questions section → no open questions at all → unknown.
    write('knowledge/product/product.md', '---\ntype: product\n---\n# P\n\nNo open questions here.\n')
    write('knowledge/business/business.md', '---\ntype: business\n---\n# B\n')
    expect(buildOpenQuestionsReport(tmp).summary.roadmap_readiness).toBe('unknown')
  })

  it('AC21/AC22: markdown + JSON have the expected sections/fields', () => {
    withQuestions()
    const r = buildOpenQuestionsReport(tmp)
    const md = renderOpenQuestionsMarkdown(r)
    for (const sec of ['## Summary', '## Blocking Open Questions', '## Important Questions', '## Resolved', '## Assumed (decisions to revisit)', '## Deferred (out of current scope)', '## Recommended Next Step']) {
      expect(md).toContain(sec)
    }
    const json = JSON.parse(serializeOpenQuestionsJson(r))
    expect(json).toHaveProperty('summary.roadmap_readiness')
    expect(json).toHaveProperty('blocking_questions')
    expect(json).toHaveProperty('suggested_assumptions')
    expect(json).toHaveProperty('recommended_next_step')
  })

  it('roadmapReadinessSummary is decision-oriented', () => {
    withQuestions()
    const s = roadmapReadinessSummary(tmp)
    expect(s.roadmap_readiness).toBe('needs_decisions')
    expect(s.blocking_questions).toBe(2)
    expect(s.recommended_next_step).toContain('before generating roadmap')
  })
})

describe('Open questions resolution tracking (VS-071)', () => {
  const oq = (body: string, lang = 'en') => {
    config()
    write(`knowledge/delivery/roadmap.md`, `---\ntype: roadmap\n---\n# R\n\n## ${lang === 'es' ? 'Preguntas abiertas' : 'Open Questions'}\n\n${body}\n`)
    return buildOpenQuestionsReport(tmp)
  }
  const q0 = (r: ReturnType<typeof buildOpenQuestionsReport>) => r.questions[0]

  it('AC1: a question with no token is open', () => {
    expect(q0(oq('- Should the CLI use a numeric id or a name?')).resolution_status).toBe('open')
  })

  it('AC2-AC5: EN tokens map to resolution status', () => {
    expect(q0(oq('- [open] Stack still undecided?')).resolution_status).toBe('open')
    expect(q0(oq('- [resolved] Stack is Node + SQLite.')).resolution_status).toBe('resolved')
    expect(q0(oq('- [assumed] Assume SQLite for the MVP persistence.')).resolution_status).toBe('assumed')
    expect(q0(oq('- [deferred] Remote sync is out of the MVP scope.')).resolution_status).toBe('deferred')
  })

  it('AC6-AC9: ES tokens map to resolution status', () => {
    expect(q0(oq('- [abierta] ¿Qué stack usar?', 'es')).resolution_status).toBe('open')
    expect(q0(oq('- [resuelta] El stack es Node + SQLite.', 'es')).resolution_status).toBe('resolved')
    expect(q0(oq('- [asumida] Se asume SQLite para el MVP.', 'es')).resolution_status).toBe('assumed')
    expect(q0(oq('- [diferida] Sync remoto fuera del MVP.', 'es')).resolution_status).toBe('deferred')
  })

  it('AC10: blocking + open blocks readiness', () => {
    const r = oq('- Which stack and architecture for the MVP?')
    expect(r.questions[0].classification).toBe('blocking')
    expect(r.summary.roadmap_readiness).toBe('needs_decisions')
    expect(r.summary.blocking_open).toBe(1)
  })

  it('AC11-AC13: blocking + resolved/assumed/deferred does not block readiness', () => {
    for (const tok of ['resolved', 'assumed', 'deferred']) {
      const r = oq(`- [${tok}] The MVP stack and architecture is Node + SQLite.`)
      expect(r.questions[0].classification).toBe('blocking')
      expect(r.summary.roadmap_readiness).toBe('ready')
      expect(r.summary.blocking_open).toBe(0)
    }
  })

  it('AC14/AC16: counts by resolution status', () => {
    const r = oq('- [resolved] A stack decision.\n- [assumed] An assumption about persistence.\n- [deferred] A deferred database integration.\n- An open architecture question?')
    expect(r.summary.resolution).toEqual({ open: 1, resolved: 1, assumed: 1, deferred: 1 })
  })

  it('AC15: JSON carries resolution_status and resolution_note', () => {
    const r = oq('- [assumed] Numeric id for CLI references.\n  - note: name is display-only')
    const json = JSON.parse(serializeOpenQuestionsJson(r))
    expect(json.questions[0].resolution_status).toBe('assumed')
    expect(json.questions[0].resolution_note).toBe('name is display-only')
  })

  it('AC17: markdown separates resolved / assumed / deferred', () => {
    const md = renderOpenQuestionsMarkdown(oq('- [resolved] Stack chosen.\n- [assumed] Persistence assumed.\n- [deferred] Sync deferred.'))
    expect(md).toContain('## Resolved')
    expect(md).toContain('## Assumed (decisions to revisit)')
    expect(md).toContain('## Deferred (out of current scope)')
  })

  it('AC18/AC19: readiness needs_decisions only with blocking open, else ready', () => {
    expect(oq('- Which architecture for the MVP?').summary.roadmap_readiness).toBe('needs_decisions')
    expect(oq('- [assumed] MVP architecture assumed as a backend API.').summary.roadmap_readiness).toBe('ready')
  })

  it('AC28: roadmapReadinessSummary exposes blocking_open and resolution counts', () => {
    config()
    write('knowledge/delivery/roadmap.md', '---\ntype: roadmap\n---\n# R\n\n## Open Questions\n\n- [resolved] MVP stack is Node + SQLite.\n')
    const s = roadmapReadinessSummary(tmp)
    expect(s.blocking_open).toBe(0)
    expect(s.resolution.resolved).toBe(1)
    expect(s.roadmap_readiness).toBe('ready')
  })
})
