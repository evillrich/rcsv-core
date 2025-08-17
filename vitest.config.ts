import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentMatchGlobs: [
      // Use happy-dom for renderer tests that need DOM APIs
      ['**/renderer/**', 'happy-dom'],
      // Use node for core engine tests
      ['**/core/**', 'node']
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  }
});