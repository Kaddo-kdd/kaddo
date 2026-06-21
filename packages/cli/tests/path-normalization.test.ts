import { describe, it, expect } from 'vitest'
import { normalizeTouchedPathForProject } from '../src/core/diff-analysis.js'

// Use POSIX-style absolute roots; path.relative works cross-platform on these in tests.
const GIT = '/repo'
const PROJECT = '/repo/todoApp'

describe('normalizeTouchedPathForProject (VS-060.1)', () => {
  it('AC: git root == project root returns the path unchanged', () => {
    expect(normalizeTouchedPathForProject('src/cli/program.ts', '/repo', '/repo')).toBe('src/cli/program.ts')
  })

  it('AC2/AC3: strips the project prefix when git root is above the project', () => {
    expect(normalizeTouchedPathForProject('todoApp/src/cli/program.ts', GIT, PROJECT)).toBe('src/cli/program.ts')
    expect(normalizeTouchedPathForProject('todoApp/src/modules/tasks/task.repository.ts', GIT, PROJECT)).toBe(
      'src/modules/tasks/task.repository.ts'
    )
  })

  it('AC5: files outside the project return null', () => {
    expect(normalizeTouchedPathForProject('otherApp/src/index.ts', GIT, PROJECT)).toBeNull()
    expect(normalizeTouchedPathForProject('todoApp', GIT, PROJECT)).toBeNull() // the folder itself
  })

  it('AC6/AC7: backslashes are normalized to slashes', () => {
    expect(normalizeTouchedPathForProject('todoApp\\src\\cli\\program.ts', GIT, PROJECT)).toBe('src/cli/program.ts')
    expect(normalizeTouchedPathForProject('src\\cli\\program.ts', '/repo', '/repo')).toBe('src/cli/program.ts')
  })

  it('no git root info: returns the path as project-relative', () => {
    expect(normalizeTouchedPathForProject('src/cli/program.ts', null, PROJECT)).toBe('src/cli/program.ts')
  })
})
