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

const fs = require('fs');
const path = require('path');
const base = require('./pluginFixtures');
const AxeBuilder = require('@axe-core/playwright').default;

// Constants for repeated values
const TEST_RESULTS_DIR = './test-results';

/**
 * Extend base test by providing "makeAxeBuilder" functionality.
 *
 * @typedef {object} AxeBuilderParams
 * @property {import('playwright').Page} page - The page object from Playwright.
 * @property {string[]} [tags=DEFAULT_AXE_TAGS] - The tags for accessibility checks.
 *
 * @param {AxeBuilderParams} params
 * @returns {AxeBuilder} The axe builder instance.
 */
exports.test = base.test.extend({
  makeAxeBuilder: async ({ page }, use, testInfo) => {
    const makeAxeBuilder = () => new AxeBuilder({ page }).withTags(['section508']);
    await use(makeAxeBuilder);
  }
});

exports.expect = base.expect;

/**
 * Generates an accessibility report.
 *
 * @typedef {object} GenerateReportOptions
 * @property {string} [reportName] - The name for the report file.
 *
 * @param {import('playwright').Page} page - The page object from Playwright.
 * @param {string} testCaseName - The name of the test case.
 * @param {GenerateReportOptions} [options={}] - The options for the report generation.
 *
 * @returns {Promise<object>} Returns the accessibility scan results.
 */
exports.generateAccessibilityReport = async function (page, testCaseName, options = {}) {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  let reportName = options.reportName || testCaseName;
  let sanitizedReportName = reportName.replace(/\//g, '_');
  let reportPath = path.join(TEST_RESULTS_DIR, `${sanitizedReportName}.json`);

  try {
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR);
    }

    fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
    console.log(`Accessibility report saved successfully as ${reportPath}`);
    return accessibilityScanResults;
  } catch (err) {
    console.error(`Error writing the accessibility report to file ${reportPath}:`, err);
    throw err;
  }
};
