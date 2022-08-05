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
const uuid = require('uuid');

const { test, expect } = require('@playwright/test');
const { createDomainObjectWithDefaults } = require('../../appActions');

const CSS_RECALC_COUNT_METRIC = 'RecalcStyleCount';

/**
* Open the given `domainObject`'s context menu from the object tree.
* Expands the 'My Items' folder if it is not already expanded.
* @param {object} client cdpSession client
* @param {string} metricName the name of the metric to be extracted
*/
async function extractMetric(client, propertyName) {
    const perfMetricObject = await client.send('Performance.getMetrics');
    const extractedMetric = perfMetricObject?.metrics.find(({ name }) => name === propertyName);

    return extractedMetric?.value;
}

test.describe('Compare css recalculation count to check for unnecessary DOM repaints', () => {
    let client;
    test.beforeEach(async ({ page }) => {
        client = await page.context().newCDPSession(page);

        return client.send('Performance.enable');
    });

    test('Inspector', async ({ page, browser }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5247'
        });
        const objectName = await createDomainObjectWithDefaults(page, 'Example Imagery');

        console.log({ objectName });

        const recalcCountBefore = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        await page.goto('./');

        // open the time conductor drop down
        await page.locator('.c-conductor__controls button.c-mode-button').click();
        await page.locator('.icon-clock >> text=Local Clock').click();

        const recalcCountAfter = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        console.table({
            recalcCountBefore,
            recalcCountAfter
        });
        expect(recalcCountAfter).toBeGreaterThan(recalcCountBefore);
    });

    test('Clicking create button', async ({ page, browser }) => {
        await page.goto('./');
        const recalcCountBefore = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        await page.locator('.c-create-button').click();
        const recalcCountAfter = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        console.table({
            recalcCountBefore,
            recalcCountAfter
        });
        expect(recalcCountAfter).toBeGreaterThan(recalcCountBefore);
    });

    test('Searching', async ({ page, browser }) => {
        const objectName = await createDomainObjectWithDefaults(page, 'Example Imagery', 'Example Imagery'.concat(' ', uuid.v4()));
        await page.goto('./');

        const searchInput = page.locator('[aria-label="OpenMCT Search"] [aria-label="Search Input"]');
        await searchInput.hover();
        const recalcCountBefore = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        await searchInput.fill(objectName);
        const recalcCountAfter = await extractMetric(client, CSS_RECALC_COUNT_METRIC);
        console.table({
            recalcCountBefore,
            recalcCountAfter
        });
        expect(recalcCountAfter).toBeGreaterThan(recalcCountBefore);
    });
    test.fixme('MCT Tree', async ({ page, browser }) => { });
    test.fixme('Plot', async ({ page, browser }) => {
        await page.goto('./');
        const objectName = await createDomainObjectWithDefaults(page, 'Plot', 'Plot'.concat(' ', uuid.v4()));

        await page.goto('./#/browse/mine?hideTree=false');

        await page.locator(`.c-tree__item a:has-text("${objectName}")`).click();
    });
    test.fixme('Clicking on previous folder', async ({ page, browser }) => { });

});
