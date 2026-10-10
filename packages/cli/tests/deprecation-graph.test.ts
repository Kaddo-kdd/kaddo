import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildGraph } from '../src/core/graph.js'
import { loadConfig } from '../src/core/config.js'

function write(dir: string, rel: string, content: string) {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

describe('WI-054 — Controlled Deprecation graph', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-deprecation-graph-'))
    write(dir, '.kaddo/config.yml', 'project:\n  name: graph\n  state: legacy\n  structure: monorepo\nteam:\n  size: small\n')
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('projects plan, target, module, resource, Work Item, and removal dependency edges', () => {
    write(dir, 'knowledge/tech/resources/legacy-db.md', '---\ntype: project-resource\nid: RES-legacy-db\ntitle: Legacy DB\n---\n')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', [
      '---', 'id: DEP-001', 'type: deprecation-plan', 'title: Retire legacy', 'targets:',
      '  - id: DEP-TGT-API', '    type: route', '    module: api', '    lifecycle: soft-deprecated',
      '  - id: DEP-TGT-DB', '    type: database-object', '    resource: RES-legacy-db', '    depends_on_removal: [DEP-TGT-API]', '    lifecycle: candidate', '---', '', '# Purpose', '', 'Retire safely.', '',
    ].join('\n'))
    write(dir, 'knowledge/delivery/work-items/ready/WI-700.md', '---\nid: WI-700\ntitle: Remove legacy\ntype: feature\nstatus: ready\ndeprecation_targets: [DEP-001/DEP-TGT-DB]\n---\n')

    const graph = buildGraph(dir, loadConfig(dir)!, { scope: 'all' })
    expect(graph.nodes.map((node) => node.id)).toEqual(expect.arrayContaining([
      'deprecation-plan:DEP-001', 'deprecation-target:DEP-TGT-API', 'deprecation-target:DEP-TGT-DB', 'module:api', 'resource:RES-legacy-db',
    ]))
    expect(graph.edges).toEqual(expect.arrayContaining([
      { from: 'deprecation-plan:DEP-001', to: 'deprecation-target:DEP-TGT-API', type: 'targets' },
      { from: 'deprecation-target:DEP-TGT-API', to: 'module:api', type: 'targets' },
      { from: 'deprecation-target:DEP-TGT-DB', to: 'resource:RES-legacy-db', type: 'targets' },
      { from: 'deprecation-target:DEP-TGT-DB', to: 'deprecation-target:DEP-TGT-API', type: 'depends_on_removal' },
      { from: 'wi:WI-700', to: 'deprecation-target:DEP-TGT-DB', type: 'targets' },
    ]))
  })
})
