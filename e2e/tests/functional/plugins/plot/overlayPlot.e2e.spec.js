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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

const { test, expect } = require('../../../../pluginFixtures');
const {
  createDomainObjectWithDefaults,
  getCanvasPixels,
  selectInspectorTab,
  waitForPlotsToRender
} = require('../../../../appActions');

test.describe('Overlay Plot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Plot legend color is in sync with plot series color', async ({ page }) => {
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);

    await selectInspectorTab(page, 'Config');

    // navigate to plot series color palette
    await page.click('.l-browse-bar__actions__edit');
    await page.locator('li.c-tree__item.menus-to-left .c-disclosure-triangle').click();
    await page.locator('.c-click-swatch--menu').click();
    await page.locator('.c-palette__item[style="background: rgb(255, 166, 61);"]').click();
    // gets color for swatch located in legend
    const seriesColorSwatch = page.locator(
      '.gl-plot-y-label-swatch-container > .plot-series-color-swatch'
    );
    await expect(seriesColorSwatch).toHaveCSS('background-color', 'rgb(255, 166, 61)');
  });

  test('Limit lines persist when series is moved to another Y Axis and on refresh', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6338'
    });
    // Create an Overlay Plot with a default SWG
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    const swgA = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);

    // Assert that no limit lines are shown by default
    await page.waitForSelector('.js-limit-area', { state: 'attached' });
    expect(await page.locator('.c-plot-limit-line').count()).toBe(0);

    // Enter edit mode
    await page.click('button[title="Edit"]');

    // Expand the "Sine Wave Generator" plot series options and enable limit lines
    await selectInspectorTab(page, 'Config');
    await page
      .getByRole('list', { name: 'Plot Series Properties' })
      .locator('span')
      .first()
      .click();
    await page
      .getByRole('list', { name: 'Plot Series Properties' })
      .locator('[title="Display limit lines"]~div input')
      .check();

    await assertLimitLinesExistAndAreVisible(page);

    // Save (exit edit mode)
    await page.locator('button[title="Save"]').click();
    await page.locator('li[title="Save and Finish Editing"]').click();

    await assertLimitLinesExistAndAreVisible(page);

    await page.reload();

    await assertLimitLinesExistAndAreVisible(page);

    // Enter edit mode
    await page.click('button[title="Edit"]');

    await selectInspectorTab(page, 'Elements');

    // Drag Sine Wave Generator series from Y Axis 1 into Y Axis 2
    await page
      .locator(`#inspector-elements-tree >> text=${swgA.name}`)
      .dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));

    await assertLimitLinesExistAndAreVisible(page);

    // Save (exit edit mode)
    await page.locator('button[title="Save"]').click();
    await page.locator('li[title="Save and Finish Editing"]').click();

    await assertLimitLinesExistAndAreVisible(page);

    await page.reload();

    await assertLimitLinesExistAndAreVisible(page);
  });

  test('The elements pool supports dragging series into multiple y-axis buckets', async ({
    page
  }) => {
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    const swgA = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    const swgB = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    const swgC = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    const swgD = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    const swgE = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);
    await page.click('button[title="Edit"]');

    await selectInspectorTab(page, 'Elements');

    // Drag swg a, c, e into Y Axis 2
    await page
      .locator(`#inspector-elements-tree >> text=${swgA.name}`)
      .dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));
    await page
      .locator(`#inspector-elements-tree >> text=${swgC.name}`)
      .dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));
    await page
      .locator(`#inspector-elements-tree >> text=${swgE.name}`)
      .dragTo(page.locator('[aria-label="Element Item Group Y Axis 2"]'));

    // Assert that Y Axis 1 and Y Axis 2 property groups are visible only
    await selectInspectorTab(page, 'Config');

    const yAxis1PropertyGroup = page.locator('[aria-label="Y Axis Properties"]');
    const yAxis2PropertyGroup = page.locator('[aria-label="Y Axis 2 Properties"]');
    const yAxis3PropertyGroup = page.locator('[aria-label="Y Axis 3 Properties"]');

    await expect(yAxis1PropertyGroup).toBeVisible();
    await expect(yAxis2PropertyGroup).toBeVisible();
    await expect(yAxis3PropertyGroup).toBeHidden();

    const yAxis1Group = page.getByLabel('Y Axis 1');
    const yAxis2Group = page.getByLabel('Y Axis 2');
    const yAxis3Group = page.getByLabel('Y Axis 3');

    await selectInspectorTab(page, 'Elements');

    // Drag swg b into Y Axis 3
    await page
      .locator(`#inspector-elements-tree >> text=${swgB.name}`)
      .dragTo(page.locator('[aria-label="Element Item Group Y Axis 3"]'));

    // Assert that all Y Axis property groups are visible
    await selectInspectorTab(page, 'Config');

    await expect(yAxis1PropertyGroup).toBeVisible();
    await expect(yAxis2PropertyGroup).toBeVisible();
    await expect(yAxis3PropertyGroup).toBeVisible();

    // Verify that the elements are in the correct buckets and in the correct order
    await selectInspectorTab(page, 'Elements');

    expect(yAxis1Group.getByRole('listitem', { name: swgD.name })).toBeTruthy();
    expect(yAxis1Group.getByRole('listitem').nth(0).getByText(swgD.name)).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem', { name: swgE.name })).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem').nth(0).getByText(swgE.name)).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem', { name: swgC.name })).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem').nth(1).getByText(swgC.name)).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem', { name: swgA.name })).toBeTruthy();
    expect(yAxis2Group.getByRole('listitem').nth(2).getByText(swgA.name)).toBeTruthy();
    expect(yAxis3Group.getByRole('listitem', { name: swgB.name })).toBeTruthy();
    expect(yAxis3Group.getByRole('listitem').nth(0).getByText(swgB.name)).toBeTruthy();
  });

  test('Clicking on an item in the elements pool brings up the plot preview with data points', async ({
    page
  }) => {
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    const swgA = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);
    // Wait for plot series data to load and be drawn
    await waitForPlotsToRender(page);
    await page.click('button[title="Edit"]');

    await selectInspectorTab(page, 'Elements');

    await page.locator(`#inspector-elements-tree >> text=${swgA.name}`).click();

    const plotPixels = await getCanvasPixels(page, '.js-overlay canvas');
    const plotPixelSize = plotPixels.length;
    expect(plotPixelSize).toBeGreaterThan(0);
  });
});

/**
 * Asserts that limit lines exist and are visible
 * @param {import('@playwright/test').Page} page
 */
async function assertLimitLinesExistAndAreVisible(page) {
  // Wait for plot series data to load
  await waitForPlotsToRender(page);
  // Wait for limit lines to be created
  await page.waitForSelector('.js-limit-area', { state: 'attached' });
  const limitLineCount = await page.locator('.c-plot-limit-line').count();
  // There should be 10 limit lines created by default
  expect(await page.locator('.c-plot-limit-line').count()).toBe(10);
  for (let i = 0; i < limitLineCount; i++) {
    await expect(page.locator('.c-plot-limit-line').nth(i)).toBeVisible();
  }
}
