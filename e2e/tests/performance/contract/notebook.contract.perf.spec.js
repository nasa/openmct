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
is not broken upstream on Open MCT. Any assumptions made downstream will be tested here.

TODO:
 - Update resolution of performance config
 - Add Performance Observer on init to push all performance marks
 - Move client CDP connection to before or to a fixture

*/

const { test, expect } = require('@playwright/test');

const notebookFilePath = 'e2e/test-data/PerformanceNotebook.json';

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
    await page.setInputFiles('#fileElem', notebookFilePath);

    // TODO Fix this
    await page.locator('text=OK >> nth=1').click();

    await expect(page.locator('a:has-text("Performance Notebook")')).toBeVisible();

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
  test('Notebook Search, Add Entry, Update Entry are performant', async ({ page, browser }) => {
    const client = await page.context().newCDPSession(page);
    // Tell the DevTools session to record performance metrics
    // https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics
    await client.send('Performance.enable');
    // Go to baseURL
    await page.goto('./');

    // To to Search Available after Launch
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page.evaluate(() => window.performance.mark('search-available'));
    // Fill Search input
    await page
      .locator('[aria-label="OpenMCT Search"] input[type="search"]')
      .fill('Performance Notebook');
    await page.evaluate(() => window.performance.mark('search-entered'));
    //Search Result Appears and is clicked
    await Promise.all([
      page.waitForNavigation(),
      page.locator('a:has-text("Performance Notebook")').first().click(),
      page.evaluate(() => window.performance.mark('click-search-result'))
    ]);

    await page.waitForSelector('.c-tree__item c-tree-and-search__loading loading', {
      state: 'hidden'
    });
    await page.evaluate(() => window.performance.mark('search-spinner-gone'));

    await page.waitForSelector('.l-browse-bar__object-name', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('object-title-appears'));

    await page.waitForSelector('.c-notebook__entry >> nth=0', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('notebook-entry-appears'));

    // Click Add new Notebook Entry
    await page.locator('.c-notebook__drag-area').click();
    await page.evaluate(() => window.performance.mark('new-notebook-entry-created'));

    // Enter Notebook Entry text
    await page.locator('div.c-ne__text').last().fill('New Entry');
    await page.keyboard.press('Enter');
    await page.evaluate(() => window.performance.mark('new-notebook-entry-filled'));

    //Individual Notebook Entry Search
    await page.evaluate(() => window.performance.mark('notebook-search-start'));
    await page.locator('.c-notebook__search >> input').fill('Existing Entry');
    await page.evaluate(() => window.performance.mark('notebook-search-filled'));
    await page.waitForSelector('text=Search Results (3)', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('notebook-search-processed'));
    await page.waitForSelector('.c-notebook__entry >> nth=2', { state: 'visible' });
    await page.evaluate(() => window.performance.mark('notebook-search-processed'));

    //Clear Search
    await page.locator('.c-search.c-notebook__search .c-search__input').hover();
    await page.locator('.c-search.c-notebook__search .c-search__clear-input').click();
    await page.evaluate(() => window.performance.mark('notebook-search-processed'));

    // Hover on Last
    await page.evaluate(() => window.performance.mark('new-notebook-entry-delete'));
    await page.locator('div.c-ne__time-and-content').last().hover();
    await page.locator('button[title="Delete this entry"]').last().click();
    await page.locator('button:has-text("Ok")').click();
    await page.waitForSelector('.c-notebook__entry >> nth=3', { state: 'detached' });
    await page.evaluate(() => window.performance.mark('new-notebook-entry-deleted'));

    //await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.collectGarbage');

    let performanceMetrics = await client.send('Performance.getMetrics');
    console.log(performanceMetrics.metrics);
  });
});
