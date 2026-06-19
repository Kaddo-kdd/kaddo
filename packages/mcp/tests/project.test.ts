import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  safeResolve,
  readText,
  assertKaddoProject,
  KaddoMcpError,
  FORBIDDEN_ROOTS,
} from '../src/project.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

describe('project path safety (VS-057 AC12/AC13)', () => {
  it('allows reads under .kaddo / knowledge / external', () => {
    root = makeProject()
    write(root, '.kaddo/explain.md', 'hi')
    write(root, 'knowledge/inventory.md', 'inv')
    write(root, 'external/x.capsule.md', 'cap')
    expect(readText(root, '.kaddo/explain.md')).toBe('hi')
    expect(readText(root, 'knowledge/inventory.md')).toBe('inv')
    expect(readText(root, 'external/x.capsule.md')).toBe('cap')
  })

  it('blocks forbidden top dirs (src, .git, node_modules, dist, build, coverage)', () => {
    root = makeProject()
    for (const forbidden of FORBIDDEN_ROOTS) {
      expect(() => safeResolve(root, `${forbidden}/secret.ts`)).toThrow(KaddoMcpError)
    }
  })

  it('blocks path traversal and absolute paths', () => {
    root = makeProject()
    expect(() => safeResolve(root, '../outside.txt')).toThrow(KaddoMcpError)
    expect(() => safeResolve(root, 'knowledge/../../etc/passwd')).toThrow(KaddoMcpError)
    expect(() => safeResolve(root, path.resolve(root, '.kaddo/x'))).toThrow(KaddoMcpError)
  })

  it('does not read source files even if asked via an allowed-looking path', () => {
    root = makeProject()
    write(root, 'src/index.ts', 'const SECRET = 1')
    expect(() => readText(root, 'src/index.ts')).toThrow(KaddoMcpError)
  })

  it('assertKaddoProject throws a clear message when config is missing', () => {
    root = makeProject()
    expect(() => assertKaddoProject(root)).toThrow(/Run `kaddo init` first/)
    config(root)
    expect(() => assertKaddoProject(root)).not.toThrow()
  })
})
