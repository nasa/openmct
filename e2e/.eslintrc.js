/* eslint-disable no-undef */
module.exports = {
    "extends": ["plugin:playwright/playwright-test"],
    "overrides": [
        {
            "files": ["tests/visual/*.spec.js"],
            "rules": {
                "playwright/no-wait-for-timeout": "off"
            }
        }
    ]
};
