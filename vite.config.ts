import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Preview builds use relative paths so they work from any sub-path.
  base: mode === 'preview' ? './' : '/',
  plugins: [react(), tailwindcss()],
}))
