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

import { fileURLToPath } from 'url';

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Testing numeric data with inspector data visualization (i.e., data pivoting)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(
        new URL('../../../../helper/addInitDataVisualization.js', import.meta.url)
      )
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Can click on telemetry and see data in inspector @2p', async ({ page, context }) => {
    const initStartBounds = page.getByLabel('Start bounds');
    const initEndBounds = await page.getByLabel('End bounds').textContent();
    const exampleDataVisualizationSource = await createDomainObjectWithDefaults(page, {
      type: 'Example Data Visualization Source'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'First Sine Wave Generator',
      parent: exampleDataVisualizationSource.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Second Sine Wave Generator',
      parent: exampleDataVisualizationSource.uuid
    });

    await page.goto(exampleDataVisualizationSource.url);

    await page.getByRole('tab', { name: 'Data Visualization' }).click();
    await page.getByRole('cell', { name: /First Sine Wave Generator/ }).click();
    await expect(page.getByText('Numeric Data')).toBeVisible();
    await expect(
      page.locator('span.plot-series-name', { hasText: 'First Sine Wave Generator Hz' })
    ).toBeVisible();
    await expect(page.locator('.js-series-data-loaded')).toBeVisible();

    await page.getByRole('cell', { name: /Second Sine Wave Generator/ }).click();
    await expect(page.getByText('Numeric Data')).toBeVisible();
    await expect(
      page.locator('span.plot-series-name', { hasText: 'Second Sine Wave Generator Hz' })
    ).toBeVisible();
    await expect(page.locator('.js-series-data-loaded')).toBeVisible();

    // test new tab
    await page.getByLabel('Inspector Views').getByLabel('More actions').click();
    const pagePromise = context.waitForEvent('page');
    await page.getByRole('menuitem', { name: /Open In New Tab/ }).click();

    // ensure our new tab's title is correct
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    // expect new tab title to contain 'Second Sine Wave Generator'
    await expect(newPage).toHaveTitle('Second Sine Wave Generator');

    // Verify that "Open in New Tab" preserves the time bounds
    await expect(initStartBounds).toHaveText(
      await newPage.getByLabel('Start bounds').textContent()
    );
    expect(initEndBounds).toEqual(await newPage.getByLabel('End bounds').textContent());
  });
});
