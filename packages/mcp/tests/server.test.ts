import { describe, it, expect, afterEach } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer } from '../src/server.js'
import { makeProject, write, config, workItem, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

async function connect(projectRoot: string): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createServer(projectRoot)
  await server.connect(serverTransport)
  const client = new Client({ name: 'test', version: '1.0.0' })
  await client.connect(clientTransport)
  return client
}

describe('MCP server integration (VS-057 AC4/AC5/AC6/AC7/AC8)', () => {
  it('lists resources, tools and prompts over an MCP transport', async () => {
    root = makeProject()
    config(root)
    workItem(root, 'WI-001', { status: 'ready' })
    write(root, 'knowledge/agents/delivery/work-item-agent.md', '# Work Item Agent\n\nRefine.')
    const client = await connect(root)

    const resources = await client.listResources()
    expect(resources.resources.map((r) => r.uri)).toContain('kaddo://work-items')

    const tools = await client.listTools()
    expect(tools.tools.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        'kaddo_project_status',
        'kaddo_list_work_items',
        'kaddo_get_work_item',
        'kaddo_list_capsules',
        'kaddo_get_capsule',
        'kaddo_list_agents',
        'kaddo_get_agent_prompt',
        'kaddo_list_graph_hints',
        'kaddo_generate_context',
        'kaddo_generate_explain',
        'kaddo_generate_understand',
        'kaddo_generate_graph',
        'kaddo_generate_capsule_draft',
      ])
    )

    const prompts = await client.listPrompts()
    expect(prompts.prompts.map((p) => p.name)).toContain('work-item-agent')

    await client.close()
  })

  it('calls a read-only tool and reads a resource', async () => {
    root = makeProject()
    config(root)
    workItem(root, 'WI-001', { status: 'ready' })
    const client = await connect(root)

    const result = await client.callTool({ name: 'kaddo_list_work_items', arguments: { status: 'ready' } })
    const text = (result.content as { type: string; text: string }[])[0].text
    expect(text).toContain('WI-001')

    const read = await client.readResource({ uri: 'kaddo://context-pack' })
    expect((read.contents[0].text as string)).toMatch(/Run `kaddo context`/)

    await client.close()
  })

  it('AC18: a derived tool regenerates a file the resource then reads', async () => {
    root = makeProject()
    config(root, 'demo')
    write(root, 'knowledge/knowledge.md', '# Knowledge\n\nProduct summary.')
    workItem(root, 'WI-001', { status: 'in-progress' })
    const client = await connect(root)

    // Before: resource reports the missing-file instruction.
    const missing = await client.readResource({ uri: 'kaddo://context-pack' })
    expect(missing.contents[0].text as string).toMatch(/Run `kaddo context`/)

    // Derived tool regenerates it.
    const gen = await client.callTool({ name: 'kaddo_generate_context', arguments: {} })
    const genText = (gen.content as { type: string; text: string }[])[0].text
    expect(genText).toContain('.kaddo/context-pack.md')

    // After: the resource reads the regenerated pack.
    const present = await client.readResource({ uri: 'kaddo://context-pack' })
    expect(present.contents[0].text as string).toContain('Kaddo Context Pack')

    await client.close()
  })

  it('an uninitialized project yields a clear message instead of crashing', async () => {
    root = makeProject() // no .kaddo/config.yml
    const client = await connect(root)
    const result = await client.callTool({ name: 'kaddo_project_status', arguments: {} })
    const text = (result.content as { type: string; text: string }[])[0].text
    expect(text).toMatch(/Run `kaddo init` first/)
    await client.close()
  })
})
