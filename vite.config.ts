import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3200,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3201',
        ws: true,
      },
    },
  },
})
