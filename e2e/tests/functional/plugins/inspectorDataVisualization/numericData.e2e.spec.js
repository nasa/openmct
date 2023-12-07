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
/* global __dirname */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const path = require('path');

test.describe('Testing numeric data with inspector data visualization (i.e., data pivoting)', () => {
  test.beforeEach(async ({ page }) => {
    // eslint-disable-next-line no-undef
    await page.addInitScript({
      path: path.join(__dirname, '../../../../helper/', 'addInitDataVisualization.js')
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Can click on telemetry and see data in inspector', async ({ page }) => {
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
  });
});
