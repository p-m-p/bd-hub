import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/public',
    sourcemap: true,
    target: 'es2022',
    // Keep light-dark() native — polyfilling it breaks the themeable
    // color-scheme: var(--bd-color-scheme) indirection in tokens.css
    cssTarget: ['chrome123', 'firefox120', 'safari17.5'],
  },
  resolve: {
    conditions: ['browser', 'module', 'import'],
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/coverage/**', '**/dist/**', '**/.beads/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/theme.css': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
})
