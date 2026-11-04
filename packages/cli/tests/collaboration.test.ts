import { describe, expect, it } from 'vitest'
import { matchesWorkItemReference } from '../src/core/collaboration.js'

describe('Work Item collaboration correlation', () => {
  it('accepts an exact, case-insensitive Work Item token', () => {
    expect(matchesWorkItemReference('feat: complete WI-077 reporting', 'WI-077')).toBe(true)
    expect(matchesWorkItemReference('fix(wi-077): preserve assignments', 'WI-077')).toBe(true)
  })

  it('rejects prefixes, suffixes and file-only-like text', () => {
    expect(matchesWorkItemReference('feat: WI-0770 follow-up', 'WI-077')).toBe(false)
    expect(matchesWorkItemReference('feat: xWI-077 work', 'WI-077')).toBe(false)
    expect(matchesWorkItemReference('packages/component-WI-077.ts', 'WI-077')).toBe(false)
  })
})
