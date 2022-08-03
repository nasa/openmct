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

const { test, expect } = require('../../baseFixtures.js');
const { createDomainObjectWithDefaults } = require('../../appActions.js');

test.describe('appActions tests', () => {
    test('createDomainObjectsWithDefaults can create multiple objects in a row', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        await createDomainObjectWithDefaults(page, 'Timer', 'Timer Foo');
        await createDomainObjectWithDefaults(page, 'Timer', 'Timer Bar');
        await createDomainObjectWithDefaults(page, 'Timer', 'Timer Baz');

        // Expand the tree
        await page.click('.c-disclosure-triangle');

        // Verify the objects were created
        await expect(page.locator('a :text("Timer Foo")')).toBeVisible();
        await expect(page.locator('a :text("Timer Bar")')).toBeVisible();
        await expect(page.locator('a :text("Timer Baz")')).toBeVisible();
    });
});
