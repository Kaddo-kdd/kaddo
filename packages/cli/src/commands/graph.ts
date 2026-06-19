import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import {
  buildGraph,
  serializeGraphJson,
  renderGraphMermaid,
  graphIsSparse,
  type GraphScope,
} from '../core/graph.js'

type GraphFormat = 'json' | 'mermaid'
type GraphOpts = { scope?: string; format?: string }

/** `kaddo graph export` — write the lightweight knowledge graph (.kaddo/graph.json + .mmd). */
export function runGraphExport(opts: GraphOpts = {}): void {
  const dir = cwd()
  const config = requireConfig(dir)
  intro('kaddo graph export')

  const scope: GraphScope = opts.scope === 'all' ? 'all' : 'active'
  const format = opts.format as GraphFormat | undefined
  const writeJson = format !== 'mermaid'
  const writeMermaid = format !== 'json'

  const graph = buildGraph(dir, config, { scope })

  const written: string[] = []
  if (writeJson) {
    const rel = join('.kaddo', 'graph.json')
    writeFile(join(dir, rel), serializeGraphJson(graph))
    written.push(rel.replace(/\\/g, '/'))
  }
  if (writeMermaid) {
    const rel = join('.kaddo', 'graph.mmd')
    writeFile(join(dir, rel), renderGraphMermaid(graph))
    written.push(rel.replace(/\\/g, '/'))
  }

  if (graphIsSparse(graph)) {
    log.warn('Knowledge graph exported with limited relationships.')
    log.info('Tip: add `code`, `capabilities`, `decisions` or `source_id` front matter to improve graph quality.')
  } else {
    log.success('Knowledge graph exported.')
  }
  log.info(`Scope: ${scope} · Nodes: ${graph.nodes.length} · Edges: ${graph.edges.length}`)
  for (const f of written) log.info(`- ${f}`)

  printCommandFooter('graph export')
  outro('Knowledge graph ready.')
}
