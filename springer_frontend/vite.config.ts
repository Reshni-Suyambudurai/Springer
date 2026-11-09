import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devBackendUrl = env.VITE_DEV_BACKEND_URL

  return {
    plugins: [react()],
    server: command === 'serve' && devBackendUrl ? {
      proxy: {
        '/api': {
          target: devBackendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: devBackendUrl.replace(/^http/, 'ws'),
          ws: true,
        },
      },
    } : undefined,
  }
})
