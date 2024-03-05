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
This test suite is dedicated to tests which verify branding related components.
*/

import { expect, test } from '../../baseFixtures.js';

test.describe('Branding tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('About Modal launches with basic branding properties', async ({ page }) => {
    await page.getByLabel('About Modal').click();

    // Verify that the NASA Logo Appears
    await expect(page.getByAltText('Open MCT Splash Logo')).toBeVisible();

    // Modify the Build information in 'about' Modal
    await expect.soft(page.getByLabel('Version Number')).toContainText(/Version: \d/);
    await expect
      .soft(page.getByLabel('Build Date'))
      .toContainText(/Build Date: ((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))/);
    await expect.soft(page.getByLabel('Revision')).toContainText(/Revision: \b[0-9a-f]{5,40}\b/);
    await expect.soft(page.getByLabel('Branch')).toContainText(/Branch: ./);
  });
  test('Verify Links in About Modal @2p', async ({ page }) => {
    // Click About button
    await page.getByLabel('About Modal').click();

    // Verify that clicking on the third party licenses information opens up another tab on licenses url
    const [page2] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByText('click here for third party licensing information').click()
    ]);
    await page2.waitForLoadState('domcontentloaded'); //Avoids timing issues with juggler/firefox
    expect(page2.waitForURL('**/licenses**')).toBeTruthy();
  });
});
