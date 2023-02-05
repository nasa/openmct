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

const { test, expect } = require("../../pluginFixtures");
const { createNotebookAndEntry } = require('../../appActions');

test.describe("Visual - Check blur of Add Tag button", () => {
    test("Blur 'Add tag'", async ({ page }) => {
        await createNotebookAndEntry(page);

        // Click on Annotations tab
        await page.locator('text=Annotations').click();

        // Click on the "Add Tag" button
        await page.locator('button:has-text("Add Tag")').click();

        // Check that the AutoComplete field is visible
        await expect(page.locator('[placeholder="Type to select tag"]')).toBeVisible();

        // Click inside the AutoComplete field
        await page.locator('[placeholder="Type to select tag"]').click();

        // Click on the "Tags" header (simulating a click outside the autocomplete)
        await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

        // Verify there is a button with text "Add Tag"
        await expect(page.locator('button:has-text("Add Tag")')).toBeVisible();

        // Verify the AutoComplete field is hidden
        await expect(page.locator('[placeholder="Type to select tag"]')).toBeHidden();
    });
});
