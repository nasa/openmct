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

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithRealTime
} from '../../../../../appActions.js';
import { expect, test } from '../../../../../pluginFixtures.js';

const RICK_JPG =
  'https://raw.githubusercontent.com/nasa/openmct/554f77c42fec81cf0f63e62b278012cb08d82af9/e2e/test-data/rick.jpg';

test.describe('Display Layout Conditional Styling', () => {
  test.use({
    storageState: fileURLToPath(
      new URL('../../../../../test-data/condition_set_storage.json', import.meta.url)
    )
  });

  let displayLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
  });

  test('Image Drawing Object can have visibility toggled conditionally', async ({ page }) => {
    await page.getByLabel('Edit Object').click();

    // Add Image Drawing Object to the layout
    await page.getByLabel('Add Drawing Object').click();
    await page.getByLabel('Image').click();
    await page.getByLabel('Image URL').fill(RICK_JPG);
    await page.getByText('Ok').click();

    // Use the "Test Condition Set" for conditional styling on the image
    await page.getByRole('tab', { name: 'Styles' }).click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    await page.getByLabel('Modal Overlay').getByLabel('Expand My Items folder').click();
    await page.getByLabel('Modal Overlay').getByLabel('Preview Test Condition Set').click();
    await page.getByText('Ok').click();

    // Set the image to be hidden when the condition is met
    await page.getByTitle('Visible').first().click();
    await page.getByLabel('Save Style').first().click();
    await page.getByLabel('Save', { exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Switch to real-time mode and verify that the image toggles visibility
    await navigateToObjectWithRealTime(page, displayLayout.url);
    await expect(page.getByLabel('Image View')).toBeVisible();
    await expect(page.getByLabel('Image View')).toBeHidden();

    // Reload the page and verify that the image toggles visibility
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Image View')).toBeVisible();
    await expect(page.getByLabel('Image View')).toBeHidden();
  });

  test('Alphanumeric object can have visibility toggled conditionally', async ({ page }) => {
    await page.getByLabel('Edit Object').click();

    // Add Alphanumeric Object to the layout
    await page.getByLabel('Expand My Items folder').click();
    await page.getByLabel('Expand Test Condition Set').click();
    await page.getByLabel('Preview VIPER Rover Heading').dragTo(page.getByLabel('Layout Grid'));

    // Use the "Test Condition Set" for conditional styling on the alphanumeric
    await page.getByRole('tab', { name: 'Styles' }).click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    await page.getByLabel('Modal Overlay').getByLabel('Expand My Items folder').click();
    await page.getByLabel('Modal Overlay').getByLabel('Preview Test Condition Set').click();
    await page.getByText('Ok').click();

    // Set the alphanumeric to be hidden when the condition is met
    await page.getByTitle('Visible').first().click();
    await page.getByLabel('Save Style').first().click();
    await page.getByLabel('Save', { exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Switch to real-time mode and verify that the image toggles visibility
    await navigateToObjectWithRealTime(page, displayLayout.url);
    await expect(page.getByLabel('Alpha-numeric telemetry', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Alpha-numeric telemetry', { exact: true })).toBeHidden();

    // Reload the page and verify that the alphanumeric toggles visibility
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Alpha-numeric telemetry', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Alpha-numeric telemetry', { exact: true })).toBeHidden();
  });
});
