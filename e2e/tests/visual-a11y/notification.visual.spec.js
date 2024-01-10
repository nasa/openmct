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
 * This test is dedicated to test notification banner functionality and its accessibility attributes.
 */

import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_URL } from '../../constants.js';

test.describe("Visual - Check Notification Info Banner of 'Save successful' @a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });

  test("Create a clock, click on 'Save successful' banner and dismiss it", async ({
    page,
    theme
  }) => {
    // Create a clock domain object
    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'Default Clock'
    });
    // Click on the div with role="alert" that has "Save successful" text
    await page.getByRole('alert').filter({ hasText: 'Save successful' }).click();
    // Verify there is a div with role="dialog"
    await expect(page.getByRole('dialog', { name: 'Overlay' })).toBeVisible();
    // Verify the div with role="dialog" contains text "Save successful"
    expect(await page.getByRole('dialog', { name: 'Overlay' }).innerText()).toContain(
      'Save successful'
    );
    await percySnapshot(page, `Notification banner shows Save successful (theme: '${theme}')`);
    // Verify there is a button with text "Dismiss"
    await expect(page.getByText('Dismiss', { exact: true })).toBeVisible();
    await percySnapshot(page, `Notification banner shows Dismiss (theme: '${theme}')`);
    // Click on button with text "Dismiss"
    await page.getByText('Dismiss', { exact: true }).click();
    // Verify there is no div with role="dialog"
    await expect(page.getByRole('dialog', { name: 'Overlay' })).toBeHidden();
    await percySnapshot(page, `Notification banner dismissed (theme: '${theme}')`);
  });
  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
