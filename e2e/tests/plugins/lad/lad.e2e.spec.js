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

test.describe('Testing LAD table @unstable', () => {
    test('telemetry value exactly matches latest telemetry value received', async ({ page, openmctConfig }) => {
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
            type: 'LAD Table',
            name: "Test LAD Table"
        });
        await page.locator('[title="Edit"]').click();

        await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
        await page.dragAndDrop('text=Test Sine Wave Generator', '.c-lad-table-wrapper');

        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();

        const getTelemValuePromise = new Promise(resolve => page.exposeFunction('getTelemValue', resolve));

        await page.evaluate(async (telemetryIdentifier) => {
            const telemetryObject = await window.openmct.objects.get(telemetryIdentifier);
            window.openmct.telemetry.subscribe(telemetryObject, (obj) => {
                window.getTelemValue(obj.sin);
            });
        }, sineWaveGeneratorIdentifier);

        const subscribeTelemValue = await getTelemValuePromise;
        const roundedTelemValue = parseFloat(subscribeTelemValue).toFixed(2);

        const ladTableValuePromise = await page.waitForSelector(`text="${roundedTelemValue}"`);
        const ladTableValue = await ladTableValuePromise.textContent();

        expect(ladTableValue).toBe(roundedTelemValue);
    });
});
