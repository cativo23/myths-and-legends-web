import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    coverage: { exclude: ['app/api-client/**'] },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Boots the built Nuxt server and calls it over HTTP (no browser, no API).
        test: {
          name: 'server',
          include: ['tests/server/**/*.test.ts'],
          environment: 'node',
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.test.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
