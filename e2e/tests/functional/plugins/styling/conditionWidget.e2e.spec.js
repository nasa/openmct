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
// @ts-check
/*
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets and styling
*/
import {
  createDomainObjectWithDefaults,
  linkParameterToObject,
  setRealTimeMode,
  waitForFormattedTelemetryValue
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('A Condition Widget', () => {
  let swg;
  /**
   * @type {import('../../../../appActions.js').CreatedObjectInfo}
   */
  let conditionSet;
  /**
   * @type {import('../../../../appActions.js').CreatedObjectInfo}
   */
  let conditionWidget;

  test.beforeEach(async ({ page }) => {
    // Install the clock and set the time to the mission time such that the state generator will be controllable
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create Condition Set, State Generator, and Display Layout
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });
    swg = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test SWG Generator'
    });

    conditionWidget = await createDomainObjectWithDefaults(page, {
      type: 'Condition Widget',
      name: 'Test Condition Widget'
    });

    await setRealTimeMode(page);

    // set up the condition set to use the state generator
    await page.goto(conditionSet.url);

    // Add the SWG to the Condition Set by dragging from the main tree
    await page.getByLabel('Show selected item in tree').click();
    await page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: swg.name
      })
      .dragTo(page.locator('#conditionCollection'));

    // Add the state generator to the first criterion such that there is a condition named 'OFF' when the state generator is off
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('< 0');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ label: 'Sine' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is less than' });
    await page.getByLabel('Criterion Input').first().fill('0');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('< 0');

    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('> 0');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ label: 'Sine' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is greater than or equal to' });
    await page.getByLabel('Criterion Input').first().fill('0');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('> 0');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await linkParameterToObject(page, swg.name, conditionSet.name);

    //First, verify that it works correctly without a staleness rule applied.
    await page.goto(conditionWidget.url);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    const overlay = page.getByLabel('Modal Overlay');
    await overlay.getByLabel('Search Input').fill('Test Condition Set');
    await overlay.getByLabel('Preview Test Condition Set').click();
    await overlay.getByLabel('Save').click();
    // Something about the way we have implemented toggles does not sit right with
    // Playwright and we cannot use either .click() or .check() here.
    await page.getByLabel('Use Condition Set output as label').dispatchEvent('click');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Refresh to get the updated object configuration
    await page.reload();
  });

  test('Shows correct output when no staleness rule is applied', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/8277'
    });

    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    const label = page.getByLabel('Test Condition Widget Object View');

    await expect(page.getByLabel('Browse bar object name')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier
    });

    await expect(label.getByText('default')).toBeHidden();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '> 0'
    });
    await expect(label.getByText('> 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '< 0'
    });
    await expect(label.getByText('< 0')).toBeVisible();
  });

  test('Shows the correct output when a staleness rule is applied', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/8277'
    });
    await page.goto(conditionSet.url);
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Add Condition').click();

    await page.getByLabel('Condition Name Input').first().fill('STALE');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page
      .getByLabel('Criterion Metadata Selection')
      .first()
      .selectOption({ label: 'any data received' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is stale' });
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('STALE');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.getByLabel('Navigate to Test SWG Generator generator Object').click({
      button: 'right'
    });
    await page.getByLabel('Edit Properties').click();
    await page.getByLabel('Provide Staleness Updates').click();
    await page.getByRole('button', { name: 'Save' }).click();

    await page.goto(conditionWidget.url);

    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    await expect(page.getByLabel('Browse bar object name')).toHaveText('Test Condition Widget');
    const label = page.getByLabel('Test Condition Widget Object View');
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '> 0'
    });
    await expect(label.getByText('> 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '< 0'
    });
    await expect(label.getByText('< 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: 'STALE'
    });
    await expect(label.getByText('STALE')).toBeVisible();
  });
});
