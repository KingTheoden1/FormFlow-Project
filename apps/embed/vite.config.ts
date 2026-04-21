import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build as a library — output is a single self-contained formflow.js file.
// Hosts embed it with: <script src="https://cdn.../formflow.js" data-form-id="..."></script>
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/embed.tsx',
      name: 'FormFlow',
      fileName: 'formflow',
      formats: ['iife'], // IIFE = works as plain <script> tag, no module bundler needed
    },
    rollupOptions: {
      // Bundle React inline — the host page may not have React.
      // This makes the file larger (~140kb gzipped) but fully self-contained.
      external: [],
    },
  },
})
