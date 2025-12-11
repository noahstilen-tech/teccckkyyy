import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '/tmp/cc-agent/61349991/project',
  resolve: {
    preserveSymlinks: false,
  },
})
