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
import fs from 'fs';

import {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject,
  createNotification,
  createPlanFromJSON,
  expandEntireTree,
  getCanvasPixels,
  navigateToObjectWithFixedTimeBounds,
  navigateToObjectWithRealTime,
  setEndOffset,
  setFixedIndependentTimeConductorBounds,
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset,
  setTimeConductorBounds,
  waitForPlotsToRender
} from '../../appActions.js';
import { assertPlanActivities, setBoundsToSpanAllActivities } from '../../helper/planningUtils.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('AppActions @framework', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('createDomainObjectsWithDefaults', async ({ page }) => {
    const e2eFolder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'e2e folder'
    });

    await test.step('Create multiple flat objects in a row', async () => {
      const timer1 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Foo',
        parent: e2eFolder.uuid
      });
      const timer2 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Bar',
        parent: e2eFolder.uuid
      });
      const timer3 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Baz',
        parent: e2eFolder.uuid
      });

      await page.goto(timer1.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer1.name);
      await page.goto(timer2.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer2.name);
      await page.goto(timer3.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer3.name);
    });

    await test.step('Create multiple nested objects in a row', async () => {
      const folder1 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Foo',
        parent: e2eFolder.uuid
      });
      const folder2 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Bar',
        parent: folder1.uuid
      });
      const folder3 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Baz',
        parent: folder2.uuid
      });
      await page.goto(folder1.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder1.name);
      await page.goto(folder2.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder2.name);
      await page.goto(folder3.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder3.name);

      expect(folder1.url).toBe(`${e2eFolder.url}/${folder1.uuid}`);
      expect(folder2.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}`);
      expect(folder3.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}/${folder3.uuid}`);
    });
  });
  test('createExampleTelemetryObject', async ({ page }) => {
    const gauge = await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Gauge with no data'
    });

    const swgWithParent = await createExampleTelemetryObject(page, gauge.uuid);

    await page.goto(swgWithParent.url);
    await expect(page.locator('.l-browse-bar__object-name')).toHaveText(swgWithParent.name);
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();

    // Check Default values of created object
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('VIPER Rover Heading');
    await expect(page.getByRole('spinbutton', { name: 'Period' })).toHaveValue('10');
    await expect(page.getByRole('spinbutton', { name: 'Amplitude' })).toHaveValue('1');
    await expect(page.getByRole('spinbutton', { name: 'Offset' })).toHaveValue('0');
    await expect(page.getByRole('spinbutton', { name: 'Data Rate (hz)' })).toHaveValue('1');
    await expect(page.getByRole('spinbutton', { name: 'Phase (radians)' })).toHaveValue('0');
    await expect(page.getByRole('spinbutton', { name: 'Randomness' })).toHaveValue('0');
    await expect(page.getByRole('spinbutton', { name: 'Loading Delay (ms)' })).toHaveValue('0');

    await page.getByLabel('Cancel').click();

    const swgWithoutParent = await createExampleTelemetryObject(page);

    await page.getByLabel('Show selected item in tree').click();

    expect(swgWithParent.url).toBe(`${gauge.url}/${swgWithParent.uuid}`);
    expect(swgWithoutParent.url).toBe(`./#/browse/mine/${swgWithoutParent.uuid}`);
  });
  test('createNotification', async ({ page }) => {
    await createNotification(page, {
      message: 'Test info notification',
      severity: 'info'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test info notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/info/);
    await page.locator('[aria-label="Dismiss"]').click();
    await createNotification(page, {
      message: 'Test alert notification',
      severity: 'alert'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test alert notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/alert/);
    await page.locator('[aria-label="Dismiss"]').click();
    await createNotification(page, {
      message: 'Test error notification',
      severity: 'error'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test error notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/error/);
    await page.locator('[aria-label="Dismiss"]').click();
  });
  test('createPlanFromJSON', async ({ page }) => {
    const examplePlanSmall1 = JSON.parse(
      fs.readFileSync(
        new URL('../../test-data/examplePlans/ExamplePlan_Small1.json', import.meta.url)
      )
    );
    const plan = await createPlanFromJSON(page, {
      name: 'Test Plan',
      json: examplePlanSmall1
    });
    await setBoundsToSpanAllActivities(page, examplePlanSmall1, plan.url);
    await assertPlanActivities(page, examplePlanSmall1, plan.url);
  });
  test('expandEntireTree', async ({ page }) => {
    const rootFolder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });
    const folder1 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: rootFolder.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      parent: folder1.uuid
    });
    const folder2 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder1.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder1.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      parent: folder2.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder2.uuid
    });

    await page.goto('./#/browse/mine');
    await expandEntireTree(page);
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const treePaneCollapsedItems = treePane.getByRole('treeitem', { expanded: false });
    await expect(treePaneCollapsedItems).toHaveCount(0);

    await page.goto('./#/browse/mine');
    //Click the Create button
    await page.getByRole('button', { name: 'Create' }).click();

    // Click the object specified by 'type'
    await page.getByRole('menuitem', { name: 'Clock' }).click();
    await expandEntireTree(page, 'Create Modal Tree');
    const locatorTree = page.getByRole('tree', {
      name: 'Create Modal Tree'
    });
    const locatorTreeCollapsedItems = locatorTree.locator('role=treeitem[expanded=false]');
    await expect(locatorTreeCollapsedItems).toHaveCount(0);
  });
  test('getCanvasPixels', async ({ page }) => {
    let overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    await createExampleTelemetryObject(page, overlayPlot.uuid);

    await page.goto(overlayPlot.url);
    //Get pixel data from Canvas
    const plotPixels = await getCanvasPixels(page, 'canvas');
    const plotPixelSize = plotPixels.length;
    expect(plotPixelSize).toBeGreaterThan(0);
  });
  test('navigateToObjectWithFixedTimeBounds', async ({ page }) => {
    const exampleTelemetry = await createExampleTelemetryObject(page);
    //Navigate without explicit bounds
    await navigateToObjectWithFixedTimeBounds(page, exampleTelemetry.url);
    await expect(page.getByLabel('Start bounds:')).toBeVisible();
    await expect(page.getByLabel('End bounds:')).toBeVisible();
    //Navigate with explicit bounds
    await navigateToObjectWithFixedTimeBounds(
      page,
      exampleTelemetry.url,
      1693592063607,
      1693593893607
    );
    await expect(page.getByLabel('Start bounds: 2023-09-01 18:')).toBeVisible();
    await expect(page.getByLabel('End bounds: 2023-09-01 18:44:')).toBeVisible();
  });
  test('navigateToObjectWithRealTime', async ({ page }) => {
    const exampleTelemetry = await createExampleTelemetryObject(page);
    //Navigate without explicit bounds
    await navigateToObjectWithRealTime(page, exampleTelemetry.url);
    await expect(page.getByLabel('Start offset:')).toBeVisible();
    await expect(page.getByLabel('End offset: 00:00:')).toBeVisible();
    //Navigate with explicit bounds
    await navigateToObjectWithRealTime(page, exampleTelemetry.url, 1693592063607, 1693593893607);
    await expect(page.getByLabel('Start offset: 18:14:')).toBeVisible();
    await expect(page.getByLabel('End offset: 18:44:')).toBeVisible();
  });
  test('setTimeConductorMode', async ({ page }) => {
    await test.step('setFixedTimeMode', async () => {
      await setFixedTimeMode(page);
      await expect(page.getByLabel('Start bounds:')).toBeVisible();
      await expect(page.getByLabel('End bounds:')).toBeVisible();
    });
    await test.step('setTimeConductorBounds', async () => {
      await setTimeConductorBounds(page, {
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        startTime: '00:00:00',
        endTime: '23:59:59'
      });
      await expect(page.getByLabel('Start bounds: 2024-01-01 00:00:00')).toBeVisible();
      await expect(page.getByLabel('End bounds: 2024-01-02 23:59:59')).toBeVisible();
    });
    await test.step('setRealTimeMode', async () => {
      await setRealTimeMode(page);
      await expect(page.getByLabel('Start offset')).toBeVisible();
      await expect(page.getByLabel('End offset')).toBeVisible();
    });
    await test.step('setStartOffset', async () => {
      await setStartOffset(page, {
        startHours: '04',
        startMins: '20',
        startSecs: '22'
      });
      await expect(page.getByLabel('Start offset: 04:20:22')).toBeVisible();
    });
    await test.step('setEndOffset', async () => {
      await setEndOffset(page, {
        endHours: '04',
        endMins: '20',
        endSecs: '22'
      });
      await expect(page.getByLabel('End offset: 04:20:22')).toBeVisible();
    });
  });
  test('setFixedIndependentTimeConductorBounds', async ({ page }) => {
    // Create a Display Layout
    const displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Example Imagery',
      parent: displayLayout.uuid
    });

    const startDate = '2021-12-30 01:01:00.000Z';
    const endDate = '2021-12-30 01:11:00.000Z';
    await setFixedIndependentTimeConductorBounds(page, { start: startDate, end: endDate });

    // check image date
    await expect(page.getByText('2021-12-30 01:11:00.000Z').first()).toBeVisible();

    // flip it off
    await page.getByRole('switch').click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();
  });
  test.fail('waitForPlotsToRender', async ({ page }) => {
    // Create a SWG
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });
    // Edit the SWG
    await page.getByLabel('More actions').click();
    await page.getByLabel('Edit Properties...').click();
    // Set loading delay to 10 seconds
    await page.getByLabel('Loading Delay (ms)', { exact: true }).fill('10000');
    await page.getByLabel('Save').click();
    // Reload the page
    await page.reload();
    // Expect this step to fail
    await waitForPlotsToRender(page, { timeout: 1000 });
  });
});
