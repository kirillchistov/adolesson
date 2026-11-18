import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — сборка открывается с любого статического хостинга (GitHub Pages и т. п.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
