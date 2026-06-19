import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp-'))
  return dir
}

export function write(root: string, rel: string, content: string): void {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

export function config(root: string, name = 'demo'): void {
  write(
    root,
    '.kaddo/config.yml',
    `version: 1\nproject:\n  name: ${name}\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n`
  )
}

export function workItem(root: string, id: string, opts: Partial<{ status: string; type: string; level: string; extra: string }> = {}): void {
  const status = opts.status ?? 'in-progress'
  const type = opts.type ?? 'feature'
  write(
    root,
    `knowledge/delivery/work-items/${status}/${id}.md`,
    [
      '---',
      `id: ${id}`,
      `type: ${type}`,
      `title: ${id} title`,
      `status: ${status}`,
      `knowledge_level: ${opts.level ?? 'K2'}`,
      opts.extra ?? '',
      '---',
      `# ${id}`,
      '',
      'A summary paragraph.',
    ].join('\n')
  )
}

export function cleanup(root: string): void {
  fs.rmSync(root, { recursive: true, force: true })
}
