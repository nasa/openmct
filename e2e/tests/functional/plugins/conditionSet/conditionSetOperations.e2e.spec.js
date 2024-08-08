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
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets. Note: this
suite is sharing state between tests which is considered an anti-pattern. Implementing in this way to
demonstrate some playwright for test developers. This pattern should not be re-used in other CRUD suites.
*/

import {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Basic Condition Set Use', () => {
  let conditionSet;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all network events to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create a new condition set
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });
  });
  test('Creating a condition defaults the condition name to "Unnamed Condition"', async ({
    page
  }) => {
    await page.goto(conditionSet.url);

    // Change the object to edit mode
    await page.getByLabel('Edit Object').click();

    // Click Add Condition button
    await page.locator('#addCondition').click();
    // Check that the new Unnamed Condition section appears
    const numOfUnnamedConditions = await page
      .locator('.c-condition__name', { hasText: 'Unnamed Condition' })
      .count();
    expect(numOfUnnamedConditions).toEqual(1);
  });
  test('ConditionSet should display appropriate view options', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5924'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Alpha Sine Wave Generator'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Beta Sine Wave Generator'
    });

    await page.goto(conditionSet.url);

    // Change the object to edit mode
    await page.getByLabel('Edit Object').click();

    // Expand the 'My Items' folder in the left tree
    await page.getByLabel('Show selected item in tree').click();
    // Add the Alpha & Beta Sine Wave Generator to the Condition Set and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const alphaGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: 'Alpha Sine Wave Generator'
    });
    const betaGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: 'Beta Sine Wave Generator'
    });
    const conditionCollection = page.locator('#conditionCollection');

    await alphaGeneratorTreeItem.dragTo(conditionCollection);
    await betaGeneratorTreeItem.dragTo(conditionCollection);

    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.getByLabel('Open the View Switcher Menu').click();

    await expect(page.getByRole('menuitem', { name: /Lad Table/ })).toBeHidden();
    await expect(page.getByRole('menuitem', { name: /Conditions View/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Plot/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Telemetry Table/ })).toBeVisible();
    await page.getByLabel('Plot').click();
    await expect(
      page.getByLabel('Plot Legend Collapsed').getByText('Test Condition Set')
    ).toBeVisible();
    await page.getByLabel('Open the View Switcher Menu').click();
    await page.getByLabel('Telemetry Table').click();
    await expect(page.getByRole('searchbox', { name: 'output filter input' })).toBeVisible();
    await page.getByLabel('Open the View Switcher Menu').click();
    await page.getByLabel('Conditions View').click();
    await expect(page.getByText('Current Output')).toBeVisible();
  });
  test('ConditionSet has correct outputs when telemetry is and is not available', async ({
    page
  }) => {
    const exampleTelemetry = await createExampleTelemetryObject(page);

    await page.getByLabel('Show selected item in tree').click();
    await page.goto(conditionSet.url);
    // Change the object to edit mode
    await page.getByLabel('Edit Object').click();

    // Create two conditions
    await page.locator('#addCondition').click();
    await page.locator('#addCondition').click();
    await page.locator('#conditionCollection').getByRole('textbox').nth(0).fill('First Condition');
    await page.locator('#conditionCollection').getByRole('textbox').nth(1).fill('Second Condition');

    // Add Telemetry to ConditionSet
    const sineWaveGeneratorTreeItem = page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: exampleTelemetry.name
      });
    const conditionCollection = page.locator('#conditionCollection');
    await sineWaveGeneratorTreeItem.dragTo(conditionCollection);

    // Modify First Criterion
    const firstCriterionTelemetry = page.locator(
      '[aria-label="Criterion Telemetry Selection"] >> nth=0'
    );
    firstCriterionTelemetry.selectOption({ label: exampleTelemetry.name });
    const firstCriterionMetadata = page.locator(
      '[aria-label="Criterion Metadata Selection"] >> nth=0'
    );
    firstCriterionMetadata.selectOption({ label: 'Sine' });
    const firstCriterionComparison = page.locator(
      '[aria-label="Criterion Comparison Selection"] >> nth=0'
    );
    firstCriterionComparison.selectOption({ label: 'is greater than or equal to' });
    const firstCriterionInput = page.locator('[aria-label="Criterion Input"] >> nth=0');
    await firstCriterionInput.fill('0');

    // Modify First Criterion
    const secondCriterionTelemetry = page.locator(
      '[aria-label="Criterion Telemetry Selection"] >> nth=1'
    );
    secondCriterionTelemetry.selectOption({ label: exampleTelemetry.name });

    const secondCriterionMetadata = page.locator(
      '[aria-label="Criterion Metadata Selection"] >> nth=1'
    );
    secondCriterionMetadata.selectOption({ label: 'Sine' });

    const secondCriterionComparison = page.locator(
      '[aria-label="Criterion Comparison Selection"] >> nth=1'
    );
    secondCriterionComparison.selectOption({ label: 'is less than' });

    const secondCriterionInput = page.locator('[aria-label="Criterion Input"] >> nth=1');
    await secondCriterionInput.fill('0');

    // Save ConditionSet
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Validate that the condition set is evaluating and outputting
    // the correct value when the underlying telemetry subscription is active.
    let outputValue = page.getByLabel('Current Output Value');
    await expect(outputValue).toHaveText('false');

    await page.goto(exampleTelemetry.url);

    // Edit SWG to add 8 second loading delay to simulate the case
    // where telemetry is not available.
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByRole('spinbutton', { name: 'Loading Delay (ms)' }).fill('8000');
    await page.getByLabel('Save').click();

    // Expect that the output value is blank or '---' if the
    // underlying telemetry subscription is not active.
    await page.goto(conditionSet.url);
    await expect(outputValue).toHaveText('---');
  });

  test('ConditionSet has correct outputs when test data is enabled', async ({ page }) => {
    const exampleTelemetry = await createExampleTelemetryObject(page);

    await page.getByLabel('Show selected item in tree').click();
    await page.goto(conditionSet.url);
    // Change the object to edit mode
    await page.getByLabel('Edit Object').click();

    // Create two conditions
    await page.locator('#addCondition').click();
    await page.locator('#addCondition').click();
    await page.locator('#conditionCollection').getByRole('textbox').nth(0).fill('First Condition');
    await page.locator('#conditionCollection').getByRole('textbox').nth(1).fill('Second Condition');

    // Add Telemetry to ConditionSet
    const sineWaveGeneratorTreeItem = page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: exampleTelemetry.name
      });
    const conditionCollection = page.locator('#conditionCollection');
    await sineWaveGeneratorTreeItem.dragTo(conditionCollection);

    // Modify First Criterion
    const firstCriterionTelemetry = page.locator(
      '[aria-label="Criterion Telemetry Selection"] >> nth=0'
    );
    firstCriterionTelemetry.selectOption({ label: exampleTelemetry.name });
    const firstCriterionMetadata = page.locator(
      '[aria-label="Criterion Metadata Selection"] >> nth=0'
    );
    firstCriterionMetadata.selectOption({ label: 'Sine' });
    const firstCriterionComparison = page.locator(
      '[aria-label="Criterion Comparison Selection"] >> nth=0'
    );
    firstCriterionComparison.selectOption({ label: 'is greater than or equal to' });
    const firstCriterionInput = page.locator('[aria-label="Criterion Input"] >> nth=0');
    await firstCriterionInput.fill('0');

    // Modify Second Criterion
    const secondCriterionTelemetry = page.locator(
      '[aria-label="Criterion Telemetry Selection"] >> nth=1'
    );
    await secondCriterionTelemetry.selectOption({ label: exampleTelemetry.name });

    const secondCriterionMetadata = page.locator(
      '[aria-label="Criterion Metadata Selection"] >> nth=1'
    );
    await secondCriterionMetadata.selectOption({ label: 'Sine' });

    const secondCriterionComparison = page.locator(
      '[aria-label="Criterion Comparison Selection"] >> nth=1'
    );
    await secondCriterionComparison.selectOption({ label: 'is less than' });

    const secondCriterionInput = page.locator('[aria-label="Criterion Input"] >> nth=1');
    await secondCriterionInput.fill('0');

    // Enable test data
    await page.getByLabel('Apply Test Data').nth(1).click();
    const testDataTelemetry = page.locator('[aria-label="Test Data Telemetry Selection"] >> nth=0');
    await testDataTelemetry.selectOption({ label: exampleTelemetry.name });

    const testDataMetadata = page.locator('[aria-label="Test Data Metadata Selection"] >> nth=0');
    await testDataMetadata.selectOption({ label: 'Sine' });

    const testInput = page.locator('[aria-label="Test Data Input"] >> nth=0');
    await testInput.fill('0');

    // Validate that the condition set is evaluating and outputting
    // the correct value when the underlying telemetry subscription is active.
    let outputValue = page.getByLabel('Current Output Value');
    await expect(outputValue).toHaveText('false');

    await page.goto(exampleTelemetry.url);
  });

  test.fixme('Ensure condition sets work with telemetry like operator status', ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7484'
    });
  });
});

