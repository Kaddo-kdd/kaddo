import { describe, it, expect } from 'vitest'
import {
  getLevel,
  getLevelForType,
  isValidType,
} from '../src/core/knowledge-levels.js'

describe('knowledge levels — type mapping', () => {
  it('hotfix maps to K1', () => {
    expect(getLevelForType('hotfix')).toBe('K1')
  })

  it('bugfix maps to K2', () => {
    expect(getLevelForType('bugfix')).toBe('K2')
  })

  it('feature maps to K2', () => {
    expect(getLevelForType('feature')).toBe('K2')
  })

  it('spike maps to K3', () => {
    expect(getLevelForType('spike')).toBe('K3')
  })
})

describe('knowledge levels — question count', () => {
  it('K0 has no questions', () => {
    expect(getLevel('K0').questions).toHaveLength(0)
  })

  it('K1 has exactly 2 questions', () => {
    expect(getLevel('K1').questions).toHaveLength(2)
  })

  it('K2 has exactly 4 questions', () => {
    expect(getLevel('K2').questions).toHaveLength(4)
  })

  it('K3 has exactly 4 questions', () => {
    expect(getLevel('K3').questions).toHaveLength(4)
  })

  it('K4 has exactly 4 questions', () => {
    expect(getLevel('K4').questions).toHaveLength(4)
  })
})

describe('knowledge levels — quality gates', () => {
  it('K0 has no quality gate', () => {
    expect(getLevel('K0').qualityGate).toHaveLength(0)
  })

  it('K2 quality gate includes acceptance criteria', () => {
    const gates = getLevel('K2').qualityGate.join(' ')
    expect(gates.toLowerCase()).toContain('acceptance criteria')
  })

  it('K4 quality gate includes risks', () => {
    const gates = getLevel('K4').qualityGate.join(' ')
    expect(gates.toLowerCase()).toContain('risks')
  })
})

describe('knowledge levels — type validation', () => {
  it('accepts valid types', () => {
    expect(isValidType('feature')).toBe(true)
    expect(isValidType('bugfix')).toBe(true)
    expect(isValidType('hotfix')).toBe(true)
    expect(isValidType('spike')).toBe(true)
  })

  it('rejects unknown types', () => {
    expect(isValidType('epic')).toBe(false)
    expect(isValidType('task')).toBe(false)
    expect(isValidType('')).toBe(false)
  })
})
