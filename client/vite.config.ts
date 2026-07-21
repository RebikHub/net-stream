import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    cssCodeSplit: false,           // всё CSS в один файл
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // все JS в один бандл
        entryFileNames: 'index.js', // имя JS без хэша
        assetFileNames: (assetInfo) => {
          // CSS называем строго index.css
          if (assetInfo.name?.endsWith('.css')) return 'index.css';
          // другие ассеты (если появятся) — тоже без хэша, но они нам не нужны
          return '[name][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'clean-dist',
      apply: 'build',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) return;

        const keep = ['index.js', 'index.css'];
        const files = fs.readdirSync(distDir);

        for (const file of files) {
          if (!keep.includes(file)) {
            const filePath = path.join(distDir, file);
            fs.rmSync(filePath, { recursive: true, force: true });
          }
        }
      },
    },
  ],
});
