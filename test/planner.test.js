'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseJsonLoose, validate, buildPlan, mergeAi, enhanceWithGemini, enhanceWithOpenAICompat, enhance, TYPES } = require('../planner');

const good = { type: 'wedding', budget: 1000000, guests: 200, date: '2027-02-14', currency: 'INR', city: 'Kolkata', theme: 'Marigold', notes: '' };
const today = new Date('2026-10-21T00:00:00Z');

test('budget shares sum to 100% for every event type', () => {
  for (const [k, t] of Object.entries(TYPES)) {
    const sum = Object.values(t.split).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${k} sums to ${sum}`);
  }
});

test('validate rejects bad input and collects every error', () => {
  const { errors } = validate({ type: 'x', budget: 'abc', guests: 0, date: 'nope', currency: 'XXX' });
  assert.equal(errors.length, 5);
});

test('validate strips markup and control characters', () => {
  const { value } = validate({ ...good, theme: '<script>alert(1)</script>\u0000ok' });
  assert.ok(!/[<>\u0000]/.test(value.theme));
});

test('plan allocates the whole budget (within rounding) and orders the timeline', () => {
  const plan = buildPlan(validate(good).value, today);
  const total = plan.budget.reduce((a, l) => a + l.amount, 0);
  assert.ok(Math.abs(total - good.budget) <= plan.budget.length);
  const dates = plan.timeline.map((m) => m.due);
  assert.deepEqual(dates, [...dates].sort());
});

test('short lead time marks catch-up tasks and warns', () => {
  const plan = buildPlan(validate({ ...good, date: '2026-11-10' }).value, today);
  assert.ok(plan.timeline.some((m) => m.status === 'catch-up'));
  assert.ok(plan.warnings.length > 0);
});

test('low budget per guest triggers a warning', () => {
  const plan = buildPlan(validate({ ...good, budget: 50000, guests: 300 }).value, today);
  assert.ok(plan.warnings.some((w) => /per guest/.test(w)));
});

test('mergeAi ignores malformed model output', () => {
  const plan = buildPlan(validate(good).value, today);
  const before = plan.ideas.slice();
  mergeAi(plan, { ideas: [1, { a: 1 }], tip: 5 });
  assert.deepEqual(plan.ideas, before);
  assert.equal(plan.source, 'rules');
});

test('Gemini success replaces ideas; failure falls back safely', async () => {
  const v = validate(good).value;
  const ok = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ideas: ['A', 'B'], tip: 'Tip' }) }] } }] }) });
  const p1 = await enhanceWithGemini(buildPlan(v, today), v, { apiKey: 'k', model: 'm', fetchImpl: ok });
  assert.equal(p1.source, 'gemini');
  const boom = async () => { throw new Error('network'); };
  const p2 = await enhanceWithGemini(buildPlan(v, today), v, { apiKey: 'k', model: 'm', fetchImpl: boom });
  assert.equal(p2.source, 'rules');
});

test('Groq/Grok adapter sends bearer auth, merges ideas, and falls back on error', async () => {
  const v = validate(good).value;
  let seen;
  const ok = async (url, opts) => { seen = { url, opts }; return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ ideas: ['X'], tip: 'T' }) } }] }) }; };
  const p = await enhance(buildPlan(v, today), v, { GROQ_API_KEY: 'gk' }, ok);
  assert.equal(p.source, 'groq');
  assert.match(seen.url, /api\.groq\.com/);
  assert.equal(seen.opts.headers.authorization, 'Bearer gk');
  const x = await enhance(buildPlan(v, today), v, { XAI_API_KEY: 'xk' }, ok);
  assert.equal(x.source, 'xai');
  assert.match(seen.url, /api\.x\.ai/);
  const bad = async () => ({ ok: false });
  const f = await enhanceWithOpenAICompat(buildPlan(v, today), v, { name: 'groq', url: 'u', apiKey: 'k', model: 'm', fetchImpl: bad });
  assert.equal(f.source, 'rules');
});

test('parseJsonLoose strips <think> blocks and surrounding prose', () => {
  assert.deepEqual(parseJsonLoose('<think>hmm {x}</think>Sure! {"ideas":["a"]} done'), { ideas: ['a'] });
});
