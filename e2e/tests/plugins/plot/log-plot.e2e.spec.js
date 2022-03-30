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

/*
Tests to verify log plot functionality.
*/

const { test, expect } = require('@playwright/test');

test.describe('Log plot tests', () => {
    test.only('Can create a log plot.', async ({ page}) => {
        // fresh page with time range from 2022-03-29 22:00:00.000Z to 2022-03-29 22:00:30.000Z
        await page.goto('/', { waitUntil: 'networkidle' });

        // Set a specific time range for consistency, otherwise it will change
        // on every test to a range based on the current time.

        await page.locator('input[type="text"]').first().click();
        await page.locator('input[type="text"]').first().fill('2022-03-29 22:00:00.000Z');

        await page.locator('input[type="text"]').nth(1).click();
        await page.locator('input[type="text"]').nth(1).fill('2022-03-29 22:00:30.000Z');

        // create overlay plot

        await page.locator('button:has-text("Create")').click();
        await page.locator('li:has-text("Overlay Plot")').click();
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/8caf7072-535b-4af6-8394-edd86e3ea35f?tc.mode=fixed&tc.startBound=1648590633191&tc.endBound=1648592433191&tc.timeSystem=utc&view=plot-overlay' }*/),
            page.locator('text=OK').click()
        ]);

        // save the overlay plot

        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        await page.locator('text=Save and Finish Editing').click();

        // create a sinewave generator

        await page.locator('button:has-text("Create")').click();
        await page.locator('li:has-text("Sine Wave Generator")').click();

        // set amplitude to 6, offset 4, period 2

        await page.locator('div:nth-child(5) .form-row .c-form-row__controls .form-control .field input').click();
        await page.locator('div:nth-child(5) .form-row .c-form-row__controls .form-control .field input').fill('6');

        await page.locator('div:nth-child(6) .form-row .c-form-row__controls .form-control .field input').click();
        await page.locator('div:nth-child(6) .form-row .c-form-row__controls .form-control .field input').fill('4');

        await page.locator('div:nth-child(7) .form-row .c-form-row__controls .form-control .field input').click();
        await page.locator('div:nth-child(7) .form-row .c-form-row__controls .form-control .field input').fill('2');

        // Click OK to make generator

        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/8caf7072-535b-4af6-8394-edd86e3ea35f/6e58b26a-8a73-4df6-b3a6-918decc0bbfa?tc.mode=fixed&tc.startBound=1648590633191&tc.endBound=1648592433191&tc.timeSystem=utc&view=plot-single' }*/),
            page.locator('text=OK').click()
        ]);

        // click on overlay plot

        await page.locator('text=Open MCT My Items >> span').nth(3).click();
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/8caf7072-535b-4af6-8394-edd86e3ea35f?tc.mode=fixed&tc.startBound=1648590633191&tc.endBound=1648592433191&tc.timeSystem=utc&view=plot-overlay' }*/),
            page.locator('text=Unnamed Overlay Plot').first().click()
        ]);

        // test non-log ticks

        await testRegularTicks();

        // turn on edit mode

        await page.locator('text=Unnamed Overlay Plot Snapshot >> button').nth(3).click();

        // turn on log mode

        await page.locator('text=Y Axis Label Log mode Auto scale Padding >> input[type="checkbox"]').first().check();

        // test log ticks

        await testLogTicks();

        // turn off log mode

        await page.locator('text=Y Axis Label Log mode Auto scale Padding >> input[type="checkbox"]').first().uncheck();

        // test regular ticks

        await testRegularTicks();

        // turn on log mode

        await page.locator('text=Y Axis Label Log mode Auto scale Padding >> input[type="checkbox"]').first().check();

        // test log ticks

        await testLogTicks();

        // save overlay plot

        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();
        await page.locator('text=Save and Finish Editing').click();

        // test log ticks

        await testLogTicks();

        // refresh page

        await page.reload();

        // wait for chart
        // test log ticks

        // FIXME, log ticks are wrong after restart.
        // await testLogTicks();

        async function testRegularTicks() {
            const yTicks = page.locator('.gl-plot-y-tick-label');
            expect(await yTicks.count()).toBe(7);
            await expect(yTicks.nth(0)).toHaveText('-2');
            await expect(yTicks.nth(1)).toHaveText('0');
            await expect(yTicks.nth(2)).toHaveText('2');
            await expect(yTicks.nth(3)).toHaveText('4');
            await expect(yTicks.nth(4)).toHaveText('6');
            await expect(yTicks.nth(5)).toHaveText('8');
            await expect(yTicks.nth(6)).toHaveText('10');
        }

        async function testLogTicks() {
            const yTicks = page.locator('.gl-plot-y-tick-label');
            expect(await yTicks.count()).toBe(28);
            await expect(yTicks.nth(0)).toHaveText('-2.98');
            await expect(yTicks.nth(1)).toHaveText('-2.50');
            await expect(yTicks.nth(2)).toHaveText('-2.00');
            await expect(yTicks.nth(3)).toHaveText('-1.51');
            await expect(yTicks.nth(4)).toHaveText('-1.20');
            await expect(yTicks.nth(5)).toHaveText('-1.00');
            await expect(yTicks.nth(6)).toHaveText('-0.80');
            await expect(yTicks.nth(7)).toHaveText('-0.58');
            await expect(yTicks.nth(8)).toHaveText('-0.40');
            await expect(yTicks.nth(9)).toHaveText('-0.20');
            await expect(yTicks.nth(10)).toHaveText('-0.00');
            await expect(yTicks.nth(11)).toHaveText('0.20');
            await expect(yTicks.nth(12)).toHaveText('0.40');
            await expect(yTicks.nth(13)).toHaveText('0.58');
            await expect(yTicks.nth(14)).toHaveText('0.80');
            await expect(yTicks.nth(15)).toHaveText('1.00');
            await expect(yTicks.nth(16)).toHaveText('1.20');
            await expect(yTicks.nth(17)).toHaveText('1.51');
            await expect(yTicks.nth(18)).toHaveText('2.00');
            await expect(yTicks.nth(19)).toHaveText('2.50');
            await expect(yTicks.nth(20)).toHaveText('2.98');
            await expect(yTicks.nth(21)).toHaveText('3.50');
            await expect(yTicks.nth(22)).toHaveText('4.00');
            await expect(yTicks.nth(23)).toHaveText('4.50');
            await expect(yTicks.nth(24)).toHaveText('5.31');
            await expect(yTicks.nth(25)).toHaveText('7.00');
            await expect(yTicks.nth(26)).toHaveText('8.00');
            await expect(yTicks.nth(27)).toHaveText('9.00');
        }

    });

    test.fixme('Verify that log mode option is reflected in import/export JSON', async () => {
        //
    });
});
