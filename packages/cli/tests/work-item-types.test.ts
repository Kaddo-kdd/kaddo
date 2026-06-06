import { describe, it, expect } from 'vitest'
import {
  WORK_ITEM_TYPES,
  isValidType,
  normalizeType,
  getLevelForType,
} from '../src/core/knowledge-levels.js'
import { resolveCandidateType, buildRoadmapWorkItem } from '../src/commands/create.js'
import type { RoadmapCandidateWorkItem } from '../src/core/roadmap.js'

function candidate(over: Partial<RoadmapCandidateWorkItem> = {}): RoadmapCandidateWorkItem {
  return {
    id: 'WI-CANDIDATE-001',
    title: 'Configure Vitest',
    rawMarkdown: '',
    ...over,
  }
}

describe('work item types — chore (VS-045)', () => {
  it('AC1: chore is an official type', () => {
    expect(WORK_ITEM_TYPES).toContain('chore')
    expect(isValidType('chore')).toBe(true)
    expect(getLevelForType('chore')).toBe('K1')
  })

  it('AC4: aliases resolve to chore', () => {
    for (const a of ['setup', 'maintenance', 'tooling', 'infrastructure', 'infra', 'refactor']) {
      expect(normalizeType(a)).toBe('chore')
    }
  })

  it('normalizeType keeps official types and rejects unknowns', () => {
    expect(normalizeType('feature')).toBe('feature')
    expect(normalizeType('CHORE')).toBe('chore')
    expect(normalizeType('epic')).toBeNull()
    expect(normalizeType(undefined)).toBeNull()
  })

  it('AC2: create --from roadmap accepts chore without asking', () => {
    expect(resolveCandidateType(candidate({ type: 'chore' }))).toBe('chore')
  })

  it('AC2: create --from roadmap resolves an alias to chore', () => {
    expect(resolveCandidateType(candidate({ type: 'tooling' }))).toBe('chore')
  })

  it('AC9: materializes a chore Work Item with type: chore', () => {
    const { content, fileName } = buildRoadmapWorkItem({
      id: 'WI-001',
      type: 'chore',
      level: getLevelForType('chore'),
      candidate: candidate({ type: 'chore', title: 'Configure Vitest' }),
    })
    expect(content).toContain('type: chore')
    expect(content).toContain('status: draft')
    expect(fileName).toBe('WI-001-configure-vitest.md')
  })
})
