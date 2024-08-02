/* eslint-disable no-undef */
module.exports = {
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/max-nested-describe': ['error', { max: 1 }],
    'playwright/expect-expect': 'off'
  },
  overrides: [
    {
      files: ['appActions.js', 'baseFixtures.js', 'pluginFixtures.js'],
      rules: {
        'playwright/no-raw-locators': 2
      }
    }
  ]
};
