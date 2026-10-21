'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { handlePlan } = require('../handler');
const { validate, buildPlan, aiPrompt } = require('../planner');

const base = { type: 'wedding', budget: 600000, guests: 120, date: '2099-02-14', currency: 'INR' };

test('handlePlan returns 422 for invalid input and 200 for valid input', async () => {
  assert.equal((await handlePlan({}, {})).status, 422);
  const r = await handlePlan(base, {});
  assert.equal(r.status, 200);
  assert.equal(r.body.source, 'rules');
});

test('notes and theme add matching checklist items', () => {
  const plan = buildPlan(validate({ ...base, notes: 'Outdoor lawn, vegetarian menu, elderly guests, kids' }).value);
  const custom = plan.vendors.filter((x) => x.custom).map((x) => x.name).join('|');
  for (const word of ['vegetarian', 'Weather backup', 'Accessible', 'Kids']) assert.match(custom, new RegExp(word));
});

test('AI prompt carries budget per guest and a budget-realism rule', () => {
  const prompt = aiPrompt(validate(base).value);
  assert.match(prompt, /"budgetPerGuest":5000/);
  assert.match(prompt, /realistic for the budget/);
});

test('index.html basics: lang, viewport, h1, skip link, every field labelled', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /<html lang="en"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<h1>/);
  assert.match(html, /class="skip"/);
  const labelled = html.match(/<label[^>]*>[\s\S]*?<\/label>/g).join('');
  for (const tag of html.match(/<(input|select|textarea)\b/g)) assert.ok(labelled.includes(tag), `${tag} outside a label`);
});
