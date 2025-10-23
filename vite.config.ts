import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    // Bei User-Seite am Root-Domain KEIN Subpfad nötig:
    base: '/',
    build: { outDir: 'docs' }
})
