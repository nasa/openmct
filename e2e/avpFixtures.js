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

/**
 * avpFixtures.js
 *
 * @file This module provides custom fixtures specifically tailored for Accessibility, Visual, and Performance (AVP) tests.
 * These fixtures extend the base functionality of the Playwright fixtures and appActions, and are designed to be
 * generalized across all plugins. They offer functionalities like scanning for accessibility violations, integrating
 * with axe-core, and more.
 *
 * IMPORTANT NOTE: This fixture file is not intended to be extended further by other fixtures. If you find yourself
 * needing to do so, please consult the documentation and consider creating a specialized fixture or modifying the
 * existing ones.
 */

const fs = require('fs');
const path = require('path');
const { test, expect } = require('./pluginFixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { findLeaks, BrowserInteractionResultReader } = require('@memlab/api');

const snapshotsPath = path.join(__dirname, '../../../test-data/snapshots');
// Constants for repeated values
const TEST_RESULTS_DIR = './test-results';

/**
 * Scans for accessibility violations on a page and writes a report to disk if violations are found.
 * Automatically asserts that no violations should be present.
 *
 * @typedef {object} GenerateReportOptions
 * @property {string} [reportName] - The name for the report file.
 *
 * @param {import('playwright').Page} page - The page object from Playwright.
 * @param {string} testCaseName - The name of the test case.
 * @param {GenerateReportOptions} [options={}] - The options for the report generation.
 *
 * @returns {Promise<object|null>} Returns the accessibility scan results if violations are found,
 *                                  otherwise returns null.
 */
async function scanForA11yViolations(page, testCaseName, options = {}) {
  const builder = new AxeBuilder({ page });
  builder.withTags(['wcag2aa']);
  // https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
  builder.disableRules(['color-contrast']);
  const accessibilityScanResults = await builder.analyze();

  // Assert that no violations should be present
  expect(
    accessibilityScanResults.violations,
    `Accessibility violations found in test case: ${testCaseName}`
  ).toEqual([]);

  // Check if there are any violations
  if (accessibilityScanResults.violations.length > 0) {
    let reportName = options.reportName || testCaseName;
    let sanitizedReportName = reportName.replace(/\//g, '_');
    const reportPath = path.join(TEST_RESULTS_DIR, `${sanitizedReportName}.json`);

    try {
      if (!fs.existsSync(TEST_RESULTS_DIR)) {
        fs.mkdirSync(TEST_RESULTS_DIR);
      }

      fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
      console.log(`Accessibility report with violations saved successfully as ${reportPath}`);
      return accessibilityScanResults;
    } catch (err) {
      console.error(`Error writing the accessibility report to file ${reportPath}:`, err);
      throw err;
    }
  } else {
    console.log('No accessibility violations found, no report generated.');
    return null;
  }
};

// Function to get JSHeapUsedSize
function getHeapSize(page) {
  return page.evaluate(() => {
    if (window.performance && window.performance.memory) {
      return window.performance.memory.usedJSHeapSize;
    }
    return null;
  });
};

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

/**
   *
   * @param {import('@playwright/test').Page} page
   * @param {*} objectName
   * @returns
   */
async function navigateToObjectAndDetectMemoryLeak(page, objectName) {
  await page.getByRole('searchbox', { name: 'Search Input' }).click();
  // Fill Search input
  await page.getByRole('searchbox', { name: 'Search Input' }).fill(objectName);

  //Search Result Appears and is clicked
  await page.getByText(objectName, { exact: true }).click();

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
  await page.goto('./#/browse/mine');

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

exports = {
  scanForA11yViolations,
  getHeapSize,
  forceGC,
  captureHeapSnapshot,
  findLeaks,
  navigateToObjectAndDetectMemoryLeak,
  BrowserInteractionResultReader,
  test,
  expect
};
