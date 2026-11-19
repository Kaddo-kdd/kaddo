import { defineConfig } from 'tsup'
import { createRequire } from 'node:module'

// WI-087 — the published @kaddo/mcp is an ESM bundle. tsup bundles everything that is NOT a declared
// `dependency` (or Node builtin). The bug: @kaddo/cli was a *devDependency*, so it — and its transitive
// CommonJS deps (execa → cross-spawn) — got inlined into the ESM bundle, where cross-spawn's top-level
// `require("child_process")` becomes esbuild's throwing `__require` shim ("Dynamic require ... not
// supported") and the server dies on startup. The fix is to make every runtime dependency EXTERNAL so Node
// resolves it natively (CJS/ESM interop handled by Node, not by the bundle). @kaddo/cli is now a real
// dependency and is installed alongside the package. We externalize the declared `dependencies` explicitly
// (not just by tsup's default) so a dependency can never be silently inlined again.
const require = createRequire(import.meta.url)
const pkg = require('./package.json') as { dependencies?: Record<string, string> }
const external = Object.keys(pkg.dependencies ?? {})

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Every runtime dependency stays external and is resolved by Node at runtime from node_modules.
  external,
  sourcemap: false,
  minify: false,
})
