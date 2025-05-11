module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    'max-len': [1, { code: 120 }],            // 1 = warn
    'require-jsdoc': 0,                       // 0 = off
    'valid-jsdoc': 0,                         // 0 = off
    'no-unused-vars': 1                       // 1 = warn
  },
};
