/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from './pluginFixtures.js';
// Constants for repeated values
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_RESULTS_DIR = path.join(__dirname, './test-results');

const extendedTest = test.extend({
  /**
   * Overrides the default screenshot function to apply default options that should apply to all
   * screenshots taken in the AVP tests.
   *
   * @param {import('@playwright/test').PlaywrightTestArgs} args - The Playwright test arguments.
   * @param {Function} use - The function to use the page object.
   * Defaults:
   * - Disables animations
   * - Masks the clock indicator
   * - Masks the time conductor last update time in realtime mode
   * - Masks the time conductor start bounds in fixed mode
   * - Masks the time conductor end bounds in fixed mode
   */
  page: async ({ page }, use) => {
    const playwrightScreenshot = page.screenshot;

    /**
     * Override the screenshot function to always mask a given set of locators which will always
     * show variance across screenshots. Defaults may be overridden by passing in options to the
     * screenshot function.
     * @param {import('@playwright/test').PageScreenshotOptions} options - The options for the screenshot.
     * @returns {Promise<Buffer>} Returns the screenshot as a buffer.
     */
    page.screenshot = async function (options = {}) {
      const mask = [
        this.getByLabel('Clock Indicator'), // Mask the clock indicator
        this.getByLabel('Last update'), // Mask the time conductor last update time in realtime mode
        this.getByLabel('Start bounds'), // Mask the time conductor start bounds in fixed mode
        this.getByLabel('End bounds') // Mask the time conductor end bounds in fixed mode
      ];

      const result = await playwrightScreenshot.call(this, {
        animations: 'disabled',
        mask,
        ...options // Pass through or override any options
      });
      return result;
    };

    await use(page);
  }
});

/**
 * Scans for accessibility violations on a page and writes a report to disk if violations are found.
 * Automatically asserts that no violations should be present.
 *
 * @param {import('playwright').Page} page - The page object from Playwright.
 * @param {string} testCaseName - The name of the test case.
 * @param {{ reportName?: string }} [options={}] - The options for the report generation.
 * @returns {Promise<Object|null>} Returns the accessibility scan results if violations are found, otherwise returns null.
 */

export async function scanForA11yViolations(page, testCaseName, options = {}) {
  const builder = new AxeBuilder({ page });
  builder.withTags(['wcag2aa']);
  // https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
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
}

export { expect, extendedTest as test };
