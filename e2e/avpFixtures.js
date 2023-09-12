/* eslint-disable no-undef */
/**
 * avpFixtures.js
 *
 * @file This module provides custom fixtures specifically tailored for Accessibility, Visual, and Performance (AVP) tests.
 * These fixtures extend the base functionality of the Playwright fixtures and appActions, and are designed to be
 * generalized across all plugins. They offer functionalities like generating accessibility reports, integrating
 * with axe-core, and more.
 *
 * IMPORTANT NOTE: This fixture file is not intended to be extended further by other fixtures. If you find yourself
 * needing to do so, please consult the documentation and consider creating a specialized fixture or modifying the
 * existing ones.
 */

const fs = require('fs');
const path = require('path');
const base = require('./pluginFixtures');
const AxeBuilder = require('@axe-core/playwright').default;

/**
 * Extend base test by providing "makeAxeBuilder" functionality.
 *
 * @typedef {object} AxeBuilderParams
 * @property {import('playwright').Page} page - The page object from Playwright.
 * @property {string[]} [tags=['wcag2aa']] - The tags for accessibility checks.
 *
 * @param {AxeBuilderParams} params
 * @returns {AxeBuilder} The axe builder instance.
 */
exports.test = base.test.extend({
  makeAxeBuilder: async ({ page }, use, testInfo) => {
    const makeAxeBuilder = () => new AxeBuilder({ page }).withTags(['wcag2aa']);
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
  let reportPath = path.join('./test-results', `${reportName}.json`);

  try {
    // Ensure directory exists
    if (!fs.existsSync('./test-results')) {
      fs.mkdirSync('./test-results');
    }

    fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2));
    console.log(`Accessibility report saved successfully as ${reportPath}!`);
    return accessibilityScanResults;
  } catch (err) {
    console.error(`Error writing the accessibility report to file ${reportPath}:`, err);
    throw err;
  }
};
