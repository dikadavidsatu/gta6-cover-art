// Tiny static server for local previews: `node serve.ts` serves the app/
// folder at http://localhost:8080 (override with --port N). Purely a
// development convenience — the app also works straight from the file system.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), 'app'));
const flagAt = process.argv.indexOf('--port');
const wanted = flagAt === -1 ? 8080 : Number(process.argv[flagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

const server = createServer((req, res) => {
  let route;
  try {
    route = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (route.endsWith('/')) route += 'index.html';
  const filePath = resolve(join(root, `.${route}`));
  if (filePath !== root && !filePath.startsWith(root + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Vice Frame app served at http://localhost:${port}`);
});
