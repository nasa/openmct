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
 * This file is dedicated to extending the base functionality of the `@playwright/test` framework.
 * The functions in this file should be viewed as temporary or a shim to be removed as the RFEs in
 * the Playwright GitHub repo are implemented. Functions which serve those RFEs are marked with corresponding
 * GitHub issues.
 */

import { expect, request, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

/**
 * Takes a `ConsoleMessage` and returns a formatted string. Used to enable console log error detection.
 * @see {@link https://github.com/microsoft/playwright/discussions/11690 Github Discussion}
 * @private
 * @param {import('@playwright/test').ConsoleMessage} msg
 * @returns {string} formatted string with message type, text, url, and line and column numbers
 */
function _consoleMessageToString(msg) {
  const { url, lineNumber, columnNumber } = msg.location();

  return `[${msg.type()}] ${msg.text()} at (${url} ${lineNumber}:${columnNumber})`;
}

/**
 * Wait for all animations within the given element and subtrees to finish. Useful when
 * verifying that css transitions have completed.
 * @see {@link https://github.com/microsoft/playwright/issues/15660 Github RFE}
 * @param {import('@playwright/test').Locator} locator
 * @return {Promise<Animation[]>}
 */
function waitForAnimations(locator) {
  return locator.evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished))
  );
}

const istanbulCLIOutput = fileURLToPath(new URL('.nyc_output', import.meta.url));

const extendedTest = test.extend({
  /**
   * Path to output raw coverage files. Can be overridden in Playwright config file.
   * @see {@link https://github.com/mxschmitt/playwright-test-coverage Github Example Project}
   * @constant {string}
   */

  coveragePath: [istanbulCLIOutput, { option: true }],
  /**
   * Extends the base context class to add codecoverage shim.
   * @see {@link https://github.com/mxschmitt/playwright-test-coverage Github Project}
   */
  context: async ({ context, coveragePath }, use) => {
    await context.addInitScript(() =>
      window.addEventListener('beforeunload', () =>
        window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))
      )
    );
    await fs.promises.mkdir(coveragePath, { recursive: true });
    await context.exposeFunction('collectIstanbulCoverage', (coverageJSON) => {
      if (coverageJSON) {
        fs.writeFileSync(
          path.join(coveragePath, `playwright_coverage_${uuid()}.json`),
          coverageJSON
        );
      }
    });

    await use(context);
    for (const page of context.pages()) {
      await page.evaluate(() => {
        window.collectIstanbulCoverage(JSON.stringify(window.__coverage__));
      });
    }
  },
  /**
   * If true, will assert against any console.error calls that occur during the test. Assertions occur
   * during test teardown (after the test has completed).
   *
   * Default: `true`
   */
  failOnConsoleError: [true, { option: true }],
  /**
   * Extends the base page class to enable console log error detection.
   * @see {@link https://github.com/microsoft/playwright/discussions/11690 Github Discussion}
   */
  page: async ({ page, failOnConsoleError }, use) => {
    // Capture any console errors during test execution
    const messages = [];
    page.on('console', (msg) => messages.push(msg));

    await use(page);

    // Assert against console errors during teardown
    if (failOnConsoleError) {
      messages.forEach((msg) =>
        // eslint-disable-next-line playwright/no-standalone-expect
        expect
          .soft(msg.type(), `Console error detected: ${_consoleMessageToString(msg)}`)
          .not.toEqual('error')
      );
    }
  }
});

export { expect, request, extendedTest as test, waitForAnimations };