test.describe('Condition Set Composition', () => {
  let conditionSet;
  let exampleTelemetry;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Condition Set
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set'
    });

    // Create Telemetry Object as child to Condition Set
    exampleTelemetry = await createExampleTelemetryObject(page, conditionSet.uuid);

    // Edit Condition Set
    await page.goto(conditionSet.url);
    await page.getByRole('button', { name: 'Edit Object' }).click();

    // Add Condition to Condition Set
    await page.getByRole('button', { name: 'Add Condition' }).click();

    // Enter Condition Output
    await page.getByLabel('Condition Name Input').first().fill('Negative');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('Negative');

    // Condition Trigger default is okay so no change needed to form

    // Enter Condition Criterion
    await page.getByLabel('Criterion Telemetry Selection').first().selectOption({ value: 'all' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ value: 'sin' });
    await page
      .locator('select[aria-label="Criterion Comparison Selection"]')
      .first()
      .selectOption({ value: 'lessThan' });
    await page.getByLabel('Criterion Input').first().fill('0');

    // Save the Condition Set
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
  });

  test('You can remove telemetry from a condition set with existing conditions', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7710'
    });

    await page.getByLabel('Expand My Items folder').click();
    await page.getByLabel(`Expand ${conditionSet.name} conditionSet`).click();

    await page
      .getByLabel(`Navigate to ${exampleTelemetry.name}`, { exact: false })
      .click({ button: 'right' });

    await page
      .getByLabel(`${exampleTelemetry.name} Context Menu`)
      .getByRole('menuitem', { name: 'Remove' })
      .click();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    await page
      .getByLabel(`Navigate to ${conditionSet.name} conditionSet Object`, { exact: true })
      .click();
    await page.getByRole('button', { name: 'Edit Object' }).click();
    await page.getByRole('tab', { name: 'Elements' }).click();
    expect(
      await page
        .getByRole('tabpanel', { name: 'Inspector Views' })
        .getByRole('listitem', { name: exampleTelemetry.name })
        .count()
    ).toEqual(0);
  });
});
