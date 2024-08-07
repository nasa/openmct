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
 * This test suite is dedicated to testing the Gauge component.
 */

import { v4 as uuid } from 'uuid';

import {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Gauge', () => {
  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Can add and remove telemetry sources', async ({ page }) => {
    // Create the gauge with defaults
    const gauge = await createDomainObjectWithDefaults(page, { type: 'Gauge' });

    // Create a sine wave generator within the gauge
    const swg1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: gauge.uuid
    });

    // Navigate to the gauge and verify that
    // the SWG appears in the elements pool
    await page.goto(gauge.url);
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Elements' }).click();
    await expect.soft(page.locator(`#inspector-elements-tree >> text=${swg1.name}`)).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create another sine wave generator within the gauge
    const swg2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: gauge.uuid
    });

    // Verify that the 'Replace telemetry source' modal appears and accept it
    await expect(
      page.getByText(
        'This action will replace the current telemetry source. Do you want to continue?'
      )
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    // Navigate to the gauge and verify that the new SWG
    // appears in the elements pool and the old one is gone
    await page.goto(gauge.url);
    await page.getByLabel('Edit Object').click();
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
    await expect(page.locator('text="No contained elements"')).toBeVisible();
  });
  test('Can create a non-default Gauge', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5356'
    });
    //Click the Create button
    await page.getByRole('button', { name: 'Create' }).click();

    // Click the object specified by 'type'
    await page.getByRole('menuitem', { name: 'Gauge' }).click();
    // FIXME: We need better selectors for these custom form controls
    const displayCurrentValueSwitch = page.locator('.c-toggle-switch__slider >> nth=0');
    await displayCurrentValueSwitch.uncheck();
    await page.getByLabel('Save').click();

    // TODO: Verify changes in the UI
  });
  test('Can edit a single Gauge-specific property', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5985'
    });

    // Create the gauge with defaults
    await createDomainObjectWithDefaults(page, { type: 'Gauge' });
    await page.getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    // FIXME: We need better selectors for these custom form controls
    const displayCurrentValueSwitch = page.locator('.c-toggle-switch__slider >> nth=0');
    await displayCurrentValueSwitch.uncheck();
    await page.getByLabel('Save').click();

    // TODO: Verify changes in the UI
  });

  test('Gauge does not display NaN when data not available', async ({ page }) => {
    // Create a Gauge
    const gauge = await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Gauge with no data'
    });

    // Create a Sine Wave Generator in the Gauge with a loading delay
    const swgWith5sDelay = await createExampleTelemetryObject(page, gauge.uuid);

    await page.goto(swgWith5sDelay.url);
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: /Edit Properties.../ }).click();

    //Edit Example Telemetry Object to include 5s loading Delay
    await page.getByLabel('Loading Delay (ms)', { exact: true }).fill('5000');

    await page.getByRole('button', { name: 'Save' }).click();

    // Wait until the URL is updated
    await page.waitForURL(`**/${gauge.uuid}/*`);

    // Nav to the Gauge
    await page.goto(gauge.url, { waitUntil: 'domcontentloaded' });
    // Check that the value is not displayed
    //TODO https://github.com/nasa/openmct/issues/7790 update this locator
    await expect(page.getByTitle('Value is currently out of')).toHaveAttribute(
      'aria-valuenow',
      '--'
    );
  });

  test('Gauge enforces composition policy', async ({ page }) => {
    // Create a Gauge
    await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Unnamed Gauge'
    });

    // Try to create a Folder into the Gauge. Should be disallowed.
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('menuitem', { name: /Folder/ }).click();
    await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
    await page.getByLabel('Cancel').click();

    // Try to create a Display Layout into the Gauge. Should be disallowed.
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('menuitem', { name: /Display Layout/ }).click();
    await expect(page.locator('[aria-label="Save"]')).toBeDisabled();
  });
});
