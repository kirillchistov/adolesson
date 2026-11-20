import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Сервер разработки читает BACKEND_URL: Vercel подставляет его привязкой
// сервиса frontend к backend. В сборку браузера переменная не попадает.
// В проде браузер ходит на публичный /api того же адреса.
function backendDevTarget() {
  const bound = process.env.BACKEND_URL
  if (!bound) return 'http://127.0.0.1:5001'
  return new URL(bound).origin
}

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5174,
    proxy: { '/api': backendDevTarget() },
  },
})
