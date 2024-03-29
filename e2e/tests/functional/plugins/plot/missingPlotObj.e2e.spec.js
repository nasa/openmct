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
Tests to verify log plot functionality when objects are missing
*/

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Handle missing object for plots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('Displays empty div for missing stacked plot item', async ({ page, browserName }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'firefox', 'Firefox failing due to console events being missed');

    let warningReceived = false;

    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('Missing domain object')) {
        warningReceived = true;
      }
    });

    const stackedPlot = await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: stackedPlot.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: stackedPlot.uuid
    });

    //Gets local storage and deletes the last sine wave generator in the stacked plot
    const mct = await page.evaluate(() => window.localStorage.getItem('mct'));
    const parsedData = JSON.parse(mct);
    const key = Object.entries(parsedData).find(([, value]) => value.type === 'generator')?.[0];

    delete parsedData[key];

    //Sets local storage with missing object
    const jsonData = JSON.stringify(parsedData);
    await page.evaluate((data) => {
      window.localStorage.setItem('mct', data);
    }, jsonData);

    //Reloads page and clicks on stacked plot
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.goto(stackedPlot.url);

    //Verify Main section is there on load
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(stackedPlot.name);

    //Check that there is only one stacked item plot with a plot, the missing one will be empty
    await expect(page.getByLabel('Stacked Plot Item')).toHaveCount(1);
    //Verify that console.warn was thrown
    expect(warningReceived).toBe(true);
  });
});
