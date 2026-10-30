import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP = __dirname;
const PORT = Number(process.env.PORT) || 8765;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  (async () => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request');
      return;
    }

    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(APP, 'index.html');
    } else if (pathname.startsWith('/app/')) {
      filePath = path.join(APP, pathname.slice('/app/'.length));
    } else {
      filePath = path.join(ROOT, pathname.slice(1));
    }

    const resolved = path.normalize(filePath);
    const rel = path.relative(ROOT, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const info = await stat(resolved);
      if (!info.isFile()) throw new Error('not a file');

      const type = MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': info.size,
        'Cache-Control': 'no-cache',
      });
      res.end(await readFile(resolved));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  })();
});

server.listen(PORT, () => {
  console.log(`Open Exercises running at http://localhost:${PORT}`);
});
