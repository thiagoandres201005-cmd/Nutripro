import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'data/*.json', dest: 'data' },
        { src: 'data/categorias/*.json', dest: 'data/categorias' },
      ],
    }),
  ],
});
