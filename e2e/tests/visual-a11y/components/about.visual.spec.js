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

/*
Tests the branding associated with the default deployment. At least the about modal for now
*/

import percySnapshot from '@percy/playwright';

import { expect, scanForA11yViolations, test } from '../../../avpFixtures.js';
import { VISUAL_URL } from '../../../constants.js';

test.describe('Visual - Branding @a11y', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL and Hide Tree
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Visual - About Modal', async ({ page, theme }) => {
    // Click About button
    await page.getByLabel('About Modal').click();

    // Modify the Build information in 'about' to be consistent run-over-run
    await expect(page.locator('id=versionInformation')).toBeEnabled();
    await page
      .locator('id=versionInformation')
      .evaluate(
        (node) =>
          (node.innerHTML =
            '<li>Version: visual-snapshot</li> <li>Build Date: Mon Nov 15 2021 08:07:51 GMT-0800 (Pacific Standard Time)</li> <li>Revision: 93049cdbc6c047697ca204893db9603b864b8c9f</li> <li>Branch: master</li>')
      );

    // Take a snapshot of the About modal
    await percySnapshot(page, `About (theme: '${theme}')`);
  });
});
test.afterEach(async ({ page }, testInfo) => {
  await scanForA11yViolations(page, testInfo.title);
});
