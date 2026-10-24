'use strict';
// Single request handler shared by server.js (Node/Docker) and api/plan.js (Vercel).
const { validate, buildPlan, enhance } = require('./planner');
const { TtlCache } = require('./src/cache');

const MAX_BODY = 8192;
const AI_KEYS = ['GROQ_API_KEY', 'XAI_API_KEY', 'GEMINI_API_KEY'];
const cache = new TtlCache(); // identical requests within 10 min reuse the plan (saves an AI call)

/**
 * Validate, build and (optionally) AI-enhance a plan.
 * @returns {Promise<{status: number, body: object}>}
 */
async function handlePlan(body, env = process.env, fetchImpl = fetch) {
  const { errors, value } = validate(body);
  if (errors.length) return { status: 422, body: { errors } };
  const key = JSON.stringify([value, new Date().toISOString().slice(0, 10)]);
  const hit = cache.get(key);
  if (hit) return { status: 200, body: structuredClone(hit) };
  const plan = await enhance(buildPlan(value), value, env, fetchImpl);
  // Do not cache a rules-only result when AI is configured: the AI call probably failed.
  if (plan.source !== 'rules' || !AI_KEYS.some((k) => env[k])) cache.set(key, structuredClone(plan));
  return { status: 200, body: plan };
}

module.exports = { handlePlan, MAX_BODY };
