import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { generateQuestionsReport } from '../src/generate.js'
import { RESOURCES } from '../src/resources.js'
import { assertMcpDerivedWritePath, KaddoMcpError } from '../src/project.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function project() {
  root = makeProject()
  config(root, 'EventBoard')
  write(root, 'knowledge/product/product.md', '---\ntype: product\n---\n# P\n\n## Open Questions\n\n- ¿Se usará Fastify o NestJS?\n- ¿Habrá integración con Google Calendar?\n')
}

describe('MCP open questions / roadmap readiness (VS-064)', () => {
  it('AC1/AC3: kaddo://open-questions lists classified questions', () => {
    project()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://open-questions')!
    const json = JSON.parse(res.read(root)[0].text)
    expect(json.questions.length).toBe(2)
    expect(json.questions[0]).toHaveProperty('classification')
  })

  it('AC2/AC4/AC5: kaddo://roadmap-readiness summarizes readiness', () => {
    project()
    const res = RESOURCES.find((r) => r.uri === 'kaddo://roadmap-readiness')!
    const json = JSON.parse(res.read(root)[0].text)
    expect(json.roadmap_readiness).toBe('needs_decisions')
    expect(json.blocking_questions).toBe(1)
    expect(Array.isArray(json.suggested_assumptions)).toBe(true)
  })

  it('AC7/AC8/AC9/AC10: kaddo_generate_questions_report writes only under .kaddo/reports/', () => {
    project()
    const r = generateQuestionsReport(root, { format: 'markdown' })
    expect(r.files_written[0]).toBe('.kaddo/reports/questions-report.md')
    expect(fs.readFileSync(path.join(root, '.kaddo/reports/questions-report.md'), 'utf-8')).toContain('Open Questions Readiness Report')
    const j = generateQuestionsReport(root, { format: 'json' })
    expect(j.files_written[0]).toBe('.kaddo/reports/questions-report.json')
    expect(JSON.parse(fs.readFileSync(path.join(root, '.kaddo/reports/questions-report.json'), 'utf-8'))).toHaveProperty('summary.roadmap_readiness')
  })

  it('AC11/AC29: never writes outside .kaddo/reports/ and leaves knowledge untouched', () => {
    project()
    const before = fs.readFileSync(path.join(root, 'knowledge/product/product.md'), 'utf-8')
    generateQuestionsReport(root, { format: 'markdown' })
    expect(fs.readFileSync(path.join(root, 'knowledge/product/product.md'), 'utf-8')).toBe(before)
    expect(() => assertMcpDerivedWritePath('knowledge/product/product.md')).toThrow(KaddoMcpError)
  })
})
