import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SKILLS } from '../src/skills/skills.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const pluginRoot = path.join(repoRoot, 'Kaddo Power')

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(pluginRoot, relativePath), 'utf8')) as Record<string, unknown>
}

function pluginMarkdown(): string {
  const files: string[] = []
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolute)
    }
  }
  walk(pluginRoot)
  return files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
}

describe('official Kaddo Agent Plugin', () => {
  it('has valid official manifest metadata for Agent Plugins 1.0', () => {
    const manifest = readJson('plugin.json')
    const allowed = new Set([
      '$schema',
      'name',
      'version',
      'description',
      'author',
      'homepage',
      'repository',
      'license',
      'keywords',
      'extensions',
    ])

    expect(Object.keys(manifest).every((key) => allowed.has(key))).toBe(true)
    expect(manifest.$schema).toBe('https://agent-plugins.org/schemas/1.0.0/plugin.schema.json')
    expect(manifest.name).toBe('kaddo-power')
    expect(manifest.name).toMatch(/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/)
    expect(manifest.version).toBe('1.0.1')
    expect(manifest.repository).toBe('https://github.com/Kaddo-kdd/kaddo/tree/main/Kaddo%20Power')
    expect(manifest.homepage).toBe('https://kaddo.trycatch.tv/')
    expect(manifest.license).toBe('MIT')
    expect(manifest.author).toEqual({ name: 'Kaddo', url: 'https://kaddo.trycatch.tv/' })
    expect(manifest.description).toContain('Kiro is the first supported consumer')
  })

  it('uses the supported stdio MCP manifest without duplicating the MCP API', () => {
    const manifest = readJson('mcp.json')
    expect(Object.keys(manifest).sort()).toEqual(['$schema', 'mcpServers'])
    expect(manifest.$schema).toBe('https://agent-plugins.org/schemas/1.0.0/mcp.schema.json')

    const servers = manifest.mcpServers as Record<string, Record<string, unknown>>
    expect(Object.keys(servers)).toEqual(['kaddo'])
    expect(servers.kaddo).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@kaddo/mcp'],
      env: { KADDO_PROJECT_DIR: '${KADDO_PROJECT_DIR}' },
    })

    const docs = pluginMarkdown()
    expect(docs).not.toMatch(/exposes exactly \d+ (?:tools|resources)/i)
    expect(docs).not.toMatch(/exposes \*\*\d+ (?:tools|resource)/i)
  })

  it('contains required portable and Kiro-specific files', () => {
    const required = [
      'plugin.json',
      'mcp.json',
      'README.md',
      'skills/README.md',
      'dev.kiro/steering/power-kaddo.md',
      'dev.kiro/steering/getting-started.md',
      'dev.kiro/steering/onboarding.md',
      'dev.kiro/steering/resources.md',
    ]
    for (const relativePath of required) {
      expect(fs.statSync(path.join(pluginRoot, relativePath)).isFile(), relativePath).toBe(true)
    }
  })

  it('projects every canonical Kaddo Skill in Agent Skills format', () => {
    const skillDirectories = fs
      .readdirSync(path.join(pluginRoot, 'skills'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    expect(skillDirectories).toEqual(SKILLS.map((skill) => skill.id).sort())

    for (const skill of SKILLS) {
      const content = fs.readFileSync(path.join(pluginRoot, 'skills', skill.id, 'SKILL.md'), 'utf8')
      expect(content).toMatch(new RegExp(`^---\\nname: ${skill.id}\\ndescription: ".+"\\n---`))
      const description = content.match(/^description: (.+)$/m)?.[1] ?? ''
      expect(JSON.parse(description).length).toBeLessThanOrEqual(1024)
      expect(JSON.parse(description)).not.toMatch(/[<>]/)
      expect(JSON.parse(description)).toContain('Use when:')
      expect(content).toContain('Generated from packages/cli/src/skills/skills.ts')
      expect(content).toContain(`# ${skill.title}`)
    }
  })

  it('keeps generated Skills synchronized with their canonical definitions', () => {
    expect(() =>
      execFileSync(process.execPath, ['scripts/sync-agent-plugin-skills.mjs', '--check'], {
        cwd: repoRoot,
        stdio: 'pipe',
      })
    ).not.toThrow()
  })

  it('preserves human confirmation and contributor attribution', () => {
    const docs = pluginMarkdown()
    expect(docs).toContain('Esteban Fonseca')
    expect(docs).toMatch(/impact candidates as confirmed scope|confirmed impact/i)
    expect(docs).toMatch(/mark a Work Item ready/i)
    expect(docs).toMatch(/commit or push/i)
    expect(docs).toMatch(/open questions/i)
  })

  it('resolves relative Markdown links in the Agent Plugin README', () => {
    const readmePath = path.join(pluginRoot, 'README.md')
    const readme = fs.readFileSync(readmePath, 'utf8')
    const links = [...readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
    const localLinks = links.filter((link) => !/^(?:https?:|#)/.test(link))

    for (const link of localLinks) {
      const target = path.resolve(path.dirname(readmePath), link.split('#')[0])
      expect(fs.existsSync(target), link).toBe(true)
    }
  })
})
