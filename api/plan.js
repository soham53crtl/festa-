'use strict';
// Vercel serverless entry. Same logic as server.js's /api/plan, without the long-running server.
const { validate, buildPlan, enhance } = require('../planner');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Send valid JSON.' }); }
  }
  if (JSON.stringify(body ?? {}).length > 8192) return res.status(400).json({ error: 'Request too large.' });
  const { errors, value } = validate(body);
  if (errors.length) return res.status(422).json({ errors });
  const plan = await enhance(buildPlan(value), value);
  return res.status(200).json(plan);
};
