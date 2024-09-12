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
/**
 * This test suite is dedicated to generating LocalStorage via Session Storage to be used
 * in some visual test suites like controlledClock.visual.spec.js. This suite should run to completion
 * and generate an artifact in ./e2e/test-data/<name>_storage.json . This will run
 * on every commit to ensure that this object still loads into tests correctly and will retain the
 * *.e2e.spec.js suffix.
 *
 * TODO: Provide additional validation of object properties as it grows.
 * Verification of object properties happens in this file before the test-data is generated,
 * and is additionally verified in the validation test suites below.
 */

import { fileURLToPath } from 'url';

import {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject,
  setFixedIndependentTimeConductorBounds,
  setTimeConductorBounds
} from '../../appActions.js';
import { MISSION_TIME } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';

const overlayPlotName = 'Overlay Plot with Telemetry Object';

test.describe('Generate Visual Test Data @localStorage @generatedata @clock', () => {
  test.beforeEach(async ({ page }) => {
    // Override the clock
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();
    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Generate display layout with 2 child display layouts', async ({ page, context }) => {
    const parent = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Parent Display Layout'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Layout 1',
      parent: parent.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Layout 2',
      parent: parent.uuid
    });

    await page.goto(parent.url, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Child Layout 2 Layout', { exact: true }).hover();
    await page.getByLabel('Move Sub-object Frame').nth(1).click();
    await page.getByLabel('X:').fill('30');

    await page.getByLabel('Child Layout 1 Layout', { exact: true }).hover();
    await page.getByLabel('Move Sub-object Frame').first().click();
    await page.getByLabel('Y:').fill('30');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL('../../../e2e/test-data/display_layout_with_child_layouts.json', import.meta.url)
      )
    });
  });

  test('Generate display layout with 1 child overlay plot', async ({ page, context }) => {
    const parent = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Parent Display Layout'
    });
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Child Overlay Plot 1',
      parent: parent.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Child SWG 1',
      parent: overlayPlot.uuid
    });

    await page.goto(parent.url, { waitUntil: 'domcontentloaded' });

    await setFixedIndependentTimeConductorBounds(page, {
      start: '2024-11-12 19:11:11.000Z',
      end: '2024-11-12 20:11:11.000Z'
    });

    const NEW_GLOBAL_START_DATE = '2024-11-11';
    const NEW_GLOBAL_START_TIME = '19:11:11';
    const NEW_GLOBAL_END_DATE = '2024-11-11';
    const NEW_GLOBAL_END_TIME = '20:11:11';

    await setTimeConductorBounds(page, {
      startDate: NEW_GLOBAL_START_DATE,
      startTime: NEW_GLOBAL_START_TIME,
      endDate: NEW_GLOBAL_END_DATE,
      endTime: NEW_GLOBAL_END_TIME
    });

    // Verify that the global time conductor bounds have been updated
    await expect(
      page.getByLabel(`Start bounds: ${NEW_GLOBAL_START_DATE} ${NEW_GLOBAL_START_TIME}.000Z`)
    ).toBeVisible();
    await expect(
      page.getByLabel(`End bounds: ${NEW_GLOBAL_END_DATE} ${NEW_GLOBAL_END_TIME}.000Z`)
    ).toBeVisible();

    //Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL(
          '../../../e2e/test-data/display_layout_with_child_overlay_plot.json',
          import.meta.url
        )
      )
    });
  });

  test('Generate flexible layout with 2 child display layouts', async ({ page, context }) => {
    // Create Display Layout
    const parent = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Parent Flexible Layout'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Layout 1',
      parent: parent.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Layout 2',
      parent: parent.uuid
    });

    await page.goto(parent.url, { waitUntil: 'domcontentloaded' });

    //Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL('../../../e2e/test-data/flexible_layout_with_child_layouts.json', import.meta.url)
      )
    });
  });

  // TODO: Visual test for the generated object here
  // - Move to using appActions to create the overlay plot
  //   and embedded standard telemetry object
  test('Generate Overlay Plot with Telemetry Object', async ({ page, context }) => {
    // Create Overlay Plot
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: overlayPlotName
    });

    // Create Telemetry Object
    const exampleTelemetry = await createExampleTelemetryObject(page);

    // Make Link from Telemetry Object to Overlay Plot
    await page.locator('button[title="More actions"]').click();

    // Select 'Create Link' from dropdown
    await page.getByRole('menuitem', { name: 'Create Link' }).click();

    // Search and Select for overlay Plot within Create Modal
    await page.getByRole('dialog').getByRole('searchbox', { name: 'Search Input' }).click();
    await page
      .getByRole('dialog')
      .getByRole('searchbox', { name: 'Search Input' })
      .fill(overlayPlot.name);
    await page
      .getByRole('treeitem', { name: new RegExp(overlayPlot.name) })
      .locator('a')
      .click();
    await page.getByRole('button', { name: 'Save' }).click();

    await page.goto(overlayPlot.url);

    // TODO: Flesh Out Assertions against created Objects
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlotName);
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Plot Series Items').getByLabel('Expand').click();

    // TODO: Modify the Overlay Plot to use fixed Scaling
    // TODO: Verify Autoscaling.

    // TODO: Fix accessibility of Plot Series Properties tables
    // Assert that the Plot Series properties have the correct values
    await expect(
      page.locator('[role=cell]:has-text("Value")~[role=cell]:has-text("sin")')
    ).toBeVisible();
    await expect(
      page.locator(
        '[role=cell]:has-text("Line Method")~[role=cell]:has-text("Linear interpolation")'
      )
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Markers")~[role=cell]:has-text("Point: 2px")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Alarm Markers")~[role=cell]:has-text("Enabled")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Limit Lines")~[role=cell]:has-text("Disabled")')
    ).toBeVisible();

    await page.goto(exampleTelemetry.url);
    await page.getByRole('tab', { name: 'Properties' }).click();

    // TODO: assert Example Telemetry property values
    // await page.goto(exampleTelemetry.url);

    // Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL('../../../e2e/test-data/overlay_plot_storage.json', import.meta.url)
      )
    });
  });
  // TODO: Merge this with previous test. Edit object created in previous test.
  test('Generate Overlay Plot with 5s Delay', async ({ page, context }) => {
    // add overlay plot with defaults
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Overlay Plot with 5s Delay'
    });

    const swgWith5sDelay = await createExampleTelemetryObject(page, overlayPlot.uuid);

    await page.goto(swgWith5sDelay.url);
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();

    //Edit Example Telemetry Object to include 5s loading Delay
    await page.locator('[aria-label="Loading Delay \\(ms\\)"]').fill('5000');

    await Promise.all([
      page.waitForNavigation(),
      page.locator('text=OK').click(),
      //Wait for Save Banner to appear
      page.locator('.c-message-banner__message').hover({ trial: true })
    ]);

    // focus the overlay plot
    await page.goto(overlayPlot.url);

    await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlot.name);

    // Clear Recently Viewed
    await page.getByRole('button', { name: 'Clear Recently Viewed' }).click();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();
    //Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL('../../../e2e/test-data/overlay_plot_with_delay_storage.json', import.meta.url)
      )
    });
  });
});

