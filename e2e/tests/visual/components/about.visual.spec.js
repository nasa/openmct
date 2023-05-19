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
Tests the branding associated with the default deployment. At least the about modal for now
*/

const { test, expect } = require('../../../pluginFixtures');
const percySnapshot = require('@percy/playwright');

test.describe('Visual - Branding', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL and Hide Tree
    await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
  });

  test('Visual - About Modal', async ({ page, theme }) => {
    // Click About button
    await page.click('.l-shell__app-logo');

    // Modify the Build information in 'about' to be consistent run-over-run
    const versionInformationLocator = page.locator('ul.t-info.l-info.s-info').first();
    await expect(versionInformationLocator).toBeEnabled();
    await versionInformationLocator.evaluate(
      (node) =>
        (node.innerHTML =
          '<li>Version: visual-snapshot</li> <li>Build Date: Mon Nov 15 2021 08:07:51 GMT-0800 (Pacific Standard Time)</li> <li>Revision: 93049cdbc6c047697ca204893db9603b864b8c9f</li> <li>Branch: master</li>')
    );

    // Take a snapshot of the About modal
    await percySnapshot(page, `About (theme: '${theme}')`);
  });
});
