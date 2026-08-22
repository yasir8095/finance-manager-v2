import { build } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function buildMain() {
  await build({
    configFile: false,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        formats: ['cjs'],
        fileName: () => 'index.cjs',
      },
      outDir: 'dist/main',
      emptyOutDir: true,
      rollupOptions: {
        external: ['electron', 'better-sqlite3', 'path', 'fs', 'url'],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  })
  
  // Also build preload
  await build({
    configFile: false,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main/preload.ts'),
        formats: ['cjs'],
        fileName: () => 'preload.cjs',
      },
      outDir: 'dist/main',
      emptyOutDir: false,
      rollupOptions: {
        external: ['electron'],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  })
}

buildMain().catch(console.error)
