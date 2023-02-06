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
const { createNotebookAndEntry } = require('../../appActions');
const percySnapshot = require('@percy/playwright');

test.describe("Visual - Check blur of Add Tag button", () => {
    test("Blur 'Add tag'", async ({ page, theme }) => {
        await createNotebookAndEntry(page);

        // Click on Annotations tab
        await page.locator('text=Annotations').click();

        // Take snapshot of the notebook with the Annotations tab opened
        await percySnapshot(page, `Notebook Annotation (theme: '${theme}')`);

        // Click on the "Add Tag" button
        await page.locator('button:has-text("Add Tag")').click();

        // Take snapshot of the notebook with the AutoComplete field visible
        await percySnapshot(page, `Notebook Add Tag (theme: '${theme}')`);

        // Click inside the AutoComplete field
        await page.locator('[placeholder="Type to select tag"]').click();

        // Click on the "Tags" header (simulating a click outside the autocomplete field)
        await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

        // Take snapshot of the notebook with the AutoComplete field hidden and with the "Add Tag" button visible
        await percySnapshot(page, `Notebook Annotation de-select blur (theme: '${theme}')`);
    });
});
