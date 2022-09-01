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
* This test suite covers the multi user functionality of notebooks
*
*/

//Structure: Some standard Imports. Please update the required pathing
const { test, expect } = require('../../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

//this test suite requires 2 browser contexts and couchdb
test.describe('Multi browser note editing@unstable @2p @couchdb', () => {
    //User A or User 1 or Browser 1?
    test.only('A fresh notebook entry entered by UserA will appear for UserB within 60 seconds', async ({ context, page }) => {
        //Navigate to baseURL with page 1 (or User A)
        await page.goto('./', { waitUntil: 'networkidle' });
        // Create Notebook
        const notebookObject = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Test Notebook"
        });

        const page2 = await context.newPage();
        //page2 = await context.newPage();

        await page2.goto(notebookObject.url, {waitUntil: 'networkidle'});
        await page2.waitForLoadState('networkidle'); //Avoids timing issues with juggler/firefox

        // eslint-disable-next-line playwright/no-useless-not
        await expect(page.locator('text=AAA')).not.toBeVisible();
        //Enter AAA into notebook entry
        await enterTextEntry(page);
        await expect(page.locator('text=AAA')).toBeVisible();
        await expect(page2.locator('text=AAA')).toBeVisible();
    });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function enterTextEntry(page) {
    // Click .c-notebook__drag-area
    await page.locator('.c-notebook__drag-area').click();

    // enter text
    await page.locator('div.c-ne__text').click();
    await page.locator('div.c-ne__text').fill('AAA');
    await page.locator('div.c-ne__text').press('Enter');
}
