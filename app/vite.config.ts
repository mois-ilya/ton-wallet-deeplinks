import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
 
export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable global polyfills for Buffer and other Node.js globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    react(),
  ],
  base: '/ton-wallet-deeplinks/',
});
