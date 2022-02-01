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

/*
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets.
*/

const { test, expect } = require('@playwright/test');

test.describe('condition set', () => {
    test('create new button `condition set` creates new condition object', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Condition Set
        await page.click('text=Condition Set');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/dab945d4-5a84-480e-8180-222b4aa730fa?tc.mode=fixed&tc.startBound=1639696164435&tc.endBound=1639697964435&tc.timeSystem=utc&view=conditionSet.view' }*/),
            page.click('text=OK')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');
    });
});
