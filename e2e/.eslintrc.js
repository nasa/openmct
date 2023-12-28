/* eslint-disable no-undef */
module.exports = {
  extends: ['plugin:playwright/playwright-test'],
  rules: {
    'playwright/max-nested-describe': ['error', { max: 1 }],
    'playwright/no-nth-methods': 'error',
    'playwright/no-raw-locators': 'error'
  },
  overrides: [
    {
      files: ['tests/visual-a11y/*.spec.js'],
      rules: {
        'playwright/no-wait-for-timeout': 'off',
        'playwright/expect-expect': 'off'
      }
    }
  ]
};
