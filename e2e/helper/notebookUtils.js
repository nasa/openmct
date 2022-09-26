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

const NOTEBOOK_DROP_AREA = '.c-notebook__drag-area';

/**
 * @param {import('@playwright/test').Page} page
 */
async function enterTextEntry(page, text) {
    // Click .c-notebook__drag-area
    await page.locator(NOTEBOOK_DROP_AREA).click();

    // enter text
    await page.locator('div.c-ne__text').click();
    await page.locator('div.c-ne__text').fill(text);
    await page.locator('div.c-ne__text').press('Enter');
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function dragAndDropEmbed(page, myItemsFolderName) {
    // Click button:has-text("Create")
    await page.locator('button:has-text("Create")').click();
    // Click li:has-text("Sine Wave Generator")
    await page.locator('li:has-text("Sine Wave Generator")').click();
    // Click form[name="mctForm"] >> text=My Items
    await page.locator(`form[name="mctForm"] >> text=${myItemsFolderName}`).click();
    // Click text=OK
    await page.locator('text=OK').click();
    // Click text=Open MCT My Items >> span >> nth=3
    await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
    // Click text=Unnamed CUSTOM_NAME
    await Promise.all([
        page.waitForNavigation(),
        page.locator('text=Unnamed CUSTOM_NAME').click()
    ]);

    await page.dragAndDrop('text=UNNAMED SINE WAVE GENERATOR', NOTEBOOK_DROP_AREA);
}

// eslint-disable-next-line no-undef
module.exports = {
    enterTextEntry,
    dragAndDropEmbed
};
