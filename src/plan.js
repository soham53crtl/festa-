'use strict';
const { CURRENCY_SCALE, TYPES } = require('./events');

const money = (n) => Math.round(n);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const iso = (d) => d.toISOString().slice(0, 10);

// Free-text notes/theme adjust the checklist (rule-based, so it works without AI).
const NOTE_RULES = [
  [/vegetarian|veg only|jain/i, 'Caterer: confirm vegetarian / Jain menu and separate cooking'],
  [/outdoor|lawn|garden|terrace|beach/i, 'Weather backup: tent or covered indoor fallback'],
  [/elderly|senior|grandparent|wheelchair/i, 'Accessible seating, ramp and nearby parking'],
  [/kid|child|children/i, 'Kids corner with a supervised activity area']
];

function noteVendors(v) {
  const text = `${v.notes} ${v.theme}`;
  return NOTE_RULES.filter(([re]) => re.test(text)).map(([, name]) => ({ name, custom: true }));
}

/**
 * Build the deterministic plan: budget, timeline, vendors, warnings, fallback ideas.
 * @param {object} v validated input from validate()
 * @param {Date} [today] injectable clock for tests
 */
function buildPlan(v, today = new Date()) {
  const t = TYPES[v.type];
  const start = new Date(iso(today) + 'T00:00:00Z');
  const daysLeft = Math.round((v.when - start) / 86400000);

  const budget = Object.entries(t.split).map(([category, share]) => ({ category, share: Math.round(share * 100), amount: money(v.budget * share) }));
  const catering = budget.find((l) => /Catering|Food/.test(l.category));

  const timeline = t.milestones.map(([weeks, task]) => {
    const due = addDays(v.when, -weeks * 7);
    return { due: iso(due), task, status: due < start ? 'catch-up' : 'upcoming' };
  });

  const warnings = [];
  if (daysLeft < 0) warnings.push('The event date is in the past. Pick a future date.');
  else if (daysLeft < t.leadDays * 0.5) warnings.push(`Only ${daysLeft} days left; typical lead time is about ${t.leadDays}. Book venue and caterer first and treat "catch-up" tasks as this week's work.`);
  const perGuestFloor = t.minPerGuestINR * CURRENCY_SCALE[v.currency];
  if (v.budget / v.guests < perGuestFloor) warnings.push(`Budget per guest is low for a ${t.label.toLowerCase()}. Consider trimming the guest list or simplifying the menu.`);

  return {
    summary: { type: t.label, guests: v.guests, daysLeft, currency: v.currency, perGuest: money(v.budget / v.guests), cateringPerGuest: money(catering.amount / v.guests) },
    budget, timeline, vendors: t.vendors.map((name) => ({ name })).concat(noteVendors(v)), warnings,
    ideas: fallbackIdeas(v, t), source: 'rules'
  };
}

function fallbackIdeas(v, t) {
  const out = t.ideas.slice();
  if (v.theme) out.unshift(`Carry the "${v.theme}" theme through invitations, dress code and the food menu`);
  if (v.city) out.push(`Ask local vendors in ${v.city} for bundled quotes; compare at least three`);
  return out.slice(0, 6);
}

module.exports = { buildPlan };
