// Tiny static server for local previews: `node serve.ts` serves the app/
// folder at http://localhost:8080 (override with --port N). Purely a
// development convenience — the app also works straight from the file system.
//
// Behaviour notes:
//   - Missing paths get a real HTML 404 page (not a bare text body), so a
//     typo'd URL is obvious in the browser instead of looking like a blank app.
//   - Static assets are served with an ETag and a short public cache; a
//     matching If-None-Match gets a bodyless 304. HTML is never cached, so
//     edits to index.html show up on the next reload without a hard refresh.
//   - HEAD requests return the same headers as GET, with no body.
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

function send404(res, route, headOnly) {
  const body = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8">',
    '<title>404 — Vice Frame</title>',
    '<style>body{font-family:system-ui,sans-serif;background:#0a0514;color:#f5eeff;',
    'display:grid;place-items:center;min-height:100vh;margin:0;text-align:center}',
    'h1{color:#ff2e88;letter-spacing:2px}p{color:#b9a8da}</style></head>',
    '<body><main><h1>404 — NOT FOUND</h1>',
    `<p>No file matches <code>${route.replace(/[<>&"]/g, '')}</code> in the Vice Frame app folder.</p>`,
    '<p><a href="/" style="color:#22d3ee">Back to the cover maker</a></p>',
    '</main></body></html>',
  ].join('');
  res.writeHead(404, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(headOnly ? undefined : body);
}

const server = createServer((req, res) => {
  const headOnly = req.method === 'HEAD';
  if (req.method !== 'GET' && !headOnly) {
    res.writeHead(405, { allow: 'GET, HEAD' }).end('method not allowed');
    return;
  }
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
  let info;
  try {
    info = statSync(filePath);
    if (!info.isFile()) throw new Error('not a file');
  } catch {
    send404(res, route, headOnly);
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  // HTML is the entry point and changes whenever the app does — never cache
  // it. Everything else is a static asset that can sit in the browser cache
  // briefly and revalidate cheaply through the ETag.
  const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=300, must-revalidate';
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { etag, 'cache-control': cacheControl });
    res.end();
    return;
  }
  res.writeHead(200, {
    'content-type': MIME.get(ext) ?? 'application/octet-stream',
    'content-length': info.size,
    'cache-control': cacheControl,
    etag,
    'last-modified': info.mtime.toUTCString(),
    'x-content-type-options': 'nosniff',
  });
  if (headOnly) {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Vice Frame app served at http://localhost:${port}`);
});
