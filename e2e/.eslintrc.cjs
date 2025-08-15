/* eslint-disable no-undef */
module.exports = {
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/max-nested-describe': ['error', { max: 1 }],
    'playwright/expect-expect': 'off'
  },
  overrides: [
    {
      //Apply Best Practices to externalFixtures and exampleTemplate.e2e.spec.js
      files: [
        'appActions.js',
        'baseFixtures.js',
        'pluginFixtures.js',
        '**/exampleTemplate.e2e.spec.js'
      ],
      rules: {
        'playwright/no-raw-locators': 'error',
        'playwright/no-nth-methods': 'error',
        'playwright/no-get-by-title': 'error',
        'playwright/prefer-comparison-matcher': 'error'
      }
    },
    {
      // Disable no-raw-locators for .contract.perf.spec.js files until https://github.com/grafana/xk6-browser/issues/1226
      files: ['**/*.contract.perf.spec.js'],
      rules: {
        'playwright/no-raw-locators': 'off'
      }
    }
  ]
};
