/// <reference types="vitest" />
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

type ViteConfigWithTest = UserConfig & {
  test: {
    environment: string
    globals: boolean
    include: string[]
  }
}

// https://vite.dev/config/
const config: ViteConfigWithTest = {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/test/**/*.test.ts'],
  },
}

export default defineConfig(config)
