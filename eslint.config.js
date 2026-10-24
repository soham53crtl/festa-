'use strict';
const globals = Object.fromEntries(['require', 'module', 'process', 'console', 'fetch', 'AbortSignal', 'structuredClone', 'Buffer', '__dirname', 'document', 'window', 'localStorage', 'FormData', 'Intl', 'setTimeout'].map((g) => [g, 'readonly']));

module.exports = [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals },
  rules: { 'no-unused-vars': 'error', 'no-undef': 'error', eqeqeq: 'error', 'prefer-const': 'error', 'no-var': 'error' }
}];
