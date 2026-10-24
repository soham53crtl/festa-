'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { handlePlan, MAX_BODY } = require('./handler');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const FILES = { '/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css' };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const HEADERS = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store'
};
// Static files are read and gzipped once at startup, then served from memory.
const STATIC = Object.fromEntries(Object.entries(FILES).map(([url, f]) => {
  const raw = fs.readFileSync(path.join(PUBLIC, f));
  return [url, { type: MIME[path.extname(f)], raw, gz: zlib.gzipSync(raw) }];
}));
function sendStatic(req, res, asset) {
  const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const headers = { ...HEADERS, 'Cache-Control': 'public, max-age=300', 'Content-Type': asset.type, Vary: 'Accept-Encoding' };
  if (gzip) headers['Content-Encoding'] = 'gzip';
  res.writeHead(200, headers);
  res.end(gzip ? asset.gz : asset.raw);
}

const hits = new Map(); // naive per-IP rate limit: 20 plans / minute
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 1000) for (const [k, ts] of hits) if (now - ts[ts.length - 1] > 60000) hits.delete(k); // bound memory
  return recent.length > 20;
}

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { ...HEADERS, 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, max = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('too large')); } else if (size <= max) chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && STATIC[url]) return sendStatic(req, res, STATIC[url]);
  if (req.method === 'GET' && url === '/healthz') return send(res, 200, { ok: true });
  if (req.method === 'POST' && url === '/api/plan') {
    if (limited(req.socket.remoteAddress)) return send(res, 429, { error: 'Too many requests. Try again in a minute.' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'Send valid JSON under 8 KB.' }); }
    const r = await handlePlan(body);
    return send(res, r.status, r.body);
  }
  send(res, 404, { error: 'Not found' });
});

if (require.main === module) server.listen(PORT, () => console.log(`Festa planner on :${PORT}`));
module.exports = server;
