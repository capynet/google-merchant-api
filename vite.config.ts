import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  plugins: [
    VitePluginNode({
      adapter: 'express',
      appPath: './src/app.ts',
      exportName: 'app',
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './src/app.ts',
    },
  },
});