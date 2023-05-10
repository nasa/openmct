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
This test suite is dedicated to tests which verify search functionality.
*/

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

const percySnapshot = require('@percy/playwright');

test.describe('Grand Search', () => {
    let folder;
    test.beforeEach(async ({ page, theme }) => {
        await page.goto('./', { waitUntil: 'domcontentloaded' });
        folder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: "Folder for Search"
        });
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true');
    });

    test('Can search for folder object, and subsequent search dropdown behaves properly', async ({ page, theme }) => {
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();

        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill(folder.name);
        await expect(page.locator('[aria-label="Search Result"]')).toContainText(folder.name);
        //Searching for an object returns that object in the grandsearch
        await percySnapshot(page, `Searching for Folder Object (theme: '${theme}')`);

        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();
        await page.locator('[aria-label="Unnamed Clock clock result"] >> text=Unnamed Clock').click();
        //???
        await percySnapshot(page, `Preview for clock should display when editing enabled and search item clicked (theme: '${theme}')`);

        await page.locator('[aria-label="Close"]').click();

        await percySnapshot(page, `Search should still be showing after preview closed (theme: '${theme}')`);

        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();

        await page.locator('text=Save and Finish Editing').click();

        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').click();

        await page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]').fill(folder.name);

        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Unnamed Clock').click()
        ]);
        await percySnapshot(page, `Clicking on search results should navigate to them if not editing (theme: '${theme}')`);
    });
});

