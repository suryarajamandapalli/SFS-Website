const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const ROOT_DIR = __dirname;

const handleRequest = (req, res) => {
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    decodedUrl = req.url.split('?')[0];
  }

  let filePath = path.join(ROOT_DIR, decodedUrl === '/' ? 'index.html' : decodedUrl);

  // Security check: ensure path is inside ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${decodedUrl}`);
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`500 Server Error: ${readErr.message}`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
};

const server = http.createServer(handleRequest);
const serverCompanion = http.createServer(handleRequest);

const cliPort = parseInt(process.argv[2], 10);
const PRIMARY_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (cliPort || 6000);
const COMPANION_PORT = PRIMARY_PORT === 6000 ? 6060 : null;

server.listen(PRIMARY_PORT, () => {
  console.log(`\n======================================================`);
  console.log(` SFS Website Local Server is running!`);
  console.log(` Primary URL: http://localhost:${PRIMARY_PORT}`);
  if (COMPANION_PORT) {
    console.log(` Safe Browser Alias (bypasses Chrome ERR_UNSAFE_PORT on 6000): http://localhost:${COMPANION_PORT}`);
  }
  console.log(` Serving directory: ${ROOT_DIR}`);
  console.log(` Tech Stack: Pure HTML5, CSS3, JavaScript (GSAP 3)`);
  console.log(`======================================================\n`);
});

if (COMPANION_PORT) {
  serverCompanion.listen(COMPANION_PORT, () => {
    console.log(` Companion browser listener active on port ${COMPANION_PORT}`);
  });
  serverCompanion.on('error', (err) => {
    console.log(`Companion port ${COMPANION_PORT} status:`, err.message);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PRIMARY_PORT} is currently in use, trying port ${PRIMARY_PORT + 1}...`);
    server.removeAllListeners('error');
    server.listen(PRIMARY_PORT + 1);
  } else {
    console.error('Server error:', err);
  }
});
