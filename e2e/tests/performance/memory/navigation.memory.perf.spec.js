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

const { test, expect } = require('@playwright/test');

const memoryLeakFilePath = 'e2e/test-data/memory-leak-detection.json';
/**
 * Executes tests to verify that views are not leaking memory on navigation away. This sort of
 * memory leak is generally caused by a failure to clean up registered listeners.
 *
 * These tests are executed on a set of pre-built displays loaded from ../test-data/memory-leak-detection.json.
 *
 * In order to modify the test data set:
 * 1. Run Open MCT locally (npm start)
 * 2. Right click on a folder in the tree, and select "Import From JSON"
 * 3. In the subsequent dialog, select the file ../test-data/memory-leak-detection.json
 * 4. Click "OK"
 * 5. Modify test objects as desired
 * 6. Right click on the "Memory Leak Detection" folder, and select "Export to JSON"
 * 7. Copy the exported file to ../test-data/memory-leak-detection.json
 *
 */

const NAV_LEAK_TIMEOUT = 10 * 1000; // 10s
test.describe('Navigation memory leak is not detected in', () => {
  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.locator('a:has-text("My Items")').click({
      button: 'right'
    });

    await page.locator('text=Import from JSON').click();

    // Upload memory-leak-detection.json
    await page.setInputFiles('#fileElem', memoryLeakFilePath);

    await page.locator('text=OK').click();

    await expect(page.locator('a:has-text("Memory Leak Detection")')).toBeVisible();
  });

  test('plot view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(page, 'overlay-plot-single-1hz-swg', {
      timeout: NAV_LEAK_TIMEOUT
    });
    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('stacked plot view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(page, 'stacked-plot-single-1hz-swg', {
      timeout: NAV_LEAK_TIMEOUT
    });
    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('LAD table view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(page, 'lad-table-single-1hz-swg', {
      timeout: NAV_LEAK_TIMEOUT
    });
    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('LAD table set', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(page, 'lad-table-set-single-1hz-swg', {
      timeout: NAV_LEAK_TIMEOUT
    });
    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  //TODO: Figure out why using the `table-row` component inside the `table` component leaks TelemetryTableRow objects
  test('telemetry table view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'telemetry-table-single-1hz-swg',
      {
        timeout: NAV_LEAK_TIMEOUT
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  //TODO: Figure out why using the `SideBar` component inside the leaks Notebook objects
  test('notebook view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'notebook-memory-leak-detection-test',
      {
        timeout: NAV_LEAK_TIMEOUT
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('display layout of a single SWG alphanumeric', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'display-layout-single-1hz-swg',
      {
        timeout: NAV_LEAK_TIMEOUT
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('display layout of a single SWG plot', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'display-layout-single-overlay-plot',
      {
        timeout: NAV_LEAK_TIMEOUT
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  //TODO: Figure out why `svg` in the CompassRose component leaks imagery
  test('example imagery view', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'example-imagery-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 // 1 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('display layout of example imagery views', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'display-layout-images-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 // 1 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('display layout with plots of swgs, alphanumerics, and condition sets, ', async ({
    page
  }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'display-layout-simple-telemetry',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 // 1 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('flexible layout with plots of swgs', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'flexible-layout-plots-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('flexible layout of example imagery views', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'flexible-layout-images-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 // 1 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('tabbed view of display layouts and time strips', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'tab-view-simple-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 * 2 // 2 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  test('time strip view of telemetry', async ({ page }) => {
    const result = await navigateToObjectAndDetectMemoryLeak(
      page,
      'time-strip-telemetry-memory-leak-test',
      {
        timeout: NAV_LEAK_TIMEOUT * 6 // 1 min
      }
    );

    // If we got here without timing out, then the root view object was garbage collected and no memory leak was detected.
    expect(result).toBe(true);
  });

  /**
   *
   * @param {import('@playwright/test').Page} page
   * @param {*} objectName
   * @returns
   */
  async function navigateToObjectAndDetectMemoryLeak(page, objectName) {
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    // Fill Search input
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill(objectName);

    //Search Result Appears and is clicked
    await Promise.all([
      page.locator(`div.c-gsearch-result__title:has-text("${objectName}")`).first().click(),
      page.waitForNavigation()
    ]);

    // Register a finalization listener on the root node for the view. This tends to be the last thing to be
    // garbage collected since it has either direct or indirect references to all resources used by the view. Therefore it's a pretty good proxy
    // for detecting memory leaks.
    await page.evaluate(() => {
      window.gcPromise = new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        window.fr = new FinalizationRegistry(resolve);
        window.fr.register(
          window.openmct.layout.$refs.browseObject.$refs.objectViewWrapper.firstChild,
          'navigatedObject',
          window.openmct.layout.$refs.browseObject.$refs.objectViewWrapper.firstChild
        );
      });
    });

    // Nav back to folder
    await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });
    await page.waitForNavigation();

    // This next code block blocks until the finalization listener is called and the gcPromise resolved. This means that the root node for the view has been garbage collected.
    // In the event that the root node is not garbage collected, the gcPromise will never resolve and the test will time out.
    await page.evaluate(() => {
      const gcPromise = window.gcPromise;
      window.gcPromise = null;

      // Manually invoke the garbage collector once all references are removed.
      window.gc();

      return gcPromise;
    });

    // Clean up the finalization registry since we don't need it any more.
    await page.evaluate(() => {
      window.fr = null;
    });

    // If we get here without timing out, it means the garbage collection promise resolved and the test passed.
    return true;
  }
});
