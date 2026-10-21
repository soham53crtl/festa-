'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');

let base;
test.before(() => new Promise((r) => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => server.close());

const post = (body) => fetch(base + '/api/plan', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

test('serves the page with security headers', async () => {
  const r = await fetch(base + '/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
});

test('POST /api/plan returns a plan', async () => {
  const r = await post({ type: 'birthday', budget: 30000, guests: 25, date: '2099-01-01', currency: 'INR' });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.ok(j.budget.length && j.timeline.length && j.vendors.length && j.ideas.length);
});

test('rejects invalid input and oversized bodies', async () => {
  assert.equal((await post({ type: 'x' })).status, 422);
  assert.equal((await post('{bad')).status, 400);
  assert.equal((await post(JSON.stringify({ notes: 'a'.repeat(9000) }))).status, 400);
});

test('does not serve files outside the allow-list', async () => {
  assert.equal((await fetch(base + '/../server.js')).status, 404);
});
