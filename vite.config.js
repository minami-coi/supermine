import react from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-social-card',
      apply: 'build',
      async closeBundle() {
        await copyFile(new URL('./src/assets/card.png', import.meta.url), new URL('./build/card.png', import.meta.url))
      },
    },
  ],
  base: './',
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
});
