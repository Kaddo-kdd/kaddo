import type { KaddoModule, ModuleFile } from './types.js'
import { SKILLS, SKILL_GROUPS, skillInstallPath } from '../skills/skills.js'

const skillsReadme: ModuleFile = {
  path: 'knowledge/skills/README.md',
  content: [
    '# Skills',
    '',
    'Reusable **skill** definitions — capabilities shared across agents. A skill does not decide',
    'WHAT to do (that is the agent); it defines HOW to do one thing well. Agents orchestrate;',
    'skills standardize; knowledge grounds; MCP exposes.',
    '',
    'Skills never execute anything — they are reusable instructions, not tools. They never run',
    'git, never call an LLM and never modify files.',
    '',
    '## Installed skills',
    '',
    ...SKILLS.map((s) => `- \`${s.id}\` (${s.group}) — ${s.title}. Applies to: ${s.appliesTo.join(', ')}.`),
    '',
    '## Groups',
    '',
    ...Object.entries(SKILL_GROUPS).map(([g, ids]) => `- **${g}**: ${ids.join(', ')}`),
    '',
    'Install: `kaddo add skills` (recommended), `--all`, or `--group <delivery|tech|integration>`.',
  ].join('\n'),
}

const skillFiles: ModuleFile[] = SKILLS.map((s) => ({
  path: skillInstallPath(s.id),
  content: s.content,
}))

export const skillsModule: KaddoModule = {
  name: 'skills',
  description: 'Reusable skills — capabilities shared across agents (adr-writing, work-item-refinement, …)',
  configKey: 'module_skills',
  dirs: ['knowledge/skills'],
  files: [skillsReadme, ...skillFiles],
  workItemTypes: [],
}
