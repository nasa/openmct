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
This test suite is dedicated to generating LocalStorage via Session Storage to be used
in some visual test suites like controlledClock.visual.spec.js. This suite should run to completion
and generate an artifact named ./e2e/test-data/VisualTestData_storage.json . This will run
on every Commit to ensure that this object still loads into tests correctly and will retain the
.e2e.spec.js suffix.

TODO: Provide additional validation of object properties as it grows.

*/

const { createDomainObjectWithDefaults } = require('../../appActions.js');
const { test, expect } = require('../../pluginFixtures.js');

test('Generate Visual Test Data @localStorage', async ({ page, context }) => {
  //Go to baseURL
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const overlayPlot = await createDomainObjectWithDefaults(page, { type: 'Overlay Plot' });

  // click create button
  await page.locator('button:has-text("Create")').click();

  // add sine wave generator with defaults
  await page.locator('li[role="menuitem"]:has-text("Sine Wave Generator")').click();

  //Add a 5000 ms Delay
  await page.locator('[aria-label="Loading Delay \\(ms\\)"]').fill('5000');

  await Promise.all([
    page.waitForNavigation(),
    page.locator('button:has-text("OK")').click(),
    //Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);

  // focus the overlay plot
  await page.goto(overlayPlot.url);

  await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlot.name);
  //Save localStorage for future test execution
  await context.storageState({ path: './e2e/test-data/VisualTestData_storage.json' });
});
