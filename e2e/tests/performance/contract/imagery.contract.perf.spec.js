/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

TODO:
 - Update resolution of performance config
 - Add Performance Observer on init to push all performance marks
 - Move client CDP connection to before or to a fixture
 -

*/

const { test, expect } = require('@playwright/test');

const filePath = 'e2e/test-data/PerformanceDisplayLayout.json';

test.describe('Performance tests', () => {
  test.beforeEach(async ({ page, browser }, testInfo) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    // Click a:has-text("My Items")
    await page.locator('a:has-text("My Items")').click({
      button: 'right'
    });

    // Click text=Import from JSON
    await page.locator('text=Import from JSON').click();

    // Upload Performance Display Layout.json
    await page.setInputFiles('#fileElem', filePath);

    // Click text=OK
    await page.locator('button:has-text("OK")').click();

    await expect(
      page.locator('a:has-text("Performance Display Layout Display Layout")')
    ).toBeVisible();

    //Create a Chrome Performance Timeline trace to store as a test artifact
    console.log('\n==== Devtools: startTracing ====\n');
    await browser.startTracing(page, {
      path: `${testInfo.outputPath()}-trace.json`,
      screenshots: true
    });
  });
  test.afterEach(async ({ page, browser }) => {
    console.log('\n==== Devtools: stopTracing ====\n');
    await browser.stopTracing();

    /* Measurement Section
        / The following section includes a block of performance measurements.
        */
    //Get time difference between viewlarge actionability and evaluate time
    await page.evaluate(() =>
      window.performance.measure(
        'machine-time-difference',
        'viewlarge.start',
        'viewLarge.start.test'
      )
    );

    //Get StartTime
    const startTime = await page.evaluate(() => window.performance.timing.navigationStart);
    console.log('window.performance.timing.navigationStart', startTime);

    //Get All Performance Marks
    const getAllMarksJson = await page.evaluate(() =>
      JSON.stringify(window.performance.getEntriesByType('mark'))
    );
    const getAllMarks = JSON.parse(getAllMarksJson);
    console.log('window.performance.getEntriesByType("mark")', getAllMarks);

    //Get All Performance Measures
    const getAllMeasuresJson = await page.evaluate(() =>
      JSON.stringify(window.performance.getEntriesByType('measure'))
    );
    const getAllMeasures = JSON.parse(getAllMeasuresJson);
    console.log('window.performance.getEntriesByType("measure")', getAllMeasures);
  });
  /* The following test will navigate to a previously created Performance Display Layout and measure the
    /  following metrics:
    /  - ElementResourceTiming
    /  - Interaction Timing
    */
  test('Embedded View Large for Imagery is performant in Fixed Time', async ({ page, browser }) => {
    const client = await page.context().newCDPSession(page);
    // Tell the DevTools session to record performance metrics
    // https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics
    await client.send('Performance.enable');
    // Go to baseURL
    await page.goto('./');

    // Search Available after Launch
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.evaluate(() => window.performance.mark('search-available'));
    // Fill Search input
    await page
      .locator('[aria-label="OpenMCT Search"] input[type="search"]')
      .fill('Performance Display Layout');
    await page.evaluate(() => window.performance.mark('search-entered'));
    //Search Result Appears and is clicked
    await Promise.all([
      page.waitForNavigation(),
      page.locator('a:has-text("Performance Display Layout")').first().click(),
      page.evaluate(() => window.performance.mark('click-search-result'))
    ]);

    //Time to Example Imagery Frame loads within Display Layout
    await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible' });
    //Time to Example Imagery object loads
    await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible' });

    //Get background-image url from background-image css prop
    const backgroundImage = await page.locator('.c-imagery__main-image__background-image');
    let backgroundImageUrl = await backgroundImage.evaluate((el) => {
      return window
        .getComputedStyle(el)
        .getPropertyValue('background-image')
        .match(/url\(([^)]+)\)/)[1];
    });
    backgroundImageUrl = backgroundImageUrl.slice(1, -1); //forgive me, padre
    console.log('backgroundImageurl ' + backgroundImageUrl);

    //Get ResourceTiming of background-image jpg
    const resourceTimingJson = await page.evaluate(
      (bgImageUrl) => JSON.stringify(window.performance.getEntriesByName(bgImageUrl).pop()),
      backgroundImageUrl
    );
    console.log('resourceTimingJson ' + resourceTimingJson);

    //Open Large view
    await page.locator('button:has-text("Large View")').click(); //This action includes the performance.mark named 'viewLarge.start'
    await page.evaluate(() => window.performance.mark('viewLarge.start.test')); //This is a mark only to compare evaluate timing

    //Time to Imagery Rendered in Large Frame
    await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('background-image-frame'));

    //Time to Example Imagery object loads
    await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('background-image-visible'));

    // Get Current number of images in thumbstrip
    await page.waitForSelector('.c-imagery__thumb');
    const thumbCount = await page.locator('.c-imagery__thumb').count();
    console.log('number of thumbs rendered ' + thumbCount);
    await page.locator('.c-imagery__thumb').last().click();

    //Get ResourceTiming of all jpg resources
    const resourceTimingJson2 = await page.evaluate(() =>
      JSON.stringify(window.performance.getEntriesByType('resource'))
    );
    const resourceTiming = JSON.parse(resourceTimingJson2);
    const jpgResourceTiming = resourceTiming.find((element) => element.name.includes('.jpg'));
    console.log('jpgResourceTiming ' + JSON.stringify(jpgResourceTiming));

    // Click Close Icon
    await page.locator('[aria-label="Close"]').click();
    await page.evaluate(() => window.performance.mark('view-large-close-button'));

    //await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.collectGarbage');

    let performanceMetrics = await client.send('Performance.getMetrics');
    console.log(performanceMetrics.metrics);
  });
});
