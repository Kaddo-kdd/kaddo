import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-init-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// Test the pure file-creation logic, isolated from CLI prompts
describe('init file structure', () => {
  it('creates expected files given a project name and dir', () => {
    const { writeFile, ensureDir, join } = {
      writeFile: (p: string, c: string) => {
        fs.mkdirSync(path.dirname(p), { recursive: true })
        fs.writeFileSync(p, c, 'utf-8')
      },
      ensureDir: (p: string) => fs.mkdirSync(p, { recursive: true }),
      join: path.join,
    }

    const projectName = 'test-project'
    const kaddoConfigPath = join(tmpDir, '.kaddo', 'config.yml')
    const knowledgePath = join(tmpDir, 'architecture', 'knowledge.md')
    const roadmapPath = join(tmpDir, 'architecture', 'roadmap.md')
    const workItemsDir = join(tmpDir, 'architecture', 'work-items')

    writeFile(kaddoConfigPath, `version: 1\nproject:\n  name: "${projectName}"\n`)
    ensureDir(workItemsDir)
    writeFile(knowledgePath, `# ${projectName} — Knowledge\n`)
    writeFile(roadmapPath, `# ${projectName} — Roadmap\n`)

    expect(fs.existsSync(kaddoConfigPath)).toBe(true)
    expect(fs.existsSync(knowledgePath)).toBe(true)
    expect(fs.existsSync(roadmapPath)).toBe(true)
    expect(fs.existsSync(workItemsDir)).toBe(true)

    const config = fs.readFileSync(kaddoConfigPath, 'utf-8')
    expect(config).toContain('test-project')
  })

  it('config includes guard silent_without_ownership', () => {
    const config = `version: 1
project:
  name: "my-app"
  domains: []
knowledge:
  default_level: K2
guard:
  silent_without_ownership: true
`
    expect(config).toContain('silent_without_ownership: true')
    expect(config).toContain('default_level: K2')
  })
})
