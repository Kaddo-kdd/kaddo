import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain ESM script at the repo root, no type declarations.
import { transformReadme } from '../../../scripts/sync-npm-readme.mjs'

describe('WI-026 — npm README sync transform', () => {
  it('rewrites the HTML banner asset to an absolute raw URL (AC-03)', () => {
    const out = transformReadme('<img src="assets/banner.png" alt="x" />\n')
    expect(out).toContain('src="https://raw.githubusercontent.com/Kaddo-kdd/kaddo/main/assets/banner.png"')
    expect(out).not.toContain('src="assets/')
  })

  it('rewrites a Markdown image asset to an absolute raw URL (AC-03)', () => {
    const out = transformReadme('![logo](assets/logo_blanco.png)\n')
    expect(out).toContain('](https://raw.githubusercontent.com/Kaddo-kdd/kaddo/main/assets/logo_blanco.png)')
  })

  it('maps a relative directory link to a GitHub tree URL (AC-04)', () => {
    const out = transformReadme('See the [examples](examples/).\n')
    expect(out).toContain('(https://github.com/Kaddo-kdd/kaddo/tree/main/examples)')
  })

  it('maps a relative file link to a GitHub blob URL (AC-04)', () => {
    const out = transformReadme('Read [CONTRIBUTING](CONTRIBUTING.md).\n')
    expect(out).toContain('(https://github.com/Kaddo-kdd/kaddo/blob/main/CONTRIBUTING.md)')
  })

  it('leaves absolute links, anchors and mailto untouched', () => {
    const src = '[site](https://kaddo.org) [top](#intro) [mail](mailto:a@b.com)\n'
    const out = transformReadme(src)
    expect(out).toContain('(https://kaddo.org)')
    expect(out).toContain('(#intro)')
    expect(out).toContain('(mailto:a@b.com)')
  })

  it('prepends the generated notice and is deterministic (AC-02, AC-06)', () => {
    const src = '# Title\n\n[x](examples/)\n'
    const once = transformReadme(src)
    const twice = transformReadme(src)
    expect(once).toBe(twice)
    expect(once.startsWith('<!-- Generated from /README.md')).toBe(true)
    expect(once).toContain('do not edit directly')
  })
})
