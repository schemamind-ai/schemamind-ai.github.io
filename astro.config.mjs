// @ts-check
import { defineConfig } from 'astro/config';

// The site is served from the organization's root GitHub Pages domain,
// so no `base` path is needed.
export default defineConfig({
  site: 'https://schemamind-ai.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
});
