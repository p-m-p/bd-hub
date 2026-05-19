import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/server/**'],
      exclude: ['src/server/types.ts', 'src/server/index.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
