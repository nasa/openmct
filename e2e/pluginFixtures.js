/* eslint-disable no-undef */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * The file contains custom fixtures which extend the base functionality of the Playwright fixtures
 * and appActions. These fixtures should be generalized across all plugins.
 */

const { test, expect } = require('./baseFixtures');
const { createDomainObjectWithDefaults } = require('./appActions');

/**
 * @typedef {Object} ObjectCreateOptions
 * @property {string} type
 * @property {string} name
 */

/**
 * Used to create a new domain object as a part of getOrCreateDomainObject.
 * @type {Map<string, string>}
 */
const createdObjects = new Map();

/**
 * This action will create a domain object for the test to reference and return the uuid. If an object
 * of a given name already exists, it will return the uuid of that object to the test instead of creating
 * a new file. The intent is to move object creation out of test suites which are not explicitly worried
 * about object creation, while providing a consistent interface to retrieving objects in a persistentContext.
 * @param {import('@playwright/test').Page} page
 * @param {ObjectCreateOptions} options
 * @returns {Promise<string>} uuid of the domain object
 */
async function getOrCreateDomainObject(page, options) {
    const { type, name } = options;
    const objectName = name ? `${type}:${name}` : type;

    if (createdObjects.has(objectName)) {
        return createdObjects.get(objectName);
    }

    await createDomainObjectWithDefaults(page, type, name);

    // Once object is created, get the uuid from the url
    const uuid = await page.evaluate(() => {
        return window.location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)[0];
    });

    createdObjects.set(objectName, uuid);

    return uuid;
}

/**
 * If provided, these options will be used to get or create the desired domain object before
 * any tests or test hooks have run.
 * The `uuid` of the `domainObject` will then be available to use within the scoped tests.
 *
 * ### Example:
 * ```js
 * test.describe("My test suite", () => {
 *    test.use({ objectCreateOptions: { type: "Telemetry Table", name: "My Telemetry Table" }});
 *    test("'My Telemetry Table' is created and provides a uuid", async ({ page, domainObject }) => {
 *         const { uuid } = domainObject;
 *         expect(uuid).toBeDefined();
 *     }))
 * });
 * ```
 * @type {ObjectCreateOptions}
 */
const objectCreateOptions = null;

/**
 * The name of the "My Items" folder in the domain object tree.
 *
 * Default: `"My Items"`
 *
 * @type {string}
 */
const myItemsFolderName = "My Items";

exports.test = test.extend({
    myItemsFolderName: [myItemsFolderName, { option: true }],
    // eslint-disable-next-line no-shadow
    openmctConfig: async ({ myItemsFolderName }, use) => {
        await use({ myItemsFolderName });
    },
    objectCreateOptions: [objectCreateOptions, {option: true}],
    // eslint-disable-next-line no-shadow
    domainObject: [async ({ page, objectCreateOptions }, use) => {
        // FIXME: This is a false-positive caused by a bug in the eslint-plugin-playwright rule.
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (objectCreateOptions === null) {
            await use(page);

            return;
        }

        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        const uuid = await getOrCreateDomainObject(page, objectCreateOptions);
        await use({ uuid });
    }, { auto: true }]
});
exports.expect = expect;
