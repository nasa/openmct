/* eslint-disable no-undef */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

const { test, expect, request } = require('./baseFixtures');
// const { createDomainObjectWithDefaults } = require('./appActions');
const path = require('path');

/**
 * @typedef {Object} ObjectCreateOptions
 * @property {string} type
 * @property {string} name
 */

/**
 * **NOTE: This feature is a work-in-progress and should not currently be used.**
 *
 * Used to create a new domain object as a part of getOrCreateDomainObject.
 * @type {Map<string, string>}
 */
// const createdObjects = new Map();

/**
 * This action will create a domain object for the test to reference and return the uuid. If an object
 * of a given name already exists, it will return the uuid of that object to the test instead of creating
 * a new file. The intent is to move object creation out of test suites which are not explicitly worried
 * about object creation, while providing a consistent interface to retrieving objects in a persistentContext.
 * @param {import('@playwright/test').Page} page
 * @param {ObjectCreateOptions} options
 * @returns {Promise<string>} uuid of the domain object
 */
// async function getOrCreateDomainObject(page, options) {
//     const { type, name } = options;
//     const objectName = name ? `${type}:${name}` : type;

//     if (createdObjects.has(objectName)) {
//         return createdObjects.get(objectName);
//     }

//     await createDomainObjectWithDefaults(page, type, name);

//     const uuid = getHashUrlToDomainObject(page);

//     createdObjects.set(objectName, uuid);

//     return uuid;
// }

/**
 * **NOTE: This feature is a work-in-progress and should not currently be used.**
 *
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
// const objectCreateOptions = null;

/**
 * The default theme for VIPER and Open MCT is the 'espresso' theme. Overriding this value with 'snow' in our playwright config.js
 * will override the default theme by injecting the 'snow' theme on launch.
 *
 * ### Example:
 * ```js
 * projects: [
 * {
 *     name: 'chrome-snow-theme',
 *     use: {
 *         browserName: 'chromium',
 *         theme: 'snow'
 * ```
 * @type {'snow' | 'espresso'}
 */
const theme = 'espresso';

/**
 * The name of the "My Items" folder in the domain object tree.
 *
 * Default: `"My Items"`
 *
 * @type {string}
 */
const myItemsFolderName = 'My Items';

exports.test = test.extend({
  // This should follow in the Project's configuration. Can be set to 'snow' in playwright config.js
  theme: [theme, { option: true }],
  // eslint-disable-next-line no-shadow
  page: async ({ page, theme }, use, testInfo) => {
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (theme === 'snow') {
      //inject snow theme
      await page.addInitScript({ path: path.join(__dirname, './helper', './useSnowTheme.js') });
    }

    // Attach info about the currently running test and its project.
    // This will be used by appActions to fill in the created
    // domain object's notes.
    page.testNotes = [`${testInfo.titlePath.join('\n')}`, `${testInfo.project.name}`].join('\n');

    await use(page);
  },
  myItemsFolderName: [myItemsFolderName, { option: true }],
  // eslint-disable-next-line no-shadow
  openmctConfig: async ({ myItemsFolderName }, use) => {
    await use({ myItemsFolderName });
  }
});

exports.expect = expect;
exports.request = request;

/**
 * Takes a readable stream and returns a string.
 * @param {ReadableStream} readable - the readable stream
 * @return {Promise<String>} the stringified stream
 */
exports.streamToString = async function (readable) {
  let result = '';
  for await (const chunk of readable) {
    result += chunk;
  }

  return result;
};
