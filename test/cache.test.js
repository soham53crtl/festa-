'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TtlCache } = require('../src/cache');
const { handlePlan } = require('../handler');

test('TtlCache expires entries and evicts the oldest when full', async () => {
  const c = new TtlCache(2, 20);
  c.set('a', 1); c.set('b', 2); c.set('c', 3);
  assert.equal(c.get('a'), undefined);
  assert.equal(c.get('c'), 3);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(c.get('c'), undefined);
});

test('identical requests reuse the cached AI plan (one upstream call)', async () => {
  let calls = 0;
  const fake = async () => { calls++; return { ok: true, json: async () => ({ choices: [{ message: { content: '{"ideas":["x"],"tip":"t"}' } }] }) }; };
  const body = { type: 'birthday', budget: 40000, guests: 77, date: '2099-05-05', currency: 'INR' };
  const a = await handlePlan(body, { GROQ_API_KEY: 'k' }, fake);
  const b = await handlePlan(body, { GROQ_API_KEY: 'k' }, fake);
  assert.equal(calls, 1);
  assert.deepEqual(a.body, b.body);
});

test('failed AI results are not cached', async () => {
  let calls = 0;
  const bad = async () => { calls++; return { ok: false, status: 500 }; };
  const body = { type: 'birthday', budget: 41000, guests: 78, date: '2099-05-05', currency: 'INR' };
  await handlePlan(body, { GROQ_API_KEY: 'k' }, bad);
  await handlePlan(body, { GROQ_API_KEY: 'k' }, bad);
  assert.equal(calls, 2);
});
