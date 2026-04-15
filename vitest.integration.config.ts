import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['__tests__/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
