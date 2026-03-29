import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Avoid custom manualChunks for React — splitting react vs other vendors often causes
    // "Cannot read properties of undefined (reading 'forwardRef')" in production.
    chunkSizeWarningLimit: 600,
  },
});
