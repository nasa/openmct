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
/**
 * This is a test suite to assert that we're not regressing in terms of performance in our css rendering pipeline. The general
 * approach is to get the application into an important state where we can run a new test against a known baseline.
 */

const uuid = require('uuid');

const { test, expect } = require('@playwright/test');
const { getMetrics } = require('../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

const CSS_RECALC_COUNT_METRIC = 'RecalcStyleCount';

test.describe('Compare css recalculation count to check for unnecessary DOM repaints', () => {
    test.only('Inspector', async ({ page, browser }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5247'
        });
        const cssRecalcBaseline = 94;
        const objectName = await createDomainObjectWithDefaults(page, 'Folder');

        console.log({ objectName });
        const { [CSS_RECALC_COUNT_METRIC]: recalcCountBefore } = await getMetrics(page);        

        await page.goto('./?tc.mode=local', { waitUntil: 'networkidle' });

        await page.waitForTimeout(3*1000);

        const { [CSS_RECALC_COUNT_METRIC]: recalcCountAfter } = await getMetrics(page);

        console.table({
            cssRecalcBaseline,
            recalcCountBefore,
            recalcCountAfter
        });
        expect(recalcCountAfter).toBeLessThan(cssRecalcBaseline);
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
    test.fixme('MCT Tree', async ({ page, browser }) => {
        await page.goto('./#/browse/mine?hideTree=false');
        const objectNames = await Promise.all([
            createDomainObjectWithDefaults(page, 'Folder', 'Folder'.concat(' ', uuid.v4())),
            // createDomainObjectWithDefaults(page, 'Folder', 'Folder'.concat(' ', uuid.v4()))
        ]);
        console.log({objectNames});
        await Promise.all(objectNames.map(x => page.locator(`.c-tree__item a:has-text("${x}")`)));
    });
    test.fixme('Plot', async ({ page, browser }) => {
        await page.goto('./');
        const objectName = await createDomainObjectWithDefaults(page, 'Plot', 'Plot'.concat(' ', uuid.v4()));

        await page.goto('./#/browse/mine?hideTree=false');

        await page.locator(`.c-tree__item a:has-text("${objectName}")`).click();
    });
    test.fixme('Clicking on previous folder', async ({ page, browser }) => { });

});
