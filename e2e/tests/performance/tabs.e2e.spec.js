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

const { createDomainObjectWithDefaults, waitForPlotsToRender } = require('../../appActions');
const { test, expect } = require('../../pluginFixtures');

test.describe('Tabs View', () => {
  test('Renders tabbed elements nicely', async ({ page }) => {
    // Code to hook into the requestAnimationFrame function and log each call
    let animationCalls = [];
    await page.exposeFunction('logCall', (callCount) => {
      animationCalls.push(callCount);
    });
    await page.addInitScript(() => {
      const oldRequestAnimationFrame = window.requestAnimationFrame;
      let callCount = 0;
      window.requestAnimationFrame = function (callback) {
        // eslint-disable-next-line no-undef
        logCall(callCount++);
        return oldRequestAnimationFrame(callback);
      };
    });
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
    const notebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      parent: tabsView.uuid
    });
    const sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: tabsView.uuid
    });

    page.goto(tabsView.url);

    // select first tab
    await page.getByLabel(`${table.name} tab`).click();
    // ensure table header visible
    await expect(page.getByRole('searchbox', { name: 'message filter input' })).toBeVisible();

    // select second tab
    await page.getByLabel(`${notebook.name} tab`).click();

    // expect notebook visible
    await expect(page.locator('.c-notebook__drag-area')).toBeVisible();

    // select third tab
    await page.getByLabel(`${sineWaveGenerator.name} tab`).click();

    // ensure sine wave generator visible
    expect(await page.locator('.c-plot').isVisible()).toBe(true);

    // now select notebook and clear animation calls
    await page.getByLabel(`${notebook.name} tab`).click();
    animationCalls = [];
    // expect notebook visible
    await expect(page.locator('.c-notebook__drag-area')).toBeVisible();
    const notebookAnimationCalls = animationCalls.length;

    // select sine wave generator and clear animation calls
    animationCalls = [];
    await page.getByLabel(`${sineWaveGenerator.name} tab`).click();

    // ensure sine wave generator visible
    await waitForPlotsToRender(page);
    // we should be calling animation frames
    const sineWaveAnimationCalls = animationCalls.length;
    expect(sineWaveAnimationCalls).toBeGreaterThanOrEqual(notebookAnimationCalls);
  });
});
