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
 * This test suite is dedicated to testing the Scatter Plot component.
 */

import { v4 as uuid } from 'uuid';

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Scatter Plot', () => {
  let scatterPlot;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create the Scatter Plot
    scatterPlot = await createDomainObjectWithDefaults(page, { type: 'Scatter Plot' });
  });

  test('Can add and remove telemetry sources', async ({ page }) => {
    // Create a sine wave generator within the scatter plot
    const swg1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: scatterPlot.uuid
    });

    // Navigate to the scatter plot and verify that
    // the SWG appears in the elements pool
    await page.goto(scatterPlot.url);
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Elements' }).click();
    await expect(page.getByLabel(`Preview ${swg1.name}`)).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create another sine wave generator within the scatter plot
    const swg2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: scatterPlot.uuid
    });

    // Verify that the 'Replace telemetry source' modal appears and accept it
    await expect(
      page.getByText(
        'This action will replace the current telemetry source. Do you want to continue?'
      )
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    // Navigate to the scatter plot and verify that the new SWG
    // appears in the elements pool and the old one is gone
    await page.goto(scatterPlot.url);
    await page.getByLabel('Edit Object').click();

    // Click the "Elements" tab
    await page.getByRole('tab', { name: 'Elements' }).click();
    await expect(page.getByLabel(`Preview ${swg1.name}`)).toBeHidden();
    await expect(page.getByLabel(`Preview ${swg2.name}`)).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();

    // Right click on the new SWG in the elements pool and delete it
    await page.getByLabel(`Preview ${swg2.name}`).click({
      button: 'right'
    });
    await page.getByLabel('Remove').click();

    // Verify that the 'Remove object' confirmation modal appears and accept it
    await expect(
      page.getByText(
        'Warning! This action will remove this object. Are you sure you want to continue?'
      )
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    // Verify that the elements pool shows no elements
    await expect(page.getByText('No contained elements')).toBeVisible();
  });
});
