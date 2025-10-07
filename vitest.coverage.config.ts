import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'lcov'],
      provider: 'v8',
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60
    }
  }
})