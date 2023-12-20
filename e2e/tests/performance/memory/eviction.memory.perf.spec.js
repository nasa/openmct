/* eslint-disable playwright/no-wait-for-timeout */
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
/* global __dirname */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;
const { findLeaks, BrowserInteractionResultReader } = require('@memlab/api');

const memoryLeakFilePath = path.resolve(
  __dirname,
  '../../../../e2e/test-data/memory-leak-detection.json'
);
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

test.describe('Telemetry eviction for', () => {
  test.slow();
  const startDelta = 60000;
  const endDelta = 15000;
  const waitPeriod = 2000;
  const snapshotsPath = path.join(__dirname, '../../../test-data/snapshots');
  test.beforeEach(async ({ page }) => {
    // Go to baseURL
    await page.goto(
      `./#/browse/mine?tc.mode=local&tc.startDelta=${startDelta}&tc.endDelta=${endDelta}&tc.timeSystem=utc&view=grid`
    );

    await page.goto('./#/browse', { waitUntil: 'domcontentloaded' });

    await page
      .getByRole('treeitem', {
        name: /My Items/
      })
      .click({
        button: 'right'
      });

    await page
      .getByRole('menuitem', {
        name: /Import from JSON/
      })
      .click();

    // Upload memory-leak-detection.json
    await page.setInputFiles('#fileElem', memoryLeakFilePath);

    await page
      .getByRole('button', {
        name: 'Save'
      })
      .click();

    await expect(page.locator('a:has-text("Memory Leak Detection")')).toBeVisible();
  });

  test.only('imagery', async ({ page }) => {
    await navigateToObject(page, 'example-imagery-memory-leak-test');

    console.debug(`⏲️  Waiting ${waitPeriod}ms...`);
    await page.waitForTimeout(waitPeriod);
    const stage1SnapshotPath = path.join(snapshotsPath, `/data/cur/s1.heapsnapshot`);
    await captureHeapSnapshot(page, stage1SnapshotPath);

    console.debug(`⏲️  Waiting ${waitPeriod}ms...`);
    await page.waitForTimeout(waitPeriod);
    const stage2SnapshotPath = path.join(snapshotsPath, 'data/cur/s2.heapsnapshot');
    await captureHeapSnapshot(page, stage2SnapshotPath);

    console.debug(`⏲️  Waiting ${waitPeriod}ms...`);
    await page.waitForTimeout(waitPeriod);
    const stage3SnapshotPath = path.join(snapshotsPath, 'data/cur/s3.heapsnapshot');
    await captureHeapSnapshot(page, stage3SnapshotPath);

    const reader = BrowserInteractionResultReader.from(snapshotsPath);
    const leaks = await findLeaks(reader);
    expect(leaks.length).toEqual(0);
  });

  /**
   *
   * @param {import('@playwright/test').Page} page
   * @param {*} objectName
   * @returns
   */
  async function navigateToObject(page, objectName) {
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    // Fill Search input
    await page.getByRole('searchbox', { name: 'Search Input' }).fill(objectName);

    //Search Result Appears and is clicked
    await page.getByText(objectName, { exact: true }).click();
  }

  async function forceGC(page, repeat = 6) {
    const client = await page.context().newCDPSession(page);
    for (let i = 0; i < repeat; i++) {
      await client.send('HeapProfiler.collectGarbage');
      // wait for a while and let GC do the job
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1400);
  }

  async function captureHeapSnapshot(page, outputPath) {
    const client = await page.context().newCDPSession(page);

    const dir = path.dirname(outputPath);

    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error; // Throw the error if it is not because the directory already exists
      }
    }
    const chunks = [];

    function dataHandler(data) {
      chunks.push(data.chunk);
    }

    try {
      client.on('HeapProfiler.addHeapSnapshotChunk', dataHandler);
      console.debug(`🚮 Running garbage collection...`);
      await forceGC(page);
      await client.send('HeapProfiler.enable');
      console.debug(`📸 Capturing heap snapshot to ${outputPath}`);
      await client.send('HeapProfiler.takeHeapSnapshot');
      client.removeListener('HeapProfiler.addHeapSnapshotChunk', dataHandler);
      const fullSnapshot = chunks.join('');
      await fs.writeFile(outputPath, fullSnapshot, { encoding: 'UTF-8' });
    } catch (error) {
      console.error('🛑 Error while capturing heap snapshot:', error);
    } finally {
      await client.detach();
    }
  }
});
