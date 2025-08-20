import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    exclude: ['e2e/**/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/state': path.resolve(__dirname, './src/state'),
      '@/engine': path.resolve(__dirname, './src/engine'),
      '@/worker': path.resolve(__dirname, './src/worker'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
})
