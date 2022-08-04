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

const { test, expect } = require('@playwright/test');

test.describe('Compare css recalculations to check for unnecessary DOM repaints', () => {
    test.fixme('Clicking create button', async ({ page, browser }) => {});
    test.fixme('Searching', async ({ page, browser }) => {});
    test.fixme('MCT Tree', async ({ page, browser }) => {});
    test.fixme('Plot', async ({ page, browser }) => {});
    test.fixme('Clicking on previous folder', async ({ page, browser }) => {});
    test('Inspector', async ({ page, browser}) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5247'
        });

        const client = await page.context().newCDPSession(page);

        await client.send('Performance.enable');

        const performanceMetricsBefore = await client.send('Performance.getMetrics');
        const recalcCountBefore = performanceMetricsBefore.metrics.find(({ name }) => name === 'RecalcStyleCount').value;
        console.log({recalcCountBefore});
        await page.goto('./');

        // open the time conductor drop down
        await page.locator('.c-conductor__controls button.c-mode-button').click();
        // Click local clock
        await page.locator('.icon-clock >> text=Local Clock').click();

        const performanceMetricsAfter = await client.send('Performance.getMetrics');
        const recalcCountAfter = performanceMetricsAfter.metrics.find(({ name }) => name === 'RecalcStyleCount').value;
        console.log({recalcCountAfter});
        expect(recalcCountAfter).toBeGreaterThan(recalcCountBefore);
    });
});
