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

exports.test = test.extend({
    objectCreateOptions: [null, { option: true }],
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
