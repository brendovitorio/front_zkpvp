import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts: vitest's bundled vite version differs from this
// workspace's top-level vite, which otherwise causes a TS type clash when both
// configs are merged into one file. This file is not referenced by any
// tsconfig, so it is never type-checked by `tsc -b` — only run by Vitest.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
