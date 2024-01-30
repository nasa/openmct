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

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Tabs View', () => {
  let tabsView;
  let table;
  let notebook;
  let sineWaveGenerator;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    tabsView = await createDomainObjectWithDefaults(page, {
      type: 'Tabs View'
    });
    table = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      parent: tabsView.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });
    notebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      parent: tabsView.uuid
    });
    sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: tabsView.uuid
    });
  });

  test('Renders tabbed elements', async ({ page }) => {
    await page.goto(tabsView.url);

    // select first tab
    await page.getByLabel(`${table.name} tab`, { exact: true }).click();
    // ensure table header visible
    await expect(page.getByRole('searchbox', { name: 'message filter input' })).toBeVisible();

    // no canvas (i.e., sine wave generator) in the document should be visible
    await expect(page.locator('canvas[id=webglContext]')).toBeHidden();

    // select second tab
    await page.getByLabel(`${notebook.name} tab`, { exact: true }).click();

    // ensure notebook visible
    await expect(page.locator('.c-notebook__drag-area')).toBeVisible();

    // no canvas (i.e., sine wave generator) in the document should be visible
    await expect(page.locator('canvas[id=webglContext]')).toBeHidden();

    // select third tab
    await page.getByLabel(`${sineWaveGenerator.name} tab`, { exact: true }).click();

    // expect sine wave generator visible
    await expect(page.locator('.c-plot')).toBeVisible();

    // expect two canvases (i.e., overlay & main canvas for sine wave generator) to be visible
    await expect(page.locator('canvas')).toHaveCount(2);
    await expect(page.locator('canvas').nth(0)).toBeVisible();
    await expect(page.locator('canvas').nth(1)).toBeVisible();

    // now try to select the first tab again
    await page.getByLabel(`${table.name} tab`, { exact: true }).click();
    // ensure table header visible
    await expect(page.getByRole('searchbox', { name: 'message filter input' })).toBeVisible();

    // no canvas (i.e., sine wave generator) in the document should be visible
    await expect(page.locator('canvas[id=webglContext]')).toBeHidden();
  });
});

test.describe('Tabs View CRUD', () => {
  let tabsView;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    tabsView = await createDomainObjectWithDefaults(page, {
      type: 'Tabs View'
    });
  });

  test('Eager Load Tabs is the default and then can be toggled off', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7198'
    });
    await page.goto(tabsView.url);

    await page.getByLabel('Edit Object').click();
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();
    await expect(await page.getByLabel('Eager Load Tabs')).not.toBeChecked();
    await page.getByLabel('Eager Load Tabs').setChecked(true);
    await expect(await page.getByLabel('Eager Load Tabs')).toBeChecked();
  });
});
