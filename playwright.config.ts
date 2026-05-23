import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/setup/global-setup.ts',
  globalTeardown: './tests/e2e/setup/global-teardown.ts',
  use: {
    baseURL: process.env.BEADS_TEST_URL ?? 'http://localhost:3099',
  },
  webServer: undefined, // Server started in globalSetup
  timeout: 30000,
  expect: { timeout: 10000 }, // allow time for debounce + bd query after file change
})
