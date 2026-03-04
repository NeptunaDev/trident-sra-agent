import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  root: 'src/frontend',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/frontend/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend'),
    },
  },
});
