import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      proxy: {
        '/api/mfapi': {
          target: 'https://api.mfapi.in',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/mfapi/, ''),
        },
        '/api/mfdata': {
          target: 'https://mfdata.in',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/mfdata/, ''),
        },
        '/api/getmfdata': {
          target: 'https://getmfdata.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/getmfdata/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', env.VITE_GETMFDATA_API_KEY ?? '')
            })
          },
        },
      },
    },
  }
})
