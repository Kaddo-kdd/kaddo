import { describe, expect, it } from 'vitest'
import { buildACVerifications, extractACsFromBody } from '../src/commands/verify.js'
import { evaluateCompletion, type VerificationResult } from '../src/core/implementation-evidence.js'

describe('kaddo verify acceptance-criteria parsing', () => {
  it('preserves checkbox evidence in English and Spanish criteria sections', () => {
    const english = extractACsFromBody(['## Acceptance Criteria', '- [x] Verified behavior', '- [ ] Pending behavior', '', '## Validation'].join('\n'))
    const spanish = extractACsFromBody(['## Criterios de aceptación', '- [x] Comportamiento verificado', '- [ ] Comportamiento pendiente', '', '## Validación'].join('\n'))
    expect(english).toEqual([
      { criterion: 'Verified behavior', checked: true },
      { criterion: 'Pending behavior', checked: false },
    ])
    expect(spanish).toEqual([
      { criterion: 'Comportamiento verificado', checked: true },
      { criterion: 'Comportamiento pendiente', checked: false },
    ])
  })

  it('recognizes numbered English and Spanish headings', () => {
    for (const heading of ['## 15. Acceptance Criteria', '### 15. Criterios de aceptación']) {
      expect(extractACsFromBody([heading, '- [ ] Pending', '## Next'].join('\n'))).toEqual([{ criterion: 'Pending', checked: false }])
    }
  })

  it('requires persisted evidence and a reference instead of trusting a checkbox', () => {
    const criteria = extractACsFromBody(['## Acceptance Criteria', '- [x] Verified behavior'].join('\n'))
    expect(buildACVerifications(criteria, [])).toEqual([
      { criterion: 'Verified behavior', status: 'not-verified' },
    ])
    expect(buildACVerifications(criteria, [{
      criterion: 'Verified behavior', status: 'passed', evidence: 'Focused test passed',
    }])).toEqual([{
      criterion: 'Verified behavior', status: 'not-verified', evidence: 'Focused test passed',
    }])
    expect(buildACVerifications(criteria, [{
      criterion: 'Verified behavior', status: 'passed', evidence: 'Focused test passed',
      reference: 'packages/cli/tests/verify-command.test.ts', method: 'automated',
    }])).toEqual([{
      criterion: 'Verified behavior', status: 'passed', evidence: 'Focused test passed',
      reference: 'packages/cli/tests/verify-command.test.ts', method: 'automated',
    }])
  })

  it('does not declare completion without detected and verified evidence', () => {
    const base = { workItemId: 'WI-1', lifecycle: 'in-progress', implementationEvidence: { repositories: {} }, acVerifications: [], acSummary: { total: 0, passed: 0, failed: 0, notVerified: 0, manualReview: 0 }, releaseGates: [], completionExceptions: [], findings: [], plannedVsActual: null, implementationStatus: 'in-progress', validationStatus: 'not-started' } as VerificationResult
    expect(evaluateCompletion(base).readiness).toBe('NEEDS_WORK')
    const complete = { ...base, acVerifications: [{ criterion: 'Works', status: 'passed' as const }], acSummary: { total: 1, passed: 1, failed: 0, notVerified: 0, manualReview: 0 }, implementationStatus: 'completed' as const, validationStatus: 'passed' as const }
    expect(evaluateCompletion(complete).readiness).toBe('READY_TO_COMPLETE')
  })
})
