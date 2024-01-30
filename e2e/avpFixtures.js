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

import { expect, test } from './pluginFixtures.js';

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
/* eslint-disable no-undef */
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

export { expect, test };
