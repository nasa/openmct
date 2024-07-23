/* eslint-disable no-undef */
module.exports = {
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/max-nested-describe': ['error', { max: 1 }]
  },
  overrides: [
    {
      files: ['**/*.spec.js'], // Added the 'files' property
      rules: {
        'playwright/expect-expect': 'off'
      }
    }
  ]
};
