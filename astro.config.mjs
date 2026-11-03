import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://crisisknight.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // about.html, not about/index.html, so server.mjs can serve clean URLs
    format: 'file',
    // keep CSS and JS in external files so the CSP needs no 'unsafe-inline'
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
  // server.mjs owns static files, security headers and rate limiting
  adapter: node({ mode: 'middleware', bodySizeLimit: 16 * 1024 }),
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
  },
});
