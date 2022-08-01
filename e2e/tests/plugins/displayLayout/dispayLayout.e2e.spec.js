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

test.describe('Testing Display Layout @unstable', () => {
    test('alpha-numeric widget telemetry value exactly matches latest telemetry value received', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Fixed Timespan")').click();
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();

        await createDomainObjectWithDefaults(page, 'Sine Wave Generator');
        await renameObjectFrom3DotMenu(page, "Test Sine Wave Generator");
        const pageURL = page.url();
        const sineWaveGeneratorIdentifier = pageURL.split('/').pop().split('?')[0];

        await page.locator('text=My Items').first().click();

        await createDomainObjectWithDefaults(page, 'Display Layout');
        await renameObjectFrom3DotMenu(page, "Test Display Layout");

        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await page.dragAndDrop('text=Test Sine Wave Generator', '.l-layout__grid-holder');

        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();

        await page.locator('[data-testid="conductor-start-offset-button"]').click();
        await page.locator('input[type="number"]').nth(1).click();
        await page.locator('input[type="number"]').nth(1).fill('1');
        await page.locator('text=Hrs Mins Secs : : >> button').first().click();
        await page.locator('button:has-text("Local Clock")').click();
        await page.locator('[data-testid="conductor-modeOption-fixed"]').click();

        const exposeFunctionPromise = new Promise(resolve => page.exposeFunction('getTelemValue', resolve));

        await page.evaluate(async (telemetryIdentifier) => {
            const telemetryObject = await window.openmct.objects.get(telemetryIdentifier);
            let wasCalledOnce = false;
            window.openmct.telemetry.subscribe(telemetryObject, async (obj) => {
                if (wasCalledOnce) {
                    return;
                }

                wasCalledOnce = true;
                await document.querySelector('.l-layout').__vue__.$nextTick();
                window.getTelemValue(obj.sin);
            });
        }, sineWaveGeneratorIdentifier);

        const subscribeTelemValue = await exposeFunctionPromise;
        const displayLayoutValue = await page.locator('.c-telemetry-view__value-text').textContent();
        const trimmedDisplayValue = displayLayoutValue.trim();
        const roundedTelemValue = parseFloat(subscribeTelemValue).toFixed(2);

        console.log(trimmedDisplayValue);
        console.log(roundedTelemValue);
        await expect(trimmedDisplayValue).toBe(roundedTelemValue);
    });
});

//Structure: custom functions should be declared last. We are leaning on JSDoc pretty heavily to describe functionality. It is not required, but heavily recommended.

/**
 * This is an example of a function which is shared between testcases in this test suite. When refactoring, we'll be looking
 * for common functionality which makes sense to generalize for the entire test framework.
 * @param {import('@playwright/test').Page} page
 * @param {string} newName New Name for object
 */
async function renameObjectFrom3DotMenu(page, newName) {
    await page.locator('button[title="More options"]').click();
    await page.locator('text=Edit Properties...').click();
    await page.locator('span.form-title >> input[type="text"]').fill(newName);
    await page.locator('text=OK').click();
}
