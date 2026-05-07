import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: env.VITE_BASE || '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Forward /api/grist/* to Grist in dev mode (API key read from .env)
        '/api/grist': {
          target: 'https://grist.numerique.gouv.fr/api',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/grist/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.VITE_GRIST_API_KEY;
              if (apiKey) proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            });
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
