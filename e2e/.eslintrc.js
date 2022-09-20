/* eslint-disable no-undef */
module.exports = {
    "extends": ["plugin:playwright/playwright-test"],
    "rules": {
        "playwright/max-nested-describe": ["error", { "max": 1 }],
        "object-property-newline": "off"
    },
    "overrides": [
        {
            "files": ["tests/visual/*.spec.js"],
            "rules": {
                "playwright/no-wait-for-timeout": "off"
            }
        }
    ]
};
