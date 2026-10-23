// Minimal static server for dist/, used by the end-to-end tests.
// It mirrors GitHub Pages: directory index files, and 404.html with status 404.
// Usage: node scripts/serve-dist.mjs [port]

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] ?? 4321);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, safe);
  if (!file.startsWith(dist)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return existsSync(file) ? file : null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = resolveFile(pathname);
  const status = file ? 200 : 404;
  const body = file ?? join(dist, '404.html');
  res.writeHead(status, { 'Content-Type': types[extname(body)] ?? 'application/octet-stream' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(body)
    .on('error', () => res.end())
    .pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist/ at http://localhost:${port}`);
});
