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
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets. Note: this
suite is sharing state between tests which is considered an anti-pattern. Implementing in this way to
demonstrate some playwright for test developers. This pattern should not be re-used in other CRUD suites.
*/

const { test, expect } = require('../../../../pluginFixtures.js');
const {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject
} = require('../../../../appActions');

let conditionSetUrl;
let getConditionSetIdentifierFromUrl;

test.describe.serial('Condition Set CRUD Operations on @localStorage', () => {
  test.beforeAll(async ({ browser }) => {
    //TODO: This needs to be refactored
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("Create")');

    await page.locator('li[role="menuitem"]:has-text("Condition Set")').click();

    await Promise.all([page.waitForNavigation(), page.click('button:has-text("OK")')]);

    //Save localStorage for future test execution
    await context.storageState({ path: './e2e/test-data/recycled_local_storage.json' });

    //Set object identifier from url
    conditionSetUrl = page.url();

    getConditionSetIdentifierFromUrl = conditionSetUrl.split('/').pop().split('?')[0];
    console.debug(`getConditionSetIdentifierFromUrl: ${getConditionSetIdentifierFromUrl}`);
    await page.close();
  });

  //Load localStorage for subsequent tests
  test.use({ storageState: './e2e/test-data/recycled_local_storage.json' });

  //Begin suite of tests again localStorage
  test('Condition set object properties persist in main view and inspector @localStorage', async ({
    page
  }) => {
    //Navigate to baseURL with injected localStorage
    await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });

    //Assertions on loaded Condition Set in main view. This is a stateful transition step after page.goto()
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Unnamed Condition Set');

    //Assertions on loaded Condition Set in Inspector
    expect.soft(page.locator('_vue=item.name=Unnamed Condition Set')).toBeTruthy();

    //Reload Page
    await Promise.all([page.reload(), page.waitForLoadState('networkidle')]);

    //Re-verify after reload
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Unnamed Condition Set');
    //Assertions on loaded Condition Set in Inspector
    expect.soft(page.locator('_vue=item.name=Unnamed Condition Set')).toBeTruthy();
  });
  test('condition set object can be modified on @localStorage', async ({ page, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;

    await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });

    //Assertions on loaded Condition Set in main view. This is a stateful transition step after page.goto()
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Unnamed Condition Set');

    //Update the Condition Set properties
    // Click Edit Button
    await page.locator('text=Conditions View Snapshot >> button').nth(3).click();

    //Edit Condition Set Name from main view
    await page
      .locator('.l-browse-bar__object-name')
      .filter({ hasText: 'Unnamed Condition Set' })
      .first()
      .fill('Renamed Condition Set');
    await page
      .locator('.l-browse-bar__object-name')
      .filter({ hasText: 'Renamed Condition Set' })
      .first()
      .press('Enter');
    // Click Save Button
    await page
      .locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button')
      .nth(1)
      .click();
    // Click Save and Finish Editing Option
    await page.locator('text=Save and Finish Editing').click();

    //Verify Main section reflects updated Name Property
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Renamed Condition Set');

    // Verify Inspector properties
    // Verify Inspector has updated Name property
    expect.soft(page.locator('text=Renamed Condition Set').nth(1)).toBeTruthy();
    // Verify Inspector Details has updated Name property
    expect.soft(page.locator('text=Renamed Condition Set').nth(2)).toBeTruthy();

    // Verify Tree reflects updated Name property
    // Expand Tree
    await page.locator(`text=Open MCT ${myItemsFolderName} >> span >> nth=3`).click();
    // Verify Condition Set Object is renamed in Tree
    expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
    // Verify Search Tree reflects renamed Name property
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Renamed');
    expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();

    //Reload Page
    await Promise.all([page.reload(), page.waitForLoadState('networkidle')]);

    //Verify Main section reflects updated Name Property
    await expect
      .soft(page.locator('.l-browse-bar__object-name'))
      .toContainText('Renamed Condition Set');

    // Verify Inspector properties
    // Verify Inspector has updated Name property
    expect.soft(page.locator('text=Renamed Condition Set').nth(1)).toBeTruthy();
    // Verify Inspector Details has updated Name property
    expect.soft(page.locator('text=Renamed Condition Set').nth(2)).toBeTruthy();

    // Verify Tree reflects updated Name property
    // Expand Tree
    await page.locator(`text=Open MCT ${myItemsFolderName} >> span >> nth=3`).click();
    // Verify Condition Set Object is renamed in Tree
    expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
    // Verify Search Tree reflects renamed Name property
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Renamed');
    expect(page.locator('a:has-text("Renamed Condition Set")')).toBeTruthy();
  });
  test('condition set object can be deleted by Search Tree Actions menu on @localStorage', async ({
    page
  }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Assertions on loaded Condition Set in main view. This is a stateful transition step after page.goto()
    await expect(
      page.locator('a:has-text("Unnamed Condition Set Condition Set") >> nth=0')
    ).toBeVisible();

    const numberOfConditionSetsToStart = await page
      .locator('a:has-text("Unnamed Condition Set Condition Set")')
      .count();

    // Search for Unnamed Condition Set
    await page
      .locator('[aria-label="OpenMCT Search"] input[type="search"]')
      .fill('Unnamed Condition Set');
    // Click Search Result
    await page
      .locator('[aria-label="OpenMCT Search"] >> text=Unnamed Condition Set')
      .first()
      .click();
    // Click hamburger button
    await page.locator('[title="More options"]').click();

    // Click 'Remove' and press OK
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();
    await page.locator('button:has-text("OK")').click();

    //Expect Unnamed Condition Set to be removed in Main View
    const numberOfConditionSetsAtEnd = await page
      .locator('a:has-text("Unnamed Condition Set Condition Set")')
      .count();

    expect(numberOfConditionSetsAtEnd).toEqual(numberOfConditionSetsToStart - 1);

    //Feature?
    //Domain Object is still available by direct URL after delete
    await page.goto(conditionSetUrl, { waitUntil: 'networkidle' });
    await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Condition Set');
  });
});

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
    await page.locator('[title="Edit"]').click();

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
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    page.click('button[title="Show selected item in tree"]');
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

    await page.click('button[title="Change the current view"]');

    await expect(page.getByRole('menuitem', { name: /Lad Table/ })).toBeHidden();
    await expect(page.getByRole('menuitem', { name: /Conditions View/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Plot/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Telemetry Table/ })).toBeVisible();
  });
  test('ConditionSet has correct outputs when telemetry is and is not available', async ({
    page
  }) => {
    const exampleTelemetry = await createExampleTelemetryObject(page);

    await page.getByTitle('Show selected item in tree').click();
    await page.goto(conditionSet.url);
    // Change the object to edit mode
    await page.locator('[title="Edit"]').click();

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
    let outputValue = page.locator('[aria-label="Current Output Value"]');
    await expect(outputValue).toHaveText('false');

    await page.goto(exampleTelemetry.url);

    // Edit SWG to add 8 second loading delay to simulate the case
    // where telemetry is not available.
    await page.getByTitle('More options').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByRole('spinbutton', { name: 'Loading Delay (ms)' }).fill('8000');
    await page.getByLabel('Save').click();

    // Expect that the output value is blank or '---' if the
    // underlying telemetry subscription is not active.
    await page.goto(conditionSet.url);
    await expect(outputValue).toHaveText('---');
  });
});
