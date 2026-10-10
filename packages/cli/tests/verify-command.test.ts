import { describe, expect, it } from 'vitest'
import { extractACsFromBody } from '../src/commands/verify.js'

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
})
