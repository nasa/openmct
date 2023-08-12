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

/**
 * This test is dedicated to test notification banner functionality and its accessibility attributes.
 */

const { test, expect } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe("Visual - Check Notification Info Banner of 'Save successful'", () => {
  test.beforeEach(async ({ page }) => {
    // Go to baseURL and Hide Tree
    await page.goto('./', { waitUntil: 'networkidle' });
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
    // Verify there is a button with aria-label="Review 1 Notification"
    expect(await page.locator('button[aria-label="Review 1 Notification"]').isVisible()).toBe(true);
    // Verify there is a button with aria-label="Clear all notifications"
    expect(await page.locator('button[aria-label="Clear all notifications"]').isVisible()).toBe(
      true
    );
    // Click on the div with role="alert" that has "Save successful" text
    await page.locator('div[role="alert"]:has-text("Save successful")').click();
    // Verify there is a div with role="dialog"
    expect(await page.locator('div[role="dialog"]').isVisible()).toBe(true);
    // Verify the div with role="dialog" contains text "Save successful"
    expect(await page.locator('div[role="dialog"]').innerText()).toContain('Save successful');
    await percySnapshot(page, `Notification banner shows Save successful (theme: '${theme}')`);
    // Verify there is a button with text "Dismiss"
    expect(await page.locator('button:has-text("Dismiss")').isVisible()).toBe(true);
    await percySnapshot(page, `Notification banner shows Dismiss (theme: '${theme}')`);
    // Click on button with text "Dismiss"
    await page.locator('button:has-text("Dismiss")').click();
    // Verify there is no div with role="dialog"
    expect(await page.locator('div[role="dialog"]').isVisible()).toBe(false);
    await percySnapshot(page, `Notification banner dismissed (theme: '${theme}')`);
  });
});
