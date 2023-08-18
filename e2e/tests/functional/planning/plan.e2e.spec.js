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
const { test } = require('../../../pluginFixtures');
const { createPlanFromJSON } = require('../../../appActions');
const testPlan1 = require('../../../test-data/examplePlans/ExamplePlan_Small1.json');
const testPlan2 = require('../../../test-data/examplePlans/ExamplePlan_Invalid.json');
const { assertPlanActivities } = require('../../../helper/planningUtils');

test.describe('Plan', () => {
  let plan;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    plan = await createPlanFromJSON(page, {
      json: testPlan1
    });
  });

  test('Displays all plan events', async ({ page }) => {
    await assertPlanActivities(page, testPlan1, plan.url);
  });
});

test.describe("Plan - Check Invalid JSON Notification", () => {
  let plan;
  test.beforeEach(async ({ page }) => {
    // Go to baseURL and Hide Tree
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    plan = await createPlanFromJSON(page, {
      json: testPlan2
    });
    // Verify there is a button with aria-label="Review 1 Notification"
    expect(await page.locator('button[aria-label="Review 1 Notification"]').isVisible()).toBe(true);
    // Verify there is a button with aria-label="Clear all notifications"
    expect(await page.locator('button[aria-label="Clear all notifications"]').isVisible()).toBe(
      true
    );
    // Click on the div with role="alert" that has "Please verify JSON follows correct Schema." text
    await page.locator('div[role="alert"]:has-text("Please verify JSON follows correct Schema.")').click();
    // Verify there is a div with role="dialog"
    expect(await page.locator('div[role="dialog"]').isVisible()).toBe(true);
    // Verify the div with role="dialog" contains text "Please verify JSON follows correct Schema."
    expect(await page.locator('div[role="dialog"]').innerText()).toContain('Please verify JSON follows correct Schema.');
  });
});
