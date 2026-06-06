import { describe, it, expect } from 'vitest'
import {
  COMMAND_HELP,
  commandFooterLines,
  renderCommandMatrixMarkdown,
} from '../src/core/command-help.js'

describe('command help & matrix (VS-048)', () => {
  it('AC1: defines the official command responsibility matrix', () => {
    for (const name of [
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
    ]) {
      expect(COMMAND_HELP[name], name).toBeDefined()
      expect(COMMAND_HELP[name].question.length).toBeGreaterThan(0)
      expect(COMMAND_HELP[name].next.length).toBeGreaterThan(0)
    }
  })

  it('AC2: footer shows the question answered and the suggested next', () => {
    const lines = commandFooterLines('explain').join('\n')
    expect(lines).toContain('Question answered: What does Kaddo know?')
    expect(lines).toContain('Suggested next:')
    expect(lines).toContain('kaddo understand')
  })

  it('returns no footer for unknown commands', () => {
    expect(commandFooterLines('nope')).toEqual([])
  })

  it('renders the matrix as markdown', () => {
    const md = renderCommandMatrixMarkdown()
    expect(md).toContain('| Command | Question answered | Suggested next |')
    expect(md).toContain('`kaddo understand`')
    expect(md).toContain('What should I do now?')
  })
})
