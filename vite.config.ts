import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Base path of the deployed site. "/" serves VADL from the root of a host; a
 * sub-folder such as "/vadl/" is set at build time with `VADL_BASE=/vadl/`.
 * The name has no VITE_ prefix on purpose: it configures the build and is not
 * placed in the browser bundle (Vite exposes it only as import.meta.env.BASE_URL).
 */
function basePath(): string {
  const raw = process.env.VADL_BASE?.trim();
  if (!raw) return '/';
  const lead = raw.startsWith('/') ? raw : `/${raw}`;
  return lead.endsWith('/') ? lead : `${lead}/`;
}

/**
 * Static hosts without rewrite rules (GitHub Pages, for example) answer an
 * unknown path such as /modules/pneumatics with 404.html. A copy of index.html
 * under that name lets the application's router show the right page.
 */
function spaFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'vadl-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  base: basePath(),
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
