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
Testsuite for plot autoscale.
*/

const { selectInspectorTab } = require('../../../../appActions');
const { test, expect } = require('../../../../pluginFixtures');
test.use({
  viewport: {
    width: 1280,
    height: 720
  }
});

test.describe('Autoscale', () => {
  test('User can set autoscale with a valid range @snapshot', async ({ page, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;

    //This is necessary due to the size of the test suite.
    test.slow();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await setTimeRange(page);

    await createSinewaveOverlayPlot(page, myItemsFolderName);

    await testYTicks(page, ['-1.00', '-0.50', '0.00', '0.50', '1.00']);

    // enter edit mode
    await page.click('button[title="Edit"]');

    await selectInspectorTab(page, 'Config');
    await turnOffAutoscale(page);

    await setUserDefinedMinAndMax(page, '-2', '2');

    // save
    await page.click('button[title="Save"]');
    await Promise.all([
      page.locator('li[title = "Save and Finish Editing"]').click(),
      //Wait for Save Banner to appear
      page.waitForSelector('.c-message-banner__message')
    ]);
    //Wait until Save Banner is gone
    await page.locator('.c-message-banner__close-button').click();
    await page.waitForSelector('.c-message-banner__message', { state: 'detached' });

    // Make sure that after turning off autoscale, the user entered range values are reflexted in the ticks.
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
    await testYTicks(page, ['0.00', '0.50', '1.00', '1.50', '2.00', '2.50', '3.00', '3.50']);

    //Wait for canvas to stablize.
    await canvas.hover({ trial: true });

    expect
      .soft(await canvas.screenshot())
      .toMatchSnapshot('autoscale-canvas-panned.png', { animations: 'disabled' });
  });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} start
 * @param {string} end
 */
async function setTimeRange(
  page,
  start = '2022-03-29 22:00:00.000Z',
  end = '2022-03-29 22:00:30.000Z'
) {
  // Set a specific time range for consistency, otherwise it will change
  // on every test to a range based on the current time.

  const timeInputs = page.locator('input.c-input--datetime');
  await timeInputs.first().click();
  await timeInputs.first().fill(start);

  await timeInputs.nth(1).click();
  await timeInputs.nth(1).fill(end);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 */
async function createSinewaveOverlayPlot(page, myItemsFolderName) {
  // click create button
  await page.locator('button:has-text("Create")').click();

  // add overlay plot with defaults
  await page.locator('li[role="menuitem"]:has-text("Overlay Plot")').click();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('button:has-text("OK")').click(),
    //Wait for Save Banner to appear1
    page.waitForSelector('.c-message-banner__message')
  ]);
  //Wait until Save Banner is gone
  await page.locator('.c-message-banner__close-button').click();
  await page.waitForSelector('.c-message-banner__message', { state: 'detached' });

  // save (exit edit mode)
  await page
    .locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button')
    .nth(1)
    .click();
  await page.locator('text=Save and Finish Editing').click();

  // click create button
  await page.locator('button:has-text("Create")').click();

  // add sine wave generator with defaults
  await page.locator('li[role="menuitem"]:has-text("Sine Wave Generator")').click();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('button:has-text("OK")').click(),
    //Wait for Save Banner to appear1
    page.waitForSelector('.c-message-banner__message')
  ]);
  //Wait until Save Banner is gone
  await page.locator('.c-message-banner__close-button').click();
  await page.waitForSelector('.c-message-banner__message', { state: 'detached' });

  // focus the overlay plot
  await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('text=Unnamed Overlay Plot').first().click()
  ]);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function turnOffAutoscale(page) {
  // uncheck autoscale
  await page.getByRole('checkbox', { name: 'Auto scale' }).uncheck();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} min
 * @param {string} max
 */
async function setUserDefinedMinAndMax(page, min, max) {
  // set minimum value
  await page.getByRole('spinbutton').first().fill(min);
  // set maximum value
  await page.getByRole('spinbutton').nth(1).fill(max);
}

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
