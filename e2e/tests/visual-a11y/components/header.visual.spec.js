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

import { expect, test } from '../../../avpFixtures.js';
import { VISUAL_URL } from '../../../constants.js';

//Declare the scope of the visual test
const header = '.l-shell__head';

test.describe('Visual - Header @a11y', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL and Hide Tree
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
    // Wait for status bar to load
    await expect(
      page.getByRole('status', {
        name: 'Clock Indicator'
      })
    ).toBeInViewport();
    await expect(
      page.getByRole('status', {
        name: 'Global Clear Indicator'
      })
    ).toBeInViewport();
    await expect(
      page.getByRole('status', {
        name: 'Snapshot Indicator'
      })
    ).toBeInViewport();
  });

  test('header sizing', async ({ page, theme }) => {
    // Click About button
    await percySnapshot(page, `Header default (theme: '${theme}')`, {
      scope: header
    });

    await page.getByLabel('Click to collapse items').click();

    await percySnapshot(page, `Header Collapsed (theme: '${theme}')`, {
      scope: header
    });
  });

  test('show snapshot button', async ({ page, theme }) => {
    await page.getByLabel('Take a Notebook Snapshot').click();

    await page.getByRole('menuitem', { name: 'Save to Notebook Snapshots' }).click();

    await percySnapshot(page, `Notebook Snapshot Show button (theme: '${theme}')`, {
      scope: header
    });
    await expect(await page.getByLabel('Show Snapshots')).toBeVisible();
  });
});
// Skipping for https://github.com/nasa/openmct/issues/7421
// test.afterEach(async ({ page }, testInfo) => {
//   await scanForA11yViolations(page, testInfo.title);
// });
