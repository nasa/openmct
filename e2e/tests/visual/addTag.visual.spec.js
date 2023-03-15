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
 * This test is dedicated to test the blur behavior of the add tag button.
 */

const { test } = require("../../pluginFixtures");
const percySnapshot = require('@percy/playwright');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe("Visual - Check for cancellation of Add Tag button", () => {

    test.beforeEach(async ({ page }) => {
        // Open a browser, navigate to the main page, and wait until all network events to resolve
        await page.goto('./', { waitUntil: 'networkidle' });
    });

    test("Cancel 'Add tag'", async ({ page, theme }) => {
        createDomainObjectWithDefaults(page, { type: 'Notebook' });

        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        const entryLocator = `[aria-label="Notebook Entry Input"] >> nth = 0`;
        await page.locator(entryLocator).click();
        await page.locator(entryLocator).fill(`Entry 0`);
        await page.locator(entryLocator).press('Enter');

        // Click on Annotations tab
        await page.locator('.c-inspector__tab', { hasText: "Annotations" }).click();

        // Take snapshot of the notebook with the Annotations tab opened
        await percySnapshot(page, `Notebook Annotation (theme: '${theme}')`);

        // Click on the "Add Tag" button
        await page.locator('button:has-text("Add Tag")').click();

        // Take snapshot of the notebook with the AutoComplete field visible
        await percySnapshot(page, `Notebook Add Tag (theme: '${theme}')`);

        // Click on the "Tags" header (simulating a click outside the autocomplete field)
        await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

        // Take snapshot of the notebook with the AutoComplete field hidden and with the "Add Tag" button visible
        await percySnapshot(page, `Notebook Annotation cancel (theme: '${theme}')`);
    });
});
