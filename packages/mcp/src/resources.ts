// Read-only MCP resources (VS-057).
//
// Each resource exposes existing Kaddo output as MCP content. Derived files are NEVER generated —
// when one is missing the resource returns a clear instruction to run the matching CLI command.

import { listCapsules, listAgents } from './catalog.js'
import { listSkills } from './skills.js'
import { buildImpactReport, renderImpactMarkdown } from '../../cli/src/core/impact-report.js'
import { buildSavingsReport, renderSavingsMarkdown } from '../../cli/src/core/savings.js'
import { listWorkItems } from './workitems.js'
import { hasKnowledge, readText } from './project.js'

export type ResourcePart = { uri: string; text: string; mimeType: string }

export type ResourceDescriptor = {
  uri: string
  name: string
  description: string
  mimeType: string
  read: (root: string) => ResourcePart[]
}

function text(uri: string, body: string, mimeType = 'text/markdown'): ResourcePart[] {
  return [{ uri, text: body, mimeType }]
}

function fileOrHint(root: string, uri: string, rel: string, hint: string, mimeType = 'text/markdown'): ResourcePart[] {
  const body = readText(root, rel)
  return text(uri, body ?? hint, body ? mimeType : 'text/plain')
}

export const RESOURCES: ResourceDescriptor[] = [
  {
    uri: 'kaddo://context-pack',
    name: 'Kaddo context pack',
    description: 'Curated LLM context pack (.kaddo/context-pack.md).',
    mimeType: 'text/markdown',
    read: (root) =>
      fileOrHint(
        root,
        'kaddo://context-pack',
        '.kaddo/context-pack.md',
        'Context pack not found. Run `kaddo context` in the project first.'
      ),
  },
  {
    uri: 'kaddo://explain',
    name: 'Kaddo explain',
    description: 'What Kaddo knows about the project (.kaddo/explain.md).',
    mimeType: 'text/markdown',
    read: (root) =>
      fileOrHint(
        root,
        'kaddo://explain',
        '.kaddo/explain.md',
        'Explain output not found. Run `kaddo explain` first.'
      ),
  },
  {
    uri: 'kaddo://understand',
    name: 'Kaddo understand',
    description: 'Current phase and recommended next step (.kaddo/understand.md).',
    mimeType: 'text/markdown',
    read: (root) =>
      fileOrHint(
        root,
        'kaddo://understand',
        '.kaddo/understand.md',
        'Understand output not found. Run `kaddo understand` first.'
      ),
  },
  {
    uri: 'kaddo://graph',
    name: 'Kaddo knowledge graph',
    description: 'Knowledge graph (.kaddo/graph.json + .kaddo/graph.mmd).',
    mimeType: 'application/json',
    read: (root) => {
      const json = readText(root, '.kaddo/graph.json')
      const mmd = readText(root, '.kaddo/graph.mmd')
      if (!json && !mmd) {
        return text('kaddo://graph', 'Knowledge graph not found. Run `kaddo graph export` first.', 'text/plain')
      }
      const parts: ResourcePart[] = []
      if (json) parts.push({ uri: 'kaddo://graph', text: json, mimeType: 'application/json' })
      if (mmd) parts.push({ uri: 'kaddo://graph.mmd', text: mmd, mimeType: 'text/vnd.mermaid' })
      return parts
    },
  },
  {
    uri: 'kaddo://graph-hints',
    name: 'Kaddo graph hints',
    description: 'Graph relationship-quality hints (.kaddo/graph-hints.md + .json).',
    mimeType: 'text/markdown',
    read: (root) => {
      const md = readText(root, '.kaddo/graph-hints.md')
      const json = readText(root, '.kaddo/graph-hints.json')
      if (!md && !json) {
        return text('kaddo://graph-hints', 'Graph hints not found. Run `kaddo graph export` first.', 'text/plain')
      }
      const parts: ResourcePart[] = []
      if (md) parts.push({ uri: 'kaddo://graph-hints', text: md, mimeType: 'text/markdown' })
      if (json) parts.push({ uri: 'kaddo://graph-hints.json', text: json, mimeType: 'application/json' })
      return parts
    },
  },
  {
    uri: 'kaddo://work-items',
    name: 'Kaddo work items',
    description: 'Summarized Work Items from knowledge/delivery/work-items/.',
    mimeType: 'application/json',
    read: (root) => {
      if (!hasKnowledge(root)) {
        return text('kaddo://work-items', 'Knowledge repository not found. Run `kaddo bootstrap` first.', 'text/plain')
      }
      return [
        {
          uri: 'kaddo://work-items',
          text: JSON.stringify(listWorkItems(root), null, 2),
          mimeType: 'application/json',
        },
      ]
    },
  },
  {
    uri: 'kaddo://roadmap',
    name: 'Kaddo roadmap',
    description: 'Delivery roadmap (knowledge/delivery/roadmap.md).',
    mimeType: 'text/markdown',
    read: (root) =>
      fileOrHint(
        root,
        'kaddo://roadmap',
        'knowledge/delivery/roadmap.md',
        'Roadmap not found. Create knowledge/delivery/roadmap.md (e.g. via the roadmap-agent) first.'
      ),
  },
  {
    uri: 'kaddo://capsules',
    name: 'Kaddo knowledge capsules',
    description: 'External Knowledge Capsules from .kaddo/external.yml and external/.',
    mimeType: 'application/json',
    read: (root) => [
      {
        uri: 'kaddo://capsules',
        text: JSON.stringify(listCapsules(root), null, 2),
        mimeType: 'application/json',
      },
    ],
  },
  {
    uri: 'kaddo://agents',
    name: 'Kaddo agents',
    description: 'Installed agent prompts from knowledge/agents/.',
    mimeType: 'application/json',
    read: (root) => [
      {
        uri: 'kaddo://agents',
        text: JSON.stringify(listAgents(root), null, 2),
        mimeType: 'application/json',
      },
    ],
  },
  {
    uri: 'kaddo://skills',
    name: 'Kaddo skills',
    description: 'Installed reusable skills from knowledge/skills/ (empty if none).',
    mimeType: 'application/json',
    read: (root) => [
      {
        uri: 'kaddo://skills',
        text: JSON.stringify({ skills: listSkills(root) }, null, 2),
        mimeType: 'application/json',
      },
    ],
  },
  {
    uri: 'kaddo://impact-report',
    name: 'Kaddo impact report',
    description: 'Knowledge Impact Report — the last written report, or generated in memory (read-only).',
    mimeType: 'text/markdown',
    read: (root) => {
      // Prefer a previously written report; otherwise build it in memory (no writes).
      const saved = readText(root, '.kaddo/reports/impact-report.md')
      if (saved) return [{ uri: 'kaddo://impact-report', text: saved, mimeType: 'text/markdown' }]
      if (!hasKnowledge(root)) {
        return text('kaddo://impact-report', 'Knowledge repository not found. Run `kaddo bootstrap` first.', 'text/plain')
      }
      return [{ uri: 'kaddo://impact-report', text: renderImpactMarkdown(buildImpactReport(root, { scope: 'all', scopeSource: 'default' })), mimeType: 'text/markdown' }]
    },
  },
  {
    uri: 'kaddo://savings-report',
    name: 'Kaddo savings report',
    description: 'Estimated Savings Report — the last written report, or generated in memory (read-only).',
    mimeType: 'text/markdown',
    read: (root) => {
      const saved = readText(root, '.kaddo/reports/savings-report.md')
      if (saved) return [{ uri: 'kaddo://savings-report', text: saved, mimeType: 'text/markdown' }]
      if (!hasKnowledge(root)) {
        return text('kaddo://savings-report', 'Knowledge repository not found. Run `kaddo bootstrap` first.', 'text/plain')
      }
      return [{ uri: 'kaddo://savings-report', text: renderSavingsMarkdown(buildSavingsReport(root, { scope: 'all', scopeSource: 'default' })), mimeType: 'text/markdown' }]
    },
  },
]
