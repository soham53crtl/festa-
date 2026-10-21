'use strict';
// Vercel serverless entry; logic lives in handler.js.
const { handlePlan, MAX_BODY } = require('../handler');

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
  if (JSON.stringify(body ?? {}).length > MAX_BODY) return res.status(400).json({ error: 'Request too large.' });
  const r = await handlePlan(body);
  return res.status(r.status).json(r.body);
};
