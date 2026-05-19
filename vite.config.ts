import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/public',
    sourcemap: true,
    target: 'es2022',
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
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
})
