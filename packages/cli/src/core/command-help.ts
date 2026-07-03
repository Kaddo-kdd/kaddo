// Command responsibility matrix & contextual help (VS-048).
//
// Single source of truth for "what question does this command answer, and what should I do next".
// Used to print a short contextual footer after each command and to render the docs matrix.

export type CommandHelp = {
  /** The one question the command answers. */
  question: string
  /** The recommended next action. */
  next: string
}

export const COMMAND_HELP: Record<string, CommandHelp> = {
  init: { question: 'How do I start a Kaddo project?', next: 'kaddo bootstrap' },
  bootstrap: {
    question: 'What minimum knowledge should exist?',
    next: 'kaddo add agents, then kaddo context',
  },
  scan: {
    question: 'What technical signals exist in the repository?',
    next: 'kaddo explain (inspect) or kaddo context (package for an LLM)',
  },
  context: {
    question: 'What should I give to an LLM?',
    next: 'Use the recommended agent — run kaddo understand to pick it',
  },
  understand: {
    question: 'What should I do now?',
    next: 'Execute the recommended action shown above',
  },
  explain: { question: 'What does Kaddo know?', next: 'kaddo understand' },
  create: {
    question: 'How do roadmap candidates become Work Items?',
    next: 'Refine it with the work-item-agent',
  },
  'owners suggest': { question: 'Who owns this code?', next: 'kaddo guard' },
  guard: {
    question: 'Is knowledge drifting from code?',
    next: 'Update the affected knowledge, then commit',
  },
  'add agents': { question: 'Which agents are available?', next: 'kaddo understand' },
  'capsule export': {
    question: 'How do I share this project as external context?',
    next: 'Refine with the capsule-agent, then share the capsule file',
  },
  'capsule add': {
    question: 'How do I consume another system as external context?',
    next: 'kaddo context (the pack now includes External Knowledge)',
  },
  'graph export': {
    question: 'How is my project knowledge connected?',
    next: 'Open .kaddo/graph.mmd, or run kaddo explain for a summary',
  },
  'report impact': {
    question: 'What impact is Kaddo having on this project?',
    next: 'Act on the Suggested Actions section',
  },
  savings: {
    question: 'How much time/value might Kaddo be saving (estimate)?',
    next: 'Run `kaddo savings init` to calibrate assumptions',
  },
  drift: {
    question: 'Are code and knowledge drifting apart over time?',
    next: 'Review open warnings; `kaddo guard --record` before commits',
  },
  questions: {
    question: 'Are there open questions to decide before the roadmap?',
    next: 'Resolve, assume or defer blocking questions, then generate the roadmap',
  },
  'adapters install codex': {
    question: 'How does Codex work with this Kaddo project?',
    next: 'Open AGENTS.md, or regenerate it after knowledge changes',
  },
  adr: {
    question: 'Which technical decisions still need to become ADRs?',
    next: 'Use the adr-writing skill to draft ADRs, then mark them accepted when confirmed',
  },
  'tech organize': {
    question: 'Is knowledge/tech/ cleanly separated (core vs discovery vs decisions)?',
    next: 'Discovery notes now live under knowledge/tech/discovery/',
  },
  'agents status': {
    question: 'Are the installed agents aligned with the current Kaddo version?',
    next: 'Run `kaddo agents update` to refresh outdated agents',
  },
  'skills status': {
    question: 'Are the installed skills aligned with the current Kaddo version?',
    next: 'Run `kaddo skills update` to refresh outdated skills',
  },
}

/** Lines for the contextual footer, or [] if the command has no entry. */
export function commandFooterLines(name: string): string[] {
  const help = COMMAND_HELP[name]
  if (!help) return []
  return ['', `Question answered: ${help.question}`, `Suggested next:    ${help.next}`]
}

/** Print the contextual footer for a command (no-op if unknown). */
export function printCommandFooter(name: string): void {
  for (const line of commandFooterLines(name)) console.log(line)
}

/** Render the official Command Responsibility Matrix as Markdown (docs). */
export function renderCommandMatrixMarkdown(): string {
  const order = [
    'init',
    'bootstrap',
    'scan',
    'context',
    'understand',
    'explain',
    'create',
    'owners suggest',
    'guard',
    'add agents',
    'capsule export',
    'capsule add',
    'graph export',
  ]
  const lines = ['| Command | Question answered | Suggested next |', '|---|---|---|']
  for (const name of order) {
    const h = COMMAND_HELP[name]
    if (h) lines.push(`| \`kaddo ${name}\` | ${h.question} | ${h.next} |`)
  }
  return lines.join('\n')
}
