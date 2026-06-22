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
    for (const sec of ['## Summary', '## Blocking Questions', '## Important Questions', '## Deferred Questions', '## Suggested Assumptions', '## Recommended Next Step']) {
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
