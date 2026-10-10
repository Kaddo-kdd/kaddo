import { describe, it, expect } from 'vitest'
import { deprecationView } from '../src/lib/deprecation-view'

const dep = (waves: string[][], blocked: { target: string; reason: string }[] = []) => ({ dependency: { waves, blocked } })

describe('WI-057 — progressive Deprecation detail', () => {
  it('a zero-target plan is Captured Intent: empty state only, no operational views (AC-01)', () => {
    const v = deprecationView({ targets: { length: 0 }, ...dep([]) })
    expect(v.stage).toBe('captured-intent')
    expect(v.showEmptyState).toBe(true)
    expect(v.showPipeline).toBe(false)
    expect(v.showBoard).toBe(false)
    expect(v.showEnvironmentMatrix).toBe(false)
    expect(v.showTargets).toBe(false)
    expect(v.showWaves).toBe(false)
  })

  it('a plan with targets shows pipeline/board/environment/targets (AC-04)', () => {
    const v = deprecationView({ targets: { length: 3 }, ...dep([['A', 'B', 'C']]) }) // one trivial wave
    expect(v.stage).toBe('targets')
    expect(v.showEmptyState).toBe(false)
    expect(v.showPipeline).toBe(true)
    expect(v.showBoard).toBe(true)
    expect(v.showEnvironmentMatrix).toBe(true)
    expect(v.showTargets).toBe(true)
  })

  it('retirement waves appear only with meaningful dependency structure (AC-05, AC-06)', () => {
    // First target, single wave -> waves hidden.
    expect(deprecationView({ targets: { length: 1 }, ...dep([['A']]) }).showWaves).toBe(false)
    // Dependency chain -> multiple waves -> shown.
    expect(deprecationView({ targets: { length: 3 }, ...dep([['A'], ['B'], ['C']]) }).showWaves).toBe(true)
    // Blocked targets (cycle/dangling) are meaningful even with one wave.
    expect(deprecationView({ targets: { length: 2 }, ...dep([['A']], [{ target: 'B', reason: 'cycle' }]) }).showWaves).toBe(true)
  })

  it('a refined/completed plan with ordered waves is fully operational — no regression (AC-07)', () => {
    const v = deprecationView({ targets: { length: 5 }, ...dep([['A', 'B'], ['C'], ['D', 'E']]) })
    expect(v.stage).toBe('analyzed')
    expect([v.showPipeline, v.showBoard, v.showEnvironmentMatrix, v.showTargets, v.showWaves]).toEqual([true, true, true, true, true])
    expect(v.showEmptyState).toBe(false)
  })
})
