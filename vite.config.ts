import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'strip-crossorigin-for-file-protocol',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin(="[^"]*")?/g, '')
      },
    },
  ],
  base: './',
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
})
