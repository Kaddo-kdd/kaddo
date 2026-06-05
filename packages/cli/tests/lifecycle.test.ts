import { describe, it, expect } from 'vitest'
import {
  LIFECYCLE_STATES,
  ACTIVE_STATES,
  HISTORICAL_STATES,
  LIFECYCLE_TRANSITIONS,
  lifecycleStateOf,
  lifecycleFolderOf,
  isActiveState,
  lifecycleCounts,
} from '../src/core/lifecycle.js'

describe('lifecycle — states', () => {
  it('defines the six official states', () => {
    expect([...LIFECYCLE_STATES]).toEqual([
      'draft',
      'ready',
      'in-progress',
      'blocked',
      'completed',
      'archived',
    ])
  })

  it('classifies active vs historical', () => {
    expect([...ACTIVE_STATES]).toEqual(['draft', 'ready', 'in-progress', 'blocked'])
    expect([...HISTORICAL_STATES]).toEqual(['completed', 'archived'])
    expect(isActiveState('in-progress')).toBe(true)
    expect(isActiveState('completed')).toBe(false)
  })

  it('encodes valid transitions', () => {
    expect(LIFECYCLE_TRANSITIONS['draft']).toEqual(['ready'])
    expect(LIFECYCLE_TRANSITIONS['in-progress']).toEqual(['completed', 'blocked'])
    expect(LIFECYCLE_TRANSITIONS['blocked']).toEqual(['ready'])
    expect(LIFECYCLE_TRANSITIONS['archived']).toEqual([])
  })
})

describe('lifecycle — state resolution', () => {
  it('uses a valid front-matter status first', () => {
    expect(lifecycleStateOf({ status: 'blocked' })).toBe('blocked')
    expect(lifecycleStateOf({ status: 'READY' })).toBe('ready')
  })

  it('maps legacy statuses for back-compat', () => {
    expect(lifecycleStateOf({ status: 'done' })).toBe('completed')
    expect(lifecycleStateOf({ status: 'cancelled' })).toBe('archived')
    expect(lifecycleStateOf({ status: 'in-progress' })).toBe('in-progress')
  })

  it('falls back to the lifecycle subfolder when status is missing', () => {
    expect(
      lifecycleStateOf({ filePath: '/p/knowledge/delivery/work-items/completed/WI-001.md' })
    ).toBe('completed')
    expect(
      lifecycleStateOf({ filePath: 'C:\\p\\knowledge\\delivery\\work-items\\ready\\WI-002.md' })
    ).toBe('ready')
  })

  it('treats a flat work-items/*.md with no recognizable status as ready', () => {
    expect(lifecycleStateOf({ filePath: '/p/knowledge/delivery/work-items/WI-009.md' })).toBe(
      'ready'
    )
    expect(lifecycleStateOf({})).toBe('ready')
  })

  it('lifecycleFolderOf only recognizes valid state folders', () => {
    expect(lifecycleFolderOf('/x/delivery/work-items/blocked/WI-1.md')).toBe('blocked')
    expect(lifecycleFolderOf('/x/delivery/work-items/misc/WI-1.md')).toBeNull()
    expect(lifecycleFolderOf('/x/delivery/work-items/WI-1.md')).toBeNull()
  })
})

describe('lifecycle — counts', () => {
  it('counts states with zeros for the rest', () => {
    const counts = lifecycleCounts(['ready', 'ready', 'in-progress'])
    expect(counts.ready).toBe(2)
    expect(counts['in-progress']).toBe(1)
    expect(counts.archived).toBe(0)
  })
})
