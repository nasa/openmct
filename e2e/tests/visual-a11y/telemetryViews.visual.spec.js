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

import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { VISUAL_URL } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Visual - Telemetry Views', () => {
  let telemetry;

  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });

    // Create SWG inside of LAD Table
    telemetry = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG4'
    });

    //Modify SWG to create a really stable SWG
    await page.getByRole('button', { name: 'More actions' }).click();

    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();

    //Forgive me, padre
    await page.getByRole('spinbutton', { name: 'Data Rate (hz)' }).fill('0');
    await page.getByRole('spinbutton', { name: 'Period' }).fill('0');

    await page.getByRole('button', { name: 'Save' }).click();
  });
  test('Telemetry Table toggled column widths behave accordingly', async ({ page, theme }) => {
    await page.goto(telemetry.url, { waitUntil: 'domcontentloaded' });

    //Click this button to see telemetry display options
    await page.getByRole('button', { name: 'Plot' }).click();
    await page.getByLabel('Telemetry Table').click();

    //Get Table View in place
    expect(await page.getByLabel('Expand Columns')).toBeInViewport();

    await percySnapshot(page, `Default Telemetry Table View (theme: ${theme})`);

    await page.getByLabel('Expand Columns').click();

    await expect(page.getByRole('button', { name: 'Autosize Columns' })).toBeVisible();

    await percySnapshot(page, `Default Telemetry Table columns expanded (theme: ${theme})`);

    await page.getByLabel('More actions').click();

    await percySnapshot(page, `Telemetry View Actions Menu expanded (theme: ${theme})`);

    await page.getByRole('menuitem', { name: 'Pause' }).click();

    await percySnapshot(page, `Telemetry View Paused (theme: ${theme})`);
  });
});
