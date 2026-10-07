import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // em desenvolvimento, /api vai para a API local (não precisa de CORS nem de VITE_API_URL)
      proxy: { '/api': { target: env.VITE_API_PROXY || 'http://localhost:3000', changeOrigin: true } },
    },
    test: { environment: 'node' },
  };
});
