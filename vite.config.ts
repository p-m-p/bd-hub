import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/public',
    sourcemap: true,
    target: 'es2022',
  },
  resolve: {
    conditions: ['browser', 'module', 'import'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
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
