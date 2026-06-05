import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseRoadmapCandidates } from '../src/core/roadmap.js'
import {
  runCreate,
  buildRoadmapWorkItem,
  resolveCandidateType,
  resolveCandidateLevel,
} from '../src/commands/create.js'

const ROADMAP = `---
type: roadmap
---

# Roadmap

Generated with Kaddo Roadmap Agent.

## Initiatives

### RM-001: Establish capability baseline

**Goal:**
Document the main capabilities.

**Related capabilities:**
- Candidate: customer management
- Candidate: points management

**Project area / domain:** loyalty

**Impact:** High

**Risk:** Low

**Dependencies:**
- Validate capabilities with product owner.

**Candidate Work Items:**

- WI-CANDIDATE-001: Validate customer and points capabilities
  - type: spike
  - suggested knowledge level: K2
  - expected value: reduce ambiguity before further development
  - notes: validate with product owner

**Open questions:**
- Are customers and points the same domain?

### RM-002: Define ownership for loyalty points

**Impact:** Medium

**Candidate Work Items:**

- WI-CANDIDATE-002: Map domain owners
  - type: feature
  - suggested knowledge level: K2
  - expected value: clarify accountability
- WI-CANDIDATE-003: Audit points expiration rules
  - type: bugfix
`

describe('roadmap parser', () => {
  it('parses a single candidate with all properties', () => {
    const c = parseRoadmapCandidates(ROADMAP).find((x) => x.id === 'WI-CANDIDATE-001')!
    expect(c).toBeTruthy()
    expect(c.title).toBe('Validate customer and points capabilities')
    expect(c.type).toBe('spike')
    expect(c.suggestedKnowledgeLevel).toBe('K2')
    expect(c.expectedValue).toBe('reduce ambiguity before further development')
    expect(c.notes).toBe('validate with product owner')
  })

  it('parses multiple candidates across initiatives', () => {
    const all = parseRoadmapCandidates(ROADMAP)
    expect(all.map((c) => c.id)).toEqual([
      'WI-CANDIDATE-001',
      'WI-CANDIDATE-002',
      'WI-CANDIDATE-003',
    ])
  })

  it('attaches the parent initiative to each candidate', () => {
    const all = parseRoadmapCandidates(ROADMAP)
    expect(all[0].initiative).toEqual({ id: 'RM-001', title: 'Establish capability baseline' })
    expect(all[1].initiative?.id).toBe('RM-002')
  })

  it('inherits initiative-level metadata (impact, risk, capabilities, domain, deps)', () => {
    const c = parseRoadmapCandidates(ROADMAP)[0]
    expect(c.impact).toBe('High')
    expect(c.risk).toBe('Low')
    expect(c.domain).toBe('loyalty')
    expect(c.relatedCapabilities).toEqual(['customer management', 'points management'])
    expect(c.dependencies).toEqual(['Validate capabilities with product owner.'])
    expect(c.openQuestions).toEqual(['Are customers and points the same domain?'])
  })

  it('keeps a raw markdown excerpt', () => {
    const c = parseRoadmapCandidates(ROADMAP)[0]
    expect(c.rawMarkdown).toContain('WI-CANDIDATE-001')
    expect(c.rawMarkdown).toContain('type: spike')
  })

  it('returns an empty array when there are no candidates', () => {
    expect(parseRoadmapCandidates('# Roadmap\n\n## Summary\n\nNothing here.')).toEqual([])
  })

  it('handles a candidate with no type', () => {
    const c = parseRoadmapCandidates(ROADMAP).find((x) => x.id === 'WI-CANDIDATE-003')!
    expect(c.type).toBe('bugfix')
    const noType = parseRoadmapCandidates(
      '### RM-009: X\n\n**Candidate Work Items:**\n\n- WI-CANDIDATE-009: Something\n'
    )[0]
    expect(noType.type).toBeUndefined()
  })
})

describe('candidate type / level resolution', () => {
  it('uses the candidate type when valid', () => {
    const c = parseRoadmapCandidates(ROADMAP)[0]
    expect(resolveCandidateType(c)).toBe('spike')
  })

  it('falls back to the CLI type when candidate type is invalid', () => {
    const c = { id: 'WI-CANDIDATE-X', title: 'X', type: 'epic', rawMarkdown: '' }
    expect(resolveCandidateType(c, 'feature')).toBe('feature')
  })

  it('returns null when no valid type can be resolved', () => {
    const c = { id: 'WI-CANDIDATE-X', title: 'X', type: 'epic', rawMarkdown: '' }
    expect(resolveCandidateType(c)).toBeNull()
  })

  it('prefers the suggested knowledge level when valid', () => {
    const c = { id: 'X', title: 'X', suggestedKnowledgeLevel: 'K4', rawMarkdown: '' }
    expect(resolveCandidateLevel(c, 'feature')).toBe('K4')
  })

  it('derives the level from type when no suggestion', () => {
    const c = { id: 'X', title: 'X', rawMarkdown: '' }
    expect(resolveCandidateLevel(c, 'hotfix')).toBe('K1')
    expect(resolveCandidateLevel(c, 'spike')).toBe('K3')
  })
})

