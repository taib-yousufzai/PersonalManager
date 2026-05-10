import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.ts', '__tests__/**/*.test.ts'],
    exclude: ['__tests__/integration/**'],
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
  },
})
