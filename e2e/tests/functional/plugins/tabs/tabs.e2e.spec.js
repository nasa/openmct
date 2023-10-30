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

const { createDomainObjectWithDefaults } = require('../../../../appActions');
const { test, expect } = require('../../../../pluginFixtures');

test.describe('Tabs View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const tabsView = await createDomainObjectWithDefaults(page, {
      type: 'Tabs View'
    });
    const table = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      parent: tabsView.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      parent: tabsView.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: tabsView.uuid
    });
    page.goto(tabsView.url);
  });

  test('Renders tabbed elements', async ({ page }) => {
    const tabs = await page.locator('.c-tab').all();
    // ensure we've got three tabs
    expect(tabs.length).toBe(3);

    // select first tab
    await tabs[0].click();
    // ensure table header visible
    await page.getByRole('searchbox', { name: 'message filter input' }).isVisible();

    // select second tab
    await tabs[1].click();

    // ensure notebook visible
    await page.locator('.c-notebook__drag-area').isVisible();

    // select third tab
    await tabs[2].click();

    // ensure sine wave generator visible
    await page.locator('.c-telemetry-chart').isVisible();

    // now try to select the first tab again
    await tabs[0].click();
    // ensure table header visible
    await page.getByRole('searchbox', { name: 'message filter input' }).isVisible();
  });
});
