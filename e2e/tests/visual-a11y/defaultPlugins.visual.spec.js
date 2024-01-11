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
Collection of Visual Tests set to run in a default context with default Plugins. The tests within this suite
are only meant to run against openmct's app.js started by `npm run start` within the
`./e2e/playwright-visual.config.js` file.
*/

import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_URL } from '../../constants.js';

test.describe('Visual - Default @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });
  });

  test('Visual - Default Dashboard', async ({ page, theme }) => {
    // Verify that Create button is actionable
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled();

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
    await page.getByRole('button', { name: 'Create' }).click();

    await page.getByRole('menuItem', { name: 'Sine Wave Generator' }).click();

    await percySnapshot(page, `Default Sine Wave Generator Form (theme: '${theme}')`);

    await page.getByLabel('Period').click();
    await page.getByLabel('Period').fill('');

    await percySnapshot(page, `removed amplitude property value (theme: '${theme}')`);
  });

  test('Visual - Display Layout Icon is correct in Create Menu', async ({ page, theme }) => {
    await page.getByRole('button', { name: 'Create' }).click();

    await page.getByRole('menuItem', { name: 'Display Layout' }).hover({ trial: true });
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

  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
