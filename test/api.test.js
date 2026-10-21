'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/plan');

function run(req) {
  return new Promise((resolve) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b }); } };
    handler(req, res);
  });
}

test('Vercel handler returns a plan for valid POST', async () => {
  const r = await run({ method: 'POST', body: { type: 'community', budget: 80000, guests: 150, date: '2099-03-01', currency: 'INR' } });
  assert.equal(r.code, 200);
  assert.ok(r.body.budget.length && r.body.timeline.length);
});

test('Vercel handler rejects GET, bad JSON and invalid input', async () => {
  assert.equal((await run({ method: 'GET' })).code, 405);
  assert.equal((await run({ method: 'POST', body: '{bad' })).code, 400);
  assert.equal((await run({ method: 'POST', body: { type: 'x' } })).code, 422);
});
