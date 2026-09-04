import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const dataDir = fileURLToPath(new URL('../dist/data', import.meta.url));

/**
 * Dev-only: serve the atlas-build artifacts (dist/data) at /data, fresh from
 * disk on every request so `npm run build:data` output shows up on reload.
 * Production needs no equivalent — the app builds into the same dist/ that
 * atlas-build emits data into, so /data is just static files there.
 */
function serveAtlasData(): Plugin {
  return {
    name: 'atlas:serve-data',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const name = /^\/([a-z0-9-]+\.json)$/.exec((req.url ?? '').split('?')[0] ?? '')?.[1];
        if (!name) return next();
        const file = join(dataDir, name);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('content-type', 'text/plain');
          res.end(`${name} not found — run \`npm run build:data\` at the repo root first.`);
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.setHeader('cache-control', 'no-store');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  // Relative base: the site works at any path (GitHub Pages project URL
  // included) because routing is hash-based (ARCHITECTURE.md §5.2).
  base: './',
  publicDir: false,
  plugins: [serveAtlasData()],
  build: {
    outDir: '../dist',
    // dist/data is emitted by atlas-build; never wipe it from here.
    emptyOutDir: false,
    target: 'es2022',
  },
  preview: {
    // Explicit IPv4 loopback: 'localhost' can resolve to ::1 on CI runners,
    // which would strand the Playwright webServer poll on 127.0.0.1.
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
