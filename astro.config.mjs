// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// The site is served from the organization's root GitHub Pages domain,
// so no `base` path is needed.
export default defineConfig({
  site: 'https://schemamind-ai.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  vite: {
    // Absolute path of public/, so components can read files independent of the working directory.
    define: { __PUBLIC_DIR__: JSON.stringify(fileURLToPath(new URL('./public/', import.meta.url))) },
  },
});
