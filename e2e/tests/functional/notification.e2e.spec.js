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

/*
This test suite is dedicated to tests which verify Open MCT's Notification functionality
*/

// FIXME: Remove this eslint exception once tests are implemented
// eslint-disable-next-line no-unused-vars
const { createDomainObjectWithDefaults } = require('../../appActions');
const { test, expect } = require('../../pluginFixtures');

test.describe('Notifications List', () => {
    test.fixme('Notifications can be dismissed individually', async ({ page }) => {
        // Create some persistent notifications
        // Verify that they are present in the notifications list
        // Dismiss one of the notifications
        // Verify that it is no longer present in the notifications list
        // Verify that the other notifications are still present in the notifications list
    });
});

test.describe('Notification Overlay Regression Test', () => {
    test('Closing notification list after notification banner disappeared does not cause it to open automatically', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/6130'
        });

        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create a new Display Layout object
        await createDomainObjectWithDefaults(page, { type: 'Display Layout' });

        // Click on the button "Review 1 Notification"
        await page.click('button[aria-label="Review 1 Notification"]');

        // Verify that Notification List is open
        expect(await page.locator('div[role="dialog"]').isVisible()).toBe(true);

        // Wait until there is no Notification Banner
        await page.waitForSelector('div[role="alert"]', { state: 'detached'});

        // Click on the "Close" button of the Notification List
        await page.click('button[aria-label="Close"]');

        // On the Display Layout object, click on the "Edit" button
        await page.click('button[title="Edit"]');

        // Click on the "Save" button
        await page.click('button[title="Save"]');

        // Click on the "Save and Finish Editing" option
        await page.click('li[title="Save and Finish Editing"]');

        // Verify that Notification List is NOT open
        expect(await page.locator('div[role="dialog"]').isVisible()).toBe(false);
    });
});
