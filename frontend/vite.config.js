import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3001,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
  },
  build: {
    commonjsOptions: {
      include: [/sockjs-client/, /node_modules/],
    },
  },
})
