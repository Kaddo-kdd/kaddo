import { describe, it, expect, afterEach } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { listSkills, getSkill } from '../src/skills.js'
import { listSkillsTool, getSkillTool } from '../src/tools.js'
import { RESOURCES } from '../src/resources.js'
import { createServer } from '../src/server.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function installSkill(id: string, group = 'tech', appliesTo = ['graph-agent']): void {
  write(
    root,
    `knowledge/skills/${id}/skill.md`,
    [
      '---',
      'type: skill',
      `id: ${id}`,
      `title: ${id} Skill`,
      'version: 1',
      `group: ${group}`,
      'applies_to:',
      ...appliesTo.map((a) => `  - ${a}`),
      '---',
      `# ${id} Skill`,
      '',
      'How to do it well.',
    ].join('\n')
  )
}

describe('MCP skills (VS-059)', () => {
  it('AC13: kaddo://skills lists installed skills with metadata', () => {
    root = makeProject()
    config(root)
    installSkill('adr-writing')
    const res = RESOURCES.find((r) => r.uri === 'kaddo://skills')!
    const json = JSON.parse(res.read(root)[0].text)
    expect(json.skills[0]).toMatchObject({ id: 'adr-writing', group: 'tech' })
  })

  it('catalog listSkills / getSkill', () => {
    root = makeProject()
    config(root)
    installSkill('work-item-refinement', 'delivery', ['work-item-agent'])
    expect(listSkills(root)[0].id).toBe('work-item-refinement')
    expect(getSkill(root, 'work-item-refinement')?.content).toContain('How to do it well')
    expect(getSkill(root, 'missing')).toBeNull()
  })

  it('AC15: kaddo_list_skills / kaddo_get_skill tools', () => {
    root = makeProject()
    config(root)
    installSkill('ownership-suggestion')
    const list = listSkillsTool(root)
    expect(list.ok && (list.data as { id: string }[])[0].id).toBe('ownership-suggestion')
    expect(getSkillTool(root, 'ownership-suggestion').ok).toBe(true)
    expect(getSkillTool(root, 'nope').ok).toBe(false)
  })

  it('AC14/AC16: per-skill resources and skill prompts are registered', async () => {
    root = makeProject()
    config(root)
    installSkill('graph-metadata-review')
    const [clientT, serverT] = InMemoryTransport.createLinkedPair()
    const server = createServer(root)
    await server.connect(serverT)
    const client = new Client({ name: 'test', version: '1.0.0' })
    await client.connect(clientT)

    const resources = await client.listResources()
    expect(resources.resources.map((r) => r.uri)).toContain('kaddo://skills/graph-metadata-review')
    const read = await client.readResource({ uri: 'kaddo://skills/graph-metadata-review' })
    expect(read.contents[0].text as string).toContain('graph-metadata-review Skill')

    const prompts = await client.listPrompts()
    expect(prompts.prompts.map((p) => p.name)).toContain('skill-graph-metadata-review')

    const tools = await client.listTools()
    expect(tools.tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['kaddo_list_skills', 'kaddo_get_skill'])
    )

    await client.close()
  })
})
