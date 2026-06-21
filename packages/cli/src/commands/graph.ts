import { cwd, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import {
  buildGraph,
  serializeGraphJson,
  renderGraphMermaid,
  type GraphScope,
} from '../core/graph.js'
import {
  buildGraphHints,
  renderGraphHintsMarkdown,
  serializeGraphHintsJson,
} from '../core/graph-hints.js'

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
  // Relationship-quality hints (VS-056) — non-blocking; always written alongside the graph.
  const hints = buildGraphHints(dir, graph)

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
  writeFile(join(dir, '.kaddo', 'graph-hints.md'), renderGraphHintsMarkdown(hints))
  writeFile(join(dir, '.kaddo', 'graph-hints.json'), serializeGraphHintsJson(hints))
  written.push('.kaddo/graph-hints.md', '.kaddo/graph-hints.json')

  log.success(`Knowledge graph exported with ${scope} scope.`)
  log.info(`Scope: ${scope} · Nodes: ${graph.nodes.length} · Edges: ${graph.edges.length}`)
  log.info(`Relationship quality: ${hints.quality}`)

  // Contextual empty: active scope with no active Work Items only has the knowledge layers (VS-060).
  const hasWorkItemNodes = graph.nodes.some((n) => n.type === 'work-item')
  if (scope === 'active' && !hasWorkItemNodes) {
    log.warn('No active Work Items found.')
    log.info('The active graph only includes knowledge layers.')
    log.info('Run `kaddo graph export --scope all` to include completed Work Items.')
  }

  if (hints.hints.length > 0) {
    const shown = hints.hints.slice(0, 5)
    log.warn(`${hints.hints.length} metadata hint(s) available:`)
    for (const h of shown) log.info(`- ${h.message}`)
    if (hints.hints.length > shown.length) {
      log.info(`…and ${hints.hints.length - shown.length} more — see .kaddo/graph-hints.md`)
    }
  }

  for (const f of written) log.info(`- ${f}`)

  printCommandFooter('graph export')
  outro('Knowledge graph ready.')
}
