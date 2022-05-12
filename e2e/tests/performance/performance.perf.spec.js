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
This test suite is dedicated to performance tests to ensure that testability of performance
is not broken upstream on Open MCT. Any assumptions made downstream will be tested here

TODO: Update resolution of performance config

*/

const { test, expect } = require('@playwright/test');

const filePath = 'e2e/test-data/PerformanceDisplayLayout.json';

test.describe('Performance tests', () => {
    test.beforeEach(async ({ page, browser }) => {
        // Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        // Click a:has-text("My Items")
        await page.locator('a:has-text("My Items")').click({
            button: 'right'
        });

        // Click text=Import from JSON
        await page.locator('text=Import from JSON').click();

        // Upload Performance Display Layout.json
        await page.setInputFiles('#fileElem', filePath);

        // Click text=OK
        await page.locator('text=OK').click();

        await expect(page.locator('a:has-text("Performance Display Layout Display Layout")')).toBeVisible();

        console.log("\n==== Devtools: startTracing ====\n");
        await browser.startTracing(page, {
            path: './trace.json',
            screenshots: true
        });
    });
    test.afterEach(async ({ page, browser }) => {
        console.log("\n==== Devtools: stopTracing ====\n");
        await browser.stopTracing();
    });
    /* The following test will navigate to a previously created Performance Display Layout and measure the
    /  following metrics:
    /  - Search Returned
    /  - Search To Display Layout
    /  - ElementResourceTiming
    */
    test('Search Tree - Embedded View Large for Imagery is performant in Fixed Time', async ({ page, browser }) => {

        const client = await page.context().newCDPSession(page);
        // Tell the DevTools session to record performance metrics
        // https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics
        await client.send('Performance.enable');

        // Go to baseURL
        await page.goto('/');

        // Click input[type="search"]
        await page.locator('input[type="search"]').click();
        // Fill input[type="search"]
        await page.locator('input[type="search"]').fill('Performance Display Layout');
        // Click a:has-text("Performance Display Layout") >> nth=0

        await Promise.all([
            page.waitForNavigation(),
            page.locator('a:has-text("Performance Display Layout")').first().click()
        ]);

        await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible'});
        //Time to Example Imagery object loads
        await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible'});

        //Get background-image url property from background-image
        const backgroundImage = await page.locator('.c-imagery__main-image__background-image');
        const backgroundImageUrl = await backgroundImage.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
        });
        console.log(backgroundImageUrl);

        // const performanceTiming = JSON.parse(
        //     await page.evaluate(() => JSON.stringify(window.performance.timing))
        // );
        // const timings = {};
        // Object.keys(performanceTiming).map((key) => {
        //     timings[key] = performanceTiming[key] - performanceTiming.navigationStart;
        // });
        // console.log('performanceTiming', performanceTiming);
        // console.log('difference with navigation start(navigationStart)', timings);

        //Get ResourceTiming of background-image png
        const resourceTimingJson = await page.evaluate(() =>
            JSON.stringify(window.performance.getEntriesByName(backgroundImageUrl))
        );
        // const resourceTiming = JSON.parse(resourceTimingJson);
        console.log('resourceTimingJson ' + resourceTimingJson);
        // console.log('resourceTiming ' + resourceTiming);

        // const jpgResourceTiming = resourceTiming.find((element) =>
        //     element.name.includes('.jpg')
        // );

        // console.log('jpgResourceTiming ' + jpgResourceTiming);

        // Click button:has-text("Large View")
        await page.locator('button:has-text("Large View")').click();
        await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible'});
        await page.evaluate(() => (window.performance.mark("background-image-frame")));
        //Time to Example Imagery object loads
        await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible'});
        //Use performance.mark API
        await page.evaluate(() => (window.performance.mark("background-image-visible")));

        //Get All Performance Marks
        const getAllMarksJson = await page.evaluate(() => JSON.stringify(window.performance.getEntriesByType("mark")));
        const getAllMarks = JSON.parse(getAllMarksJson);
        console.log('window.performance.getEntriesByType("mark")', getAllMarks);

        let performanceMetrics = await client.send('Performance.getMetrics');
        console.log(performanceMetrics.metrics);

    });
});
