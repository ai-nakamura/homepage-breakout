import { defineConfig } from 'vite';

export default defineConfig({
  base: '/breakout/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
