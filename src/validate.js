'use strict';
const { CURRENCY_SCALE, TYPES } = require('./events');

/** Strip control characters and angle brackets, collapse whitespace, cap length. */
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Validate untrusted input.
 * @param {object} raw request body
 * @returns {{errors: string[], value?: object}} all errors at once, or a sanitised value
 */
function validate(raw) {
  const errors = [];
  const b = raw && typeof raw === 'object' ? raw : {};
  const type = clean(b.type, 20).toLowerCase();
  if (!TYPES[type]) errors.push('type must be wedding, birthday or community');
  const budget = Number(b.budget);
  if (!Number.isFinite(budget) || budget < 1000 || budget > 1e9) errors.push('budget must be a number between 1000 and 1,000,000,000');
  const guests = Number(b.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 5000) errors.push('guests must be a whole number between 1 and 5000');
  const date = clean(b.date, 10);
  const when = new Date(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(when.getTime())) errors.push('date must be a valid YYYY-MM-DD');
  const currency = clean(b.currency || 'INR', 3).toUpperCase();
  if (!CURRENCY_SCALE[currency]) errors.push('currency must be INR, USD, EUR or GBP');
  if (errors.length) return { errors };
  return { errors, value: { type, budget, guests, date, when, currency, city: clean(b.city, 60), theme: clean(b.theme, 80), notes: clean(b.notes, 300) } };
}

module.exports = { clean, validate };
