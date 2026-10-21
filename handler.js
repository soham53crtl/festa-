'use strict';
// Single request handler shared by server.js (Node/Docker) and api/plan.js (Vercel).
const { validate, buildPlan, enhance } = require('./planner');

const MAX_BODY = 8192;

async function handlePlan(body, env = process.env, fetchImpl = fetch) {
  const { errors, value } = validate(body);
  if (errors.length) return { status: 422, body: { errors } };
  return { status: 200, body: await enhance(buildPlan(value), value, env, fetchImpl) };
}

module.exports = { handlePlan, MAX_BODY };
