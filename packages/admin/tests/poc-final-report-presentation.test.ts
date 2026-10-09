import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

const componentPath = path.resolve(__dirname, '../src/components/PocFinalReport.tsx')

describe('POC final report presentation', () => {
  it('renders all report states as read-only presentation', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    for (const state of ['missing', 'current', 'stale']) expect(source).toContain(state)
    expect(source).toContain('View report')
    expect(source).toContain('Selected sources')
    expect(source).not.toContain('mutationFn')
    expect(source).not.toContain('onClick')
  })
})
