import { describe, it, expect } from 'vitest'
import { toDraft, toInput } from '../src/lib/resource-profiles'

describe('resource connection profiles (WI-069)', () => {
  it('toDraft turns API nulls into empty strings and preserves coordinates', () => {
    const drafts = toDraft([
      { environment: 'production', interface: 'sql', coordinates: [{ key: 'host', value: 'db.example.com' }] },
      { environment: null, interface: null, coordinates: [] },
    ])
    expect(drafts[0]).toEqual({ environment: 'production', interface: 'sql', coordinates: [{ key: 'host', value: 'db.example.com' }] })
    expect(drafts[1]).toEqual({ environment: '', interface: '', coordinates: [] })
  })

  it('toInput trims, drops empty coordinates and empty profiles', () => {
    const input = toInput([
      { environment: ' production ', interface: '', coordinates: [{ key: ' host ', value: ' db.example.com ' }, { key: '', value: '' }] },
      { environment: '', interface: '', coordinates: [{ key: '', value: '' }] }, // fully empty → dropped
    ])
    expect(input).toHaveLength(1)
    expect(input[0]).toEqual({ environment: 'production', interface: undefined, coordinates: [{ key: 'host', value: 'db.example.com' }] })
  })

  it('keeps a profile that has only an environment or interface, even with no coordinates', () => {
    const input = toInput([{ environment: 'staging', interface: '', coordinates: [] }])
    expect(input).toEqual([{ environment: 'staging', interface: undefined, coordinates: [] }])
  })
})
