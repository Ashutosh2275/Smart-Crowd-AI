import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isAnalyzeBuild = mode === 'analyze' || env.VITE_BUNDLE_ANALYZER === 'true'

  return {
    plugins: [
      react(),
      isAnalyzeBuild && visualizer({
        filename: 'dist/bundle-report.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    ].filter(Boolean),
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: !isProduction,
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 800,
      assetsInlineLimit: 4096,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (id.includes('react-router-dom')) return 'router'
            if (id.includes('firebase')) return 'firebase'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('recharts')) return 'charts'

            return 'vendor'
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'recharts'],
    },
  }
})
