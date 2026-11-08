import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Vitest's own test options live in vitest.config.ts (kept separate to avoid a
// TS type clash between vitest's bundled vite and this workspace's vite version).
// Tailwind v4 is wired through its first-party Vite plugin (no PostCSS config,
// no tailwind.config.js): design tokens live in `src/styles/global.css` `@theme`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
