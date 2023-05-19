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
Collection of Visual Tests set to run in a default context with default Plugins. The tests within this suite
are only meant to run against openmct's app.js started by `npm run start` within the
`./e2e/playwright-visual.config.js` file.
*/

const { test, expect } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Visual - Default', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL and Hide Tree
    await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
  });

  test('Visual - Default Dashboard', async ({ page, theme }) => {
    // Verify that Create button is actionable
    await expect(page.locator('button:has-text("Create")')).toBeEnabled();

    // Take a snapshot of the Dashboard
    await percySnapshot(page, `Default Dashboard (theme: '${theme}')`);
  });

  test('Visual - Default Condition Set', async ({ page, theme }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Default Condition Set'
    });

    // Take a snapshot of the newly created Condition Set object
    await percySnapshot(page, `Default Condition Set (theme: '${theme}')`);
  });

  test('Visual - Default Condition Widget', async ({ page, theme }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Condition Widget',
      name: 'Default Condition Widget'
    });

    // Take a snapshot of the newly created Condition Widget object
    await percySnapshot(page, `Default Condition Widget (theme: '${theme}')`);
  });

  test('Visual - Sine Wave Generator Form', async ({ page, theme }) => {
    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Sine Wave Generator
    await page.click('text=Sine Wave Generator');

    await percySnapshot(page, `Default Sine Wave Generator Form (theme: '${theme}')`);

    await page.locator('.field.control.l-input-sm input').first().click();
    await page.locator('.field.control.l-input-sm input').first().fill('');

    // Validate red x mark
    await percySnapshot(page, `removed amplitude property value (theme: '${theme}')`);
  });

  test('Visual - Display Layout Icon is correct in Create Menu', async ({ page, theme }) => {
    // Click the Create button
    await page.click('button:has-text("Create")');

    // Hover on Display Layout option.
    await page.locator('text=Display Layout').hover();
    await percySnapshot(page, `Display Layout Create Menu (theme: '${theme}')`);
  });

  test('Visual - Default Gauge', async ({ page, theme }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Default Gauge'
    });

    // Take a snapshot of the newly created Gauge object
    await percySnapshot(page, `Default Gauge (theme: '${theme}')`);
  });
});
