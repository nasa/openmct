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

const { test, expect } = require('./baseFixtures');
const { getOrCreateDomainObject } = require('./appActions');

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
 * @type {import('./appActions').ObjectCreateOptions}
 */
const objectCreateOptions = null;

exports.test = test.extend({
    objectCreateOptions: [objectCreateOptions, {option: true}],
    // eslint-disable-next-line no-shadow
    domainObject: [async ({ page, objectCreateOptions }, use) => {
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
