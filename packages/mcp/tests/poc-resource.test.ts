import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { RESOURCES } from '../src/resources.js'

const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))

describe('POC MCP resource', () => {
  it('reads the canonical POC artifact and provides a useful missing hint', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-poc-'))
    dirs.push(dir)
    const resource = RESOURCES.find((item) => item.uri === 'kaddo://poc')!
    expect(resource.read(dir)[0].text).toMatch(/POC artifact not found/)
    fs.mkdirSync(path.join(dir, 'knowledge/delivery'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'knowledge/delivery/poc.md'), '# Proof of Concept')
    expect(resource.read(dir)[0].text).toBe('# Proof of Concept')
  })
})