describe('buildRoadmapWorkItem', () => {
  const candidate = parseRoadmapCandidates(ROADMAP)[0]

  it('produces a file name with id and slug', () => {
    const { fileName } = buildRoadmapWorkItem({
      id: 'WI-001',
      type: 'spike',
      level: 'K2',
      candidate,
    })
    expect(fileName).toBe('WI-001-validate-customer-and-points-capabilities.md')
  })

  it('includes source traceability in front matter', () => {
    const { content } = buildRoadmapWorkItem({
      id: 'WI-001',
      type: 'spike',
      level: 'K2',
      candidate,
    })
    expect(content).toContain('source: roadmap')
    expect(content).toContain('source_id: WI-CANDIDATE-001')
    expect(content).toContain('source_initiative: RM-001')
    expect(content).toContain('type: spike')
    expect(content).toContain('knowledge_level: K2')
    expect(content).toContain('status: in-progress')
  })

  it('inherits roadmap context into the body', () => {
    const { content } = buildRoadmapWorkItem({
      id: 'WI-001',
      type: 'spike',
      level: 'K2',
      candidate,
    })
    expect(content).toContain('## Source')
    expect(content).toContain('- Candidate: WI-CANDIDATE-001')
    expect(content).toContain('Initiative: RM-001 — Establish capability baseline')
    expect(content).toContain('## Expected Value')
    expect(content).toContain('reduce ambiguity before further development')
    expect(content).toContain('## Context From Roadmap')
    expect(content).toContain('## Notes')
    expect(content).toContain('validate with product owner')
    expect(content).toContain('## Learning')
  })

  it('renders provided answers for missing fields', () => {
    const { content } = buildRoadmapWorkItem({
      id: 'WI-002',
      type: 'feature',
      level: 'K2',
      candidate,
      answers: { problem: 'Capabilities are ambiguous', acceptance_criteria: 'Customer validated\nPoints validated' },
    })
    expect(content).toContain('## Problem')
    expect(content).toContain('Capabilities are ambiguous')
    expect(content).toContain('## Acceptance Criteria')
    expect(content).toContain('- Customer validated')
    expect(content).toContain('- Points validated')
  })
})

describe('kaddo create --from roadmap — command guards', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-from-roadmap-'))
    fs.mkdirSync(path.join(tmpDir, 'knowledge', 'delivery', 'work-items'), { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('errors when knowledge/delivery/roadmap.md is missing', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    await expect(runCreate('', { from: 'roadmap' })).rejects.toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No roadmap found'))
  })

  it('errors when the roadmap has no candidates', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'knowledge', 'delivery', 'roadmap.md'),
      '# Roadmap\n\n## Summary\n\nNo candidates here.'
    )
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    await expect(runCreate('', { from: 'roadmap' })).rejects.toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No candidate work items found'))
  })

  it('rejects an unknown type without --from (existing behavior)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)

    await expect(runCreate('nonsense')).rejects.toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown work item type'))
  })
})

describe('roadmap parser — flexible formats (VS flexible-roadmap-parsing)', () => {
  it('AC2: table-based roadmap with Depends on column', () => {
    const md = [
      '### Initiative 1 — Project Foundation',
      '',
      '| ID | Work Item | Depends on |',
      '|----|-----------|------------|',
      '| WI-001 | Initialize TypeScript CLI project | — |',
      '| WI-002 | Configure Vitest | WI-001 |',
    ].join('\n')
    const c = parseRoadmapCandidates(md)
    expect(c.map((x) => x.id)).toEqual(['WI-001', 'WI-002'])
    expect(c[0].title).toBe('Initialize TypeScript CLI project')
    expect(c[0].initiative?.title).toContain('Project Foundation')
    expect(c[1].dependencies).toEqual(['WI-001'])
  })

  it('AC3: bullet-based roadmap', () => {
    const md = '## Plan\n- WI-001 Initialize CLI\n- WI-002: Configure tests\n'
    const c = parseRoadmapCandidates(md)
    expect(c.map((x) => x.id)).toEqual(['WI-001', 'WI-002'])
    expect(c[0].title).toBe('Initialize CLI')
    expect(c[1].title).toBe('Configure tests')
  })

  it('AC4: checklist-based roadmap', () => {
    const md = '## Plan\n- [ ] WI-001 Initialize CLI\n- [x] WI-002 Configure tests\n'
    const c = parseRoadmapCandidates(md)
    expect(c.map((x) => x.id)).toEqual(['WI-001', 'WI-002'])
  })

  it('dedupes ids and keeps the first occurrence', () => {
    const md = '- WI-001 First\n- WI-001 Duplicate\n'
    const c = parseRoadmapCandidates(md)
    expect(c).toHaveLength(1)
    expect(c[0].title).toBe('First')
  })

  it('AC12: VS-010 candidate-style still parsed (strict wins)', () => {
    const c = parseRoadmapCandidates(ROADMAP)
    expect(c.some((x) => x.id === 'WI-CANDIDATE-001')).toBe(true)
  })
})

describe('roadmapStats', () => {
  it('counts candidates vs materialized vs remaining', async () => {
    const { roadmapStats } = await import('../src/core/roadmap.js')
    const md = '- WI-001 a\n- WI-002 b\n- WI-003 c\n'
    expect(roadmapStats(md, 1)).toEqual({
      present: true,
      candidates: 3,
      materialized: 1,
      remaining: 2,
    })
    expect(roadmapStats(null, 0)).toEqual({
      present: false,
      candidates: 0,
      materialized: 0,
      remaining: 0,
    })
  })
})
