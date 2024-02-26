/* eslint-disable no-undef */
module.exports = {
  extends: ['plugin:playwright/playwright-test'],
  rules: {
    'playwright/max-nested-describe': ['error', { max: 1 }]
  },
  overrides: [
    {
      files: ['**/*.visual.spec.js'],
      rules: {
        'playwright/expect-expect': 'off'
      }
    },
    {
      files: ['**/*.perf.spec.js'],
      rules: {
        'playwright/expect-expect': 'off'
      }
    }
  ]
};
