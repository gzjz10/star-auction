import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep flag SVGs as separate files so only the flags on screen are downloaded.
    assetsInlineLimit: 0,
  },
})
