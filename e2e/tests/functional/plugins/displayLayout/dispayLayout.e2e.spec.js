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

const { test, expect } = require('../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../appActions');

test.describe('Testing Display Layout @unstable', () => {
    test('alpha-numeric widget telemetry value exactly matches latest telemetry value received in real time', async ({ page, openmctConfig }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        const { myItemsFolderName } = openmctConfig;

        await page.locator('button:has-text("Fixed Timespan")').click();
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();

        await createDomainObjectWithDefaults(page, {
            type: 'Sine Wave Generator',
            name: "Test Sine Wave Generator"
        });
        const pageURL = page.url();
        const sineWaveGeneratorIdentifier = pageURL.split('/').pop().split('?')[0];

        await page.locator(`text=${myItemsFolderName}`).first().click();

        await createDomainObjectWithDefaults(page, {
            type: 'Display Layout',
            name: "Test Display Layout"
        });
        await page.locator('[title="Edit"]').click();

        await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
        await page.dragAndDrop('text=Test Sine Wave Generator', '.l-layout__grid-holder');

        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();

        const getTelemValuePromise = new Promise(resolve => page.exposeFunction('getTelemValue', resolve));

        await subscribeToTelemetry(page, sineWaveGeneratorIdentifier);

        const subscribeTelemValue = await getTelemValuePromise;
        const displayLayoutValuePromise = await page.waitForSelector(`text="${subscribeTelemValue}"`);
        const displayLayoutValue = await displayLayoutValuePromise.textContent();
        const trimmedDisplayValue = displayLayoutValue.trim();

        await expect(trimmedDisplayValue).toBe(subscribeTelemValue);
    });
    test('alpha-numeric widget telemetry value exactly matches latest telemetry value received in fixed time', async ({ page, openmctConfig }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        const { myItemsFolderName } = openmctConfig;

        await page.locator('button:has-text("Fixed Timespan")').click();
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();

        await createDomainObjectWithDefaults(page, {
            type: 'Sine Wave Generator',
            name: "Test Sine Wave Generator"
        });
        const pageURL = page.url();
        const sineWaveGeneratorIdentifier = pageURL.split('/').pop().split('?')[0];

        await page.locator(`text=${myItemsFolderName}`).first().click();

        await createDomainObjectWithDefaults(page, {
            type: 'Display Layout',
            name: "Test Display Layout"
        });
        await page.locator('[title="Edit"]').click();

        await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
        await page.dragAndDrop('text=Test Sine Wave Generator', '.l-layout__grid-holder');

        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();

        const getTelemValuePromise = new Promise(resolve => page.exposeFunction('getTelemValue', resolve));

        await subscribeToTelemetry(page, sineWaveGeneratorIdentifier);
        await changeToFixedTime(page);

        const subscribeTelemValue = await getTelemValuePromise;
        const displayLayoutValuePromise = await page.waitForSelector(`text="${subscribeTelemValue}"`);
        const displayLayoutValue = await displayLayoutValuePromise.textContent();
        const trimmedDisplayValue = displayLayoutValue.trim();

        await expect(trimmedDisplayValue).toBe(subscribeTelemValue);
    });
});

/**
 * Util for subscribing to a telemetry object by object identifier
 * @param {import('@playwright/test').Page} page
 * @param {string} objectIdentifier identifier for object
 */
async function subscribeToTelemetry(page, objectIdentifier) {
    await page.evaluate(async (telemetryIdentifier) => {
        const telemetryObject = await window.openmct.objects.get(telemetryIdentifier);
        const metadata = window.openmct.telemetry.getMetadata(telemetryObject);
        const formats = await window.openmct.telemetry.getFormatMap(metadata);
        window.openmct.telemetry.subscribe(telemetryObject, (obj) => {
            const sinVal = obj.sin;
            const formattedSinVal = formats.sin.format(sinVal);
            window.getTelemValue(formattedSinVal);
        });
    }, objectIdentifier);
}

/**
 * This function uses the time conductor to change to a fixed time of 1 minute
 * @param {import('@playwright/test').Page} page
 */
async function changeToFixedTime(page) {
    await page.locator('[data-testid="conductor-start-offset-button"]').click();
    await page.locator('input[type="number"]').nth(1).click();
    await page.locator('input[type="number"]').nth(1).fill('1');
    await page.locator('text=Hrs Mins Secs : : >> button').first().click();
    await page.locator('button:has-text("Local Clock")').click();
    await page.locator('[data-testid="conductor-modeOption-fixed"]').click();
}
