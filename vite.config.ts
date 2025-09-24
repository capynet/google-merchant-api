import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  plugins: [
    react(),
    VitePluginNode({
      adapter: 'koa',
      appPath: './src/app.ts',
      exportName: 'app',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './src/app.ts',
    },
  },
});