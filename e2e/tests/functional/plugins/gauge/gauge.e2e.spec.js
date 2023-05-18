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
 * This test suite is dedicated to testing the Gauge component.
 */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const uuid = require('uuid').v4;

test.describe('Gauge', () => {
  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Can add and remove telemetry sources @unstable', async ({ page }) => {
    // Create the gauge with defaults
    const gauge = await createDomainObjectWithDefaults(page, { type: 'Gauge' });
    const editButtonLocator = page.locator('button[title="Edit"]');
    const saveButtonLocator = page.locator('button[title="Save"]');

    // Create a sine wave generator within the gauge
    const swg1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: gauge.uuid
    });

    // Navigate to the gauge and verify that
    // the SWG appears in the elements pool
    await page.goto(gauge.url);
    await editButtonLocator.click();
    await expect.soft(page.locator(`#inspector-elements-tree >> text=${swg1.name}`)).toBeVisible();
    await saveButtonLocator.click();
    await page.locator('li[title="Save and Finish Editing"]').click();

    // Create another sine wave generator within the gauge
    const swg2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: `swg-${uuid()}`,
      parent: gauge.uuid
    });

    // Verify that the 'Replace telemetry source' modal appears and accept it
    await expect
      .soft(
        page.locator(
          'text=This action will replace the current telemetry source. Do you want to continue?'
        )
      )
      .toBeVisible();
    await page.click('text=Ok');

    // Navigate to the gauge and verify that the new SWG
    // appears in the elements pool and the old one is gone
    await page.goto(gauge.url);
    await editButtonLocator.click();
    await expect.soft(page.locator(`#inspector-elements-tree >> text=${swg1.name}`)).toBeHidden();
    await expect.soft(page.locator(`#inspector-elements-tree >> text=${swg2.name}`)).toBeVisible();
    await saveButtonLocator.click();

    // Right click on the new SWG in the elements pool and delete it
    await page.locator(`#inspector-elements-tree >> text=${swg2.name}`).click({
      button: 'right'
    });
    await page.locator('li[title="Remove this object from its containing object."]').click();

    // Verify that the 'Remove object' confirmation modal appears and accept it
    await expect
      .soft(
        page.locator(
          'text=Warning! This action will remove this object. Are you sure you want to continue?'
        )
      )
      .toBeVisible();
    await page.click('text=Ok');

    // Verify that the elements pool shows no elements
    await expect(page.locator('text="No contained elements"')).toBeVisible();
  });
  test('Can create a non-default Gauge', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5356'
    });
    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object specified by 'type'
    await page.click(`li[role='menuitem']:text("Gauge")`);
    // FIXME: We need better selectors for these custom form controls
    const displayCurrentValueSwitch = page.locator('.c-toggle-switch__slider >> nth=0');
    await displayCurrentValueSwitch.setChecked(false);
    await page.click('button[aria-label="Save"]');

    // TODO: Verify changes in the UI
  });
  test('Can edit a single Gauge-specific property', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5985'
    });

    // Create the gauge with defaults
    await createDomainObjectWithDefaults(page, { type: 'Gauge' });
    await page.click('button[title="More options"]');
    await page.click('li[role="menuitem"]:has-text("Edit Properties")');
    // FIXME: We need better selectors for these custom form controls
    const displayCurrentValueSwitch = page.locator('.c-toggle-switch__slider >> nth=0');
    await displayCurrentValueSwitch.setChecked(false);
    await page.click('button[aria-label="Save"]');

    // TODO: Verify changes in the UI
  });
});