test.describe('Generate Conditional Styling Data @localStorage @generatedata', () => {
  test('Generate basic condition set', async ({ page, context }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create a Condition Set
    const conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });

    // Create a Telemetry Object (Sine Wave Generator)
    const swg = await createExampleTelemetryObject(page, conditionSet.uuid);

    // Edit the Telemetry Object to have a 10hz data rate (Gotta go fast!)
    await page.goto(swg.url);
    await page.getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByLabel('Period', { exact: true }).fill('5');
    await page.getByLabel('Save').click();

    // Edit the Condition Set
    await page.goto(conditionSet.url);
    await page.getByLabel('Edit Object').click();

    // Add a Condition to the Condition Set
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('Test Condition');
    await page.getByLabel('Condition Output Type').first().selectOption('String');
    await page.getByLabel('Condition Output String').first().fill('Test Condition Met');

    // Condition: True if sine value > 0 (half the time)
    await page.getByLabel('Criterion Telemetry Selection').selectOption(swg.name);
    await page.getByLabel('Criterion Metadata Selection').selectOption('Sine');
    await page.getByLabel('Criterion Comparison Selection').selectOption('is greater than');
    await page.getByLabel('Criterion Input').first().fill('0');

    // Rename default condition
    await page.getByLabel('Condition Output String').nth(1).fill('Test Condition Unmet');
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Save localStorage for future test execution
    await context.storageState({
      path: fileURLToPath(
        new URL('../../../e2e/test-data/condition_set_storage.json', import.meta.url)
      )
    });
  });
});

test.describe('Validate Overlay Plot with Telemetry Object @localStorage @generatedata', () => {
  test.use({
    storageState: fileURLToPath(
      new URL('../../../e2e/test-data/overlay_plot_storage.json', import.meta.url)
    )
  });
  test('Validate Overlay Plot with Telemetry Object', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.locator('a').filter({ hasText: overlayPlotName }).click();
    // TODO: Flesh Out Assertions against created Objects
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(overlayPlotName);
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Plot Series Items').getByLabel('Expand').click();

    // TODO: Modify the Overlay Plot to use fixed Scaling
    // TODO: Verify Autoscaling.

    // TODO: Fix accessibility of Plot Series Properties tables
    // Assert that the Plot Series properties have the correct values
    await expect(
      page.locator('[role=cell]:has-text("Value")~[role=cell]:has-text("sin")')
    ).toBeVisible();
    await expect(
      page.locator(
        '[role=cell]:has-text("Line Method")~[role=cell]:has-text("Linear interpolation")'
      )
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Markers")~[role=cell]:has-text("Point: 2px")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Alarm Markers")~[role=cell]:has-text("Enabled")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Limit Lines")~[role=cell]:has-text("Disabled")')
    ).toBeVisible();
  });
});

test.describe('Validate Overlay Plot with 5s Delay Telemetry Object @localStorage @generatedata', () => {
  test.use({
    storageState: fileURLToPath(
      new URL('../../../e2e/test-data/overlay_plot_with_delay_storage.json', import.meta.url)
    )
  });
  test('Validate Overlay Plot with Telemetry Object', async ({ page }) => {
    const plotName = 'Overlay Plot with 5s Delay';
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.locator('a').filter({ hasText: plotName }).click();
    // TODO: Flesh Out Assertions against created Objects
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(plotName);
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Plot Series Items').getByLabel('Expand').click();

    // TODO: Modify the Overlay Plot to use fixed Scaling
    // TODO: Verify Autoscaling.

    // TODO: Fix accessibility of Plot Series Properties tables
    // Assert that the Plot Series properties have the correct values
    await expect(
      page.locator('[role=cell]:has-text("Value")~[role=cell]:has-text("sin")')
    ).toBeVisible();
    await expect(
      page.locator(
        '[role=cell]:has-text("Line Method")~[role=cell]:has-text("Linear interpolation")'
      )
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Markers")~[role=cell]:has-text("Point: 2px")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Alarm Markers")~[role=cell]:has-text("Enabled")')
    ).toBeVisible();
    await expect(
      page.locator('[role=cell]:has-text("Limit Lines")~[role=cell]:has-text("Disabled")')
    ).toBeVisible();
  });
});
