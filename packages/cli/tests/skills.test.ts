import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { runAdd } from '../src/commands/add.js'
import { SKILLS, SKILL_GROUPS, selectSkills } from '../src/skills/skills.js'
import { discoverInstalledSkills, skillsForAgents } from '../src/services/installed-skills.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { withResponsibilityTrace } from '../src/agents/responsibility.js'

let tmp: string
function config(name = 'demo') {
  fs.mkdirSync(path.join(tmp, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(tmp, '.kaddo/config.yml'),
    `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`
  )
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-skills-'))
})
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('Skills layer (VS-059)', () => {
  it('AC7/AC8: the seven initial skills exist with standard front matter', () => {
    const ids = SKILLS.map((s) => s.id).sort()
    expect(ids).toEqual(
      [
        'adr-writing',
        'capsule-writing',
        'graph-metadata-review',
        'implementation-planning',
        'learning-capture',
        'ownership-suggestion',
        'work-item-refinement',
      ].sort()
    )
    for (const s of SKILLS) {
      expect(s.content).toContain('type: skill')
      expect(s.content).toContain(`id: ${s.id}`)
      expect(s.content).toContain('applies_to:')
      expect(s.content).toMatch(/## Purpose/)
      expect(s.content).toMatch(/## Rules/)
    }
  })

  it('AC3: kaddo add skills installs the recommended set (delivery + tech, not integration)', () => {
    config()
    runAdd('skills', {}, tmp)
    const installed = discoverInstalledSkills(tmp).map((s) => s.id)
    expect(installed).toEqual(expect.arrayContaining([...SKILL_GROUPS.delivery, ...SKILL_GROUPS.tech]))
    expect(installed).not.toContain('capsule-writing') // integration not in recommended
  })

  it('AC4: kaddo add skills --all installs every skill', () => {
    config()
    runAdd('skills', { all: true }, tmp)
    expect(discoverInstalledSkills(tmp)).toHaveLength(SKILLS.length)
  })

  it('AC5/AC6: kaddo add skills --group installs only that group', () => {
    config()
    runAdd('skills', { group: 'integration' }, tmp)
    expect(discoverInstalledSkills(tmp).map((s) => s.id)).toEqual(['capsule-writing'])
  })

  it('selectSkills rejects unknown groups', () => {
    expect(() => selectSkills({ group: 'nope' })).toThrow(/Unknown skill group/)
  })

  it('AC10: context shows a skills summary (ids only, not full content)', () => {
    config()
    runAdd('skills', { all: true }, tmp)
    const pack = buildContextPack(tmp, loadConfig(tmp)!)
    expect(pack.skills).toContain('adr-writing')
    const md = renderContextPack(pack)
    expect(md).toContain('## Skills')
    expect(md).toContain('- adr-writing')
    expect(md).not.toContain('## Quality checklist') // full skill content not inlined
  })

  it('AC11: explain shows installed skill count + groups', () => {
    config()
    runAdd('skills', { all: true }, tmp)
    const exp = buildProjectExplanation(tmp)
    expect(exp.skills.total).toBe(SKILLS.length)
    const out = renderExplanationHuman(exp)
    expect(out).toContain(`## Skills installed: ${SKILLS.length}`)
    expect(out).toContain('delivery:')
  })

  it('AC9: agent prompts reference the skills they should apply', () => {
    const wi = withResponsibilityTrace('work-item-agent.md', '# Work Item Agent\n')
    expect(wi).toContain('## Reusable Skills')
    expect(wi).toContain('work-item-refinement')
    const graph = withResponsibilityTrace('graph-agent.md', '# Graph Agent\n')
    expect(graph).toContain('graph-metadata-review')
  })

  it('AC12: understand recommends skills for the recommended agents', () => {
    config()
    runAdd('skills', { all: true }, tmp)
    const installed = discoverInstalledSkills(tmp)
    const recs = skillsForAgents(installed, ['work-item-agent'])
    expect(recs).toContain('work-item-refinement')
    expect(recs).toContain('ownership-suggestion')
  })

  it('AC17: skills install as files only — no execution side effects', () => {
    config()
    runAdd('skills', { group: 'tech' }, tmp)
    expect(fs.existsSync(path.join(tmp, 'knowledge/skills/adr-writing/skill.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmp, 'knowledge/skills/README.md'))).toBe(true)
  })
})
