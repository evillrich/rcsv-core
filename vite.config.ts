import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/demo',
  build: {
    lib: {
      entry: {
        core: resolve(__dirname, 'src/core/index.ts'),
        renderer: resolve(__dirname, 'src/renderer/index.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['chart.js'],
      output: {
        globals: {
          'chart.js': 'Chart'
        }
      }
    },
    outDir: resolve(__dirname, 'dist')
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  }
});