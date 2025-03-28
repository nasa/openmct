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
Testsuite for plot autoscale.
*/

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithFixedTimeBounds
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';
test.use({
  viewport: {
    width: 1280,
    height: 720
  }
});

test.describe('Autoscale', () => {
  test('User can set autoscale with a valid range @snapshot', async ({ page }) => {
    //This is necessary due to the size of the test suite.
    test.slow();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const overlayPlot = await createDomainObjectWithDefaults(page, {
      name: 'Test Overlay Plot',
      type: 'Overlay Plot'
    });
    await createDomainObjectWithDefaults(page, {
      name: 'Test Sine Wave Generator',
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    // Switch to fixed time, start: 2022-03-28 22:00:00.000 UTC, end: 2022-03-28 22:00:30.000 UTC
    await navigateToObjectWithFixedTimeBounds(page, overlayPlot.url, 1648591200000, 1648591230000);

    await testYTicks(page, ['-1.00', '-0.50', '0.00', '0.50', '1.00']);

    // enter edit mode
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Config' }).click();

    // turn off autoscale
    await page.getByRole('checkbox', { name: 'Auto scale' }).uncheck();

    await page.getByLabel('Y Axis 1 Minimum value').fill('-2');
    await page.getByLabel('Y Axis 1 Maximum value').fill('2');

    // save
    await page.getByLabel('Save').click();
    await Promise.all([
      page.getByRole('listitem', { name: 'Save and Finish Editing' }).click(),
      //Wait for Save Banner to appear
      page.locator('.c-message-banner__message').hover({ trial: true })
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.locator('.c-message-banner__message').waitFor({ state: 'detached' });

    // Make sure that after turning off autoscale, the user entered range values are reflected in the ticks.
    await testYTicks(page, [
      '-2.00',
      '-1.50',
      '-1.00',
      '-0.50',
      '0.00',
      '0.50',
      '1.00',
      '1.50',
      '2.00'
    ]);

    const canvas = page.locator('canvas').nth(1);

    await canvas.hover({ trial: true });
    await expect(page.locator('.js-series-data-loaded')).toBeVisible();

    expect
      .soft(await canvas.screenshot())
      .toMatchSnapshot('autoscale-canvas-prepan.png', { animations: 'disabled' });

    //Alt Drag Start
    await page.keyboard.down('Alt');

    await canvas.dragTo(canvas, {
      sourcePosition: {
        x: 200,
        y: 200
      },
      targetPosition: {
        x: 400,
        y: 400
      }
    });

    //Alt Drag End
    await page.keyboard.up('Alt');

    // Ensure the drag worked.
    await testYTicks(page, ['-0.50', '0.00', '0.50', '1.00', '1.50', '2.00', '2.50', '3.00']);

    //Wait for canvas to stabilize.
    await canvas.hover({ trial: true });

    expect
      .soft(await canvas.screenshot())
      .toMatchSnapshot('autoscale-canvas-panned.png', { animations: 'disabled' });
  });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function testYTicks(page, values) {
  const yTicks = page.locator('.gl-plot-y-tick-label');
  await page.locator('canvas >> nth=1').hover();
  let promises = [yTicks.count().then((c) => expect(c).toBe(values.length))];

  for (let i = 0, l = values.length; i < l; i += 1) {
    promises.push(expect.soft(yTicks.nth(i)).toHaveText(values[i])); // eslint-disable-line
  }

  await Promise.all(promises);
}
