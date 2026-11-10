import { describe, it, expect } from 'vitest'
import { extractACsFromBody } from '../src/commands/verify.js'

describe('extractACsFromBody — subsections and boundaries (WI-078)', () => {
  it('recognizes ACs grouped under subsections and stops at the next same-level heading', () => {
    const body = [
      '## 10. Acceptance Criteria',
      '',
      '### Lifecycle',
      '- [ ] AC-01: transitions are valid',
      '- [x] AC-02: invalid transitions rejected',
      '',
      '### Verification',
      '- [ ] AC-03: evidence persists',
      '- [ ] AC-04: no checkbox auto-pass',
      '',
      '## 11. Constraints',
      '- [ ] NOT-AN-AC: this belongs to Constraints',
    ].join('\n')
    const acs = extractACsFromBody(body)
    expect(acs.map((a) => a.criterion)).toEqual([
      'AC-01: transitions are valid',
      'AC-02: invalid transitions rejected',
      'AC-03: evidence persists',
      'AC-04: no checkbox auto-pass',
    ])
    expect(acs.find((a) => a.criterion.startsWith('AC-02'))?.checked).toBe(true)
    expect(acs.some((a) => a.criterion.includes('NOT-AN-AC'))).toBe(false)
  })

  it('stops at a higher-level heading too (deeper AC heading)', () => {
    const body = [
      '### Acceptance Criteria',
      '- [ ] AC-01: one',
      '## Later Section',
      '- [ ] nope',
    ].join('\n')
    expect(extractACsFromBody(body).map((a) => a.criterion)).toEqual(['AC-01: one'])
  })

  it('supports a flat (unsubsectioned) block — backward compatible', () => {
    const body = ['## Acceptance Criteria', '- [x] AC-01: done', '- [ ] AC-02: pending', '## Validation', '- [ ] x'].join('\n')
    const acs = extractACsFromBody(body)
    expect(acs.map((a) => a.criterion)).toEqual(['AC-01: done', 'AC-02: pending'])
  })

  it('supports Spanish and numbered headings', () => {
    const body = ['## 5. Criterios de Aceptación', '### Grupo', '- [ ] AC-01: algo', '## 6. Otra', '- [ ] no'].join('\n')
    expect(extractACsFromBody(body).map((a) => a.criterion)).toEqual(['AC-01: algo'])
  })

  it('does not treat a non-matching heading (e.g. "Acceptance Criteria Notes") as the block', () => {
    const body = ['## Acceptance Criteria Notes', '- [ ] not-an-ac', '## Acceptance Criteria', '- [ ] AC-01: real'].join('\n')
    expect(extractACsFromBody(body).map((a) => a.criterion)).toEqual(['AC-01: real'])
  })

  it('reads ACs to end of document when the block is the last section', () => {
    const body = ['## Acceptance Criteria', '### A', '- [ ] AC-01: a', '### B', '- [ ] AC-02: b'].join('\n')
    expect(extractACsFromBody(body).map((a) => a.criterion)).toEqual(['AC-01: a', 'AC-02: b'])
  })
})
