'use strict';
// Facade: keeps one import point for the split modules in src/.
const { TYPES } = require('./src/events');
const { validate } = require('./src/validate');
const { buildPlan } = require('./src/plan');
const ai = require('./src/ai');

module.exports = { validate, buildPlan, TYPES, ...ai };
