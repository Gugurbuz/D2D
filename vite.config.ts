import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
