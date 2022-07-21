/* eslint-disable no-undef */
const { test, expect } = require('./baseFixtures');
const { getOrCreateDomainObject } = require('./appActions');

exports.test = test.extend({
    domainObjectName: [null, { option: true }],
    domainObject: [async ({ page, domainObjectName }, use) => {
        if (domainObjectName === null) {
            await use(page);

            return;
        }

        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        const uuid = await getOrCreateDomainObject(page, domainObjectName);
        await use({ uuid });
    }, { auto: true }]
});
exports.expect = expect;
