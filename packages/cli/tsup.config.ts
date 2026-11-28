import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    clean: true,
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: false,
    minify: false,
    external: ['@kaddo/admin-server'],
  },
  {
    entry: ['src/core.ts'],
    format: ['esm'],
    target: 'node18',
    clean: false,
    sourcemap: false,
    minify: false,
  },
  {
    entry: ['src/audit-discover-sandbox.ts'],
    format: ['cjs'],
    target: 'node18',
    clean: false,
    noExternal: [/.*/],
    outExtension: () => ({ js: '.cjs' }),
    sourcemap: false,
    minify: false,
  },
])
