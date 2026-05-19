import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['esm'],
  outDir: 'dist/server',
  banner: {
    js: '#!/usr/bin/env node',
  },
})
