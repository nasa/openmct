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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

import { createDomainObjectWithDefaults, waitForPlotsToRender } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Stacked Plot', () => {
  let stackedPlot;
  let swgA;
  let swgB;
  let swgC;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    stackedPlot = await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'Stacked Plot'
    });

    swgA = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator A',
      parent: stackedPlot.uuid
    });
    swgB = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator B',
      parent: stackedPlot.uuid
    });
    swgC = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator C',
      parent: stackedPlot.uuid
    });
  });

  test('Using the remove action removes the correct plot', async ({ page }) => {
    const swgAElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgA.name });
    const swgBElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgB.name });
    const swgCElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgC.name });

    await page.goto(stackedPlot.url);

    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Elements' }).click();

    await swgBElementsPoolItem.click({ button: 'right' });
    await page
      .getByRole('menuitem')
      .filter({ hasText: /Remove/ })
      .click();
    await page.getByRole('button').filter({ hasText: 'Ok' }).click();

    await expect(page.locator('#inspector-elements-tree .js-elements-pool__item')).toHaveCount(2);

    // Confirm that the elements pool contains the items we expect
    await expect(swgAElementsPoolItem).toHaveCount(1);
    await expect(swgBElementsPoolItem).toHaveCount(0);
    await expect(swgCElementsPoolItem).toHaveCount(1);
  });

  test('Can reorder Stacked Plot items', async ({ page }) => {
    const swgAElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgA.name });
    const swgBElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgB.name });
    const swgCElementsPoolItem = page
      .locator('#inspector-elements-tree')
      .locator('.c-object-label', { hasText: swgC.name });

    await page.goto(stackedPlot.url);

    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Elements' }).click();

    const stackedPlotItem1 = page.locator('.c-plot--stacked-container').nth(0);
    const stackedPlotItem2 = page.locator('.c-plot--stacked-container').nth(1);
    const stackedPlotItem3 = page.locator('.c-plot--stacked-container').nth(2);

    // assert initial plot order - [swgA, swgB, swgC]
    await expect(stackedPlotItem1).toHaveAttribute('aria-label', `Stacked Plot Item ${swgA.name}`);
    await expect(stackedPlotItem2).toHaveAttribute('aria-label', `Stacked Plot Item ${swgB.name}`);
    await expect(stackedPlotItem3).toHaveAttribute('aria-label', `Stacked Plot Item ${swgC.name}`);

    // Drag and drop to reorder - [swgB, swgA, swgC]
    await swgBElementsPoolItem.dragTo(swgAElementsPoolItem);

    // assert plot order after reorder - [swgB, swgA, swgC]
    await expect(stackedPlotItem1).toHaveAttribute('aria-label', `Stacked Plot Item ${swgB.name}`);
    await expect(stackedPlotItem2).toHaveAttribute('aria-label', `Stacked Plot Item ${swgA.name}`);
    await expect(stackedPlotItem3).toHaveAttribute('aria-label', `Stacked Plot Item ${swgC.name}`);

    // Drag and drop to reorder - [swgB, swgC, swgA]
    await swgCElementsPoolItem.dragTo(swgAElementsPoolItem);

    // assert plot order after second reorder - [swgB, swgC, swgA]
    await expect(stackedPlotItem1).toHaveAttribute('aria-label', `Stacked Plot Item ${swgB.name}`);
    await expect(stackedPlotItem2).toHaveAttribute('aria-label', `Stacked Plot Item ${swgC.name}`);
    await expect(stackedPlotItem3).toHaveAttribute('aria-label', `Stacked Plot Item ${swgA.name}`);

    // collapse inspector
    await page.locator('.l-shell__pane-inspector .l-pane__collapse-button').click();

    // Save (exit edit mode)
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // assert plot order persists after save - [swgB, swgC, swgA]
    await expect(stackedPlotItem1).toHaveAttribute('aria-label', `Stacked Plot Item ${swgB.name}`);
    await expect(stackedPlotItem2).toHaveAttribute('aria-label', `Stacked Plot Item ${swgC.name}`);
    await expect(stackedPlotItem3).toHaveAttribute('aria-label', `Stacked Plot Item ${swgA.name}`);
  });

  test('Selecting a child plot while in browse and edit modes shows its properties in the inspector', async ({
    page
  }) => {
    await page.goto(stackedPlot.url);

    await page.getByRole('tab', { name: 'Config' }).click();

    // Click on the 1st plot
    await page
      .getByLabel('Stacked Plot Item Sine Wave Generator A')
      .getByLabel('Plot Canvas')
      .click();

    // Assert that the inspector shows the Y Axis properties for swgA
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator A', { exact: true })
    ).toBeVisible();

    // Click on the 2nd plot
    await page
      .getByLabel('Stacked Plot Item Sine Wave Generator B')
      .getByLabel('Plot Canvas')
      .click();
    // Assert that the inspector shows the Y Axis properties for swgB
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator B', { exact: true })
    ).toBeVisible();

    // Click on the 3rd plot
    await page
      .getByLabel('Stacked Plot Item Sine Wave Generator C')
      .getByLabel('Plot Canvas')
      .click();
    // Assert that the inspector shows the Y Axis properties for swgB
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator C', { exact: true })
    ).toBeVisible();

    // Go into edit mode
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Config' }).click();

    // Click on the 1st plot
    await page.getByLabel('Stacked Plot Item Sine Wave Generator A').click();

    // Assert that the inspector shows the Y Axis properties for swgA
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator A', { exact: true })
    ).toBeVisible();

    // Click on the 2nd plot
    await page.getByLabel('Stacked Plot Item Sine Wave Generator B').click();

    // Assert that the inspector shows the Y Axis properties for swgB
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator B', { exact: true })
    ).toBeVisible();

    // Click on the 3rd plot
    await page.getByLabel('Stacked Plot Item Sine Wave Generator C').click();

    // Assert that the inspector shows the Y Axis properties for swgC
    await expect(page.getByRole('heading', { name: 'Plot Series' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Y Axis' })).toBeVisible();
    await expect(
      page.getByLabel('Inspector Views').getByText('Sine Wave Generator C', { exact: true })
    ).toBeVisible();
  });

  test('Changing properties of an immutable child plot are applied correctly', async ({ page }) => {
    await page.goto(stackedPlot.url);

    // Go into edit mode
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Config' }).click();

    // Click on canvas for the 1st plot
    await page.getByLabel(`Stacked Plot Item ${swgA.name}`).click();

    // Expand config for the series
    await page.getByLabel('Expand Sine Wave Generator A Plot Series Options').click();

    // turn off alarm markers
    await page.getByLabel('Alarm Markers').uncheck();

    // save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // reload page and waitForPlotsToRender
    await page.reload();
    await waitForPlotsToRender(page);

    // Click on canvas for the 1st plot
    await page.getByLabel(`Stacked Plot Item ${swgA.name}`).click();

    // Expand config for the series
    await page.getByLabel('Expand Sine Wave Generator A Plot Series Options').click();

    // Assert that alarm markers are still turned off
    await expect(
      page
        .getByTitle('Display markers visually denoting points in alarm.')
        .getByRole('cell', { name: 'Disabled' })
    ).toBeVisible();
  });

  test('the legend toggles between aggregate and per child', async ({ page }) => {
    await page.goto(stackedPlot.url);

    await waitForPlotsToRender(page);

    // Go into edit mode
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Config' }).click();

    const legendProperties = page.getByLabel('Legend Properties');
    await legendProperties.locator('[title="Display legends per sub plot."]~div input').uncheck();

    await assertAggregateLegendIsVisible(page);

    // Save (exit edit mode)
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await waitForPlotsToRender(page);

    await assertAggregateLegendIsVisible(page);

    await page.reload();

    await waitForPlotsToRender(page);

    await assertAggregateLegendIsVisible(page);
  });

  test('can toggle between aggregate and per child legends', async ({ page }) => {
    // make some an overlay plot
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      parent: stackedPlot.uuid
    });

    // make some SWGs for the overlay plot
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: overlayPlot.uuid
    });

    await page.goto(stackedPlot.url);
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Inspector Views').getByRole('checkbox').uncheck();
    await page.getByLabel('Expand By Default').check();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await expect(page.getByLabel('Plot Legend Expanded')).toHaveCount(1);
    await expect(page.getByLabel('Plot Legend Item')).toHaveCount(5);

    // reload and ensure the legend is still expanded
    await page.reload();
    await expect(page.getByLabel('Plot Legend Expanded')).toHaveCount(1);
    await expect(page.getByLabel('Plot Legend Item')).toHaveCount(5);

    // change to collapsed by default
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Expand By Default').uncheck();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await expect(page.getByLabel('Plot Legend Collapsed')).toHaveCount(1);
    await expect(page.getByLabel('Plot Legend Item')).toHaveCount(5);

    // change it to individual legends
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Show Legends For Children').check();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await expect(page.getByLabel('Plot Legend Collapsed')).toHaveCount(4);
    await expect(page.getByLabel('Plot Legend Item')).toHaveCount(5);
  });
});

/**
 * Asserts that aggregate stacked plot legend is visible
 * @param {import('@playwright/test').Page} page
 */
async function assertAggregateLegendIsVisible(page) {
  // Wait for plot series data to load
  await waitForPlotsToRender(page);
  // Wait for plot legend to be shown
  await expect(page.locator('.js-stacked-plot-legend')).toBeVisible();
  // There should be 3 legend items
  await expect(
    page.locator('.js-stacked-plot-legend .c-plot-legend__wrapper div.plot-legend-item')
  ).toHaveCount(3);
}
