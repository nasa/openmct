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
Tests to verify log plot functionality when objects are missing
*/

const { test, expect } = require('../../../../pluginFixtures');

test.describe('Handle missing object for plots', () => {
  test('Displays empty div for missing stacked plot item @unstable', async ({
    page,
    browserName,
    openmctConfig
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'firefox', 'Firefox failing due to console events being missed');

    const { myItemsFolderName } = openmctConfig;
    const errorLogs = [];

    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('Missing domain object')) {
        errorLogs.push(message.text());
      }
    });

    //Make stacked plot
    await makeStackedPlot(page, myItemsFolderName);

    //Gets local storage and deletes the last sine wave generator in the stacked plot
    const localStorage = await page.evaluate(() => window.localStorage);
    const parsedData = JSON.parse(localStorage.mct);
    const keys = Object.keys(parsedData);
    const lastKey = keys[keys.length - 1];

    delete parsedData[lastKey];

    //Sets local storage with missing object
    await page.evaluate(`window.localStorage.setItem('mct', '${JSON.stringify(parsedData)}')`);

    //Reloads page and clicks on stacked plot
    await Promise.all([page.reload(), page.waitForLoadState('networkidle')]);

    //Verify Main section is there on load
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Unnamed Stacked Plot');

    await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
    await Promise.all([
      page.waitForNavigation(),
      page.locator('text=Unnamed Stacked Plot').first().click()
    ]);

    //Check that there is only one stacked item plot with a plot, the missing one will be empty
    await expect(page.locator('.c-plot--stacked-container:has(.gl-plot)')).toHaveCount(1);
    //Verify that console.warn is thrown
    expect(errorLogs).toHaveLength(1);
  });
});

/**
 * This is used the create a stacked plot object
 * @private
 */
async function makeStackedPlot(page, myItemsFolderName) {
  // fresh page with time range from 2022-03-29 22:00:00.000Z to 2022-03-29 22:00:30.000Z
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  // create stacked plot
  await page.locator('button.c-create-button').click();
  await page.locator('li[role="menuitem"]:has-text("Stacked Plot")').click();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.locator('button:has-text("OK")').click(),
    //Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);

  // save the stacked plot
  await saveStackedPlot(page);

  // create a sinewave generator
  await createSineWaveGenerator(page);

  // click on stacked plot
  await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('text=Unnamed Stacked Plot').first().click()
  ]);

  // create a second sinewave generator
  await createSineWaveGenerator(page);

  // click on stacked plot
  await page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3).click();
  await Promise.all([
    page.waitForNavigation(),
    page.locator('text=Unnamed Stacked Plot').first().click()
  ]);
}

/**
 * This is used to save a stacked plot object
 * @private
 */
async function saveStackedPlot(page) {
  // save stacked plot
  await page
    .locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button')
    .nth(1)
    .click();

  await Promise.all([
    page.locator('text=Save and Finish Editing').click(),
    //Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);
  //Wait until Save Banner is gone
  await page.locator('.c-message-banner__close-button').click();
  await page.waitForSelector('.c-message-banner__message', { state: 'detached' });
}

/**
 * This is used to create a sine wave generator object
 * @private
 */
async function createSineWaveGenerator(page) {
  //Create sine wave generator
  await page.locator('button.c-create-button').click();
  await page.locator('li[role="menuitem"]:has-text("Sine Wave Generator")').click();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.locator('button:has-text("OK")').click(),
    //Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);
}
