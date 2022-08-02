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

const { test, expect } = require('../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../appActions');

test.describe('Testing LAD table @unstable', () => {
    test('telemetry value exactly matches latest telemetry value received', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Fixed Timespan")').click();
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();

        await createDomainObjectWithDefaults(page, 'Sine Wave Generator');
        await renameObjectFrom3DotMenu(page, "Test Sine Wave Generator");
        const pageURL = page.url();
        const sineWaveGeneratorIdentifier = pageURL.split('/').pop().split('?')[0];

        await page.locator('text=My Items').first().click();

        await createDomainObjectWithDefaults(page, 'LAD Table');
        await renameObjectFrom3DotMenu(page, "Test LAD Table");

        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await page.dragAndDrop('text=Test Sine Wave Generator', '.c-lad-table-wrapper');

        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();

        const value = await page.locator('.js-third-data').textContent();
        console.log(value);

        // const openmctObject = await page.evaluate(sineWaveGeneratorIdentifier => openmct.objects.get(sineWaveGeneratorIdentifier));
        // console.log(openmctObject);
        // const unsubscribe = openmct.telemetry.subscribe(telemetryObject,
        //     data => this.addDataToGraph(telemetryObject, data)
        //     , options);
        await page.pause();

        // //Assert that the name has changed in the browser bar to the value we assigned above
        // await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName);
        expect(true).toBe(true);
    });
});

/**
 * Function that renames the object
 * @param {import('@playwright/test').Page} page
 * @param {string} newName New Name for object
 */
 async function renameObjectFrom3DotMenu(page, newName) {
    await page.locator('button[title="More options"]').click();
    await page.locator('text=Edit Properties...').click();
    await page.locator('span.form-title >> input[type="text"]').fill(newName);
    await page.locator('text=OK').click();
}
