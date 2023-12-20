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

/**
 * This test is dedicated to test styling of various plugins
 */

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Flexible Layout styling', () => {
  let sineWaveObject;
  let sineWaveObject2;
  let treePane;
  let sineWaveGeneratorTreeItem;
  let sineWaveGeneratorTreeItem2;
  let stackedPlotTreeItem;
  let stackedPlot;
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();

    // Create a few Sine Wave Generators
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    sineWaveObject2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    // Define the Sine Wave Generator items
    treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    sineWaveGeneratorTreeItem2 = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject2.name)
    });

    // Create a Stacked Plot
    stackedPlot = await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot'
    });

    // Add the Sine Wave Generators to the Stacked Plot
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-plot--stacked.holder'));
    await sineWaveGeneratorTreeItem2.dragTo(page.locator('.c-plot--stacked.holder'));
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    stackedPlotTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(stackedPlot.name)
    });

    // Create a Flexible Layout
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout'
    });

    // Add the Sine Wave Generators and the Stacked Plot to the Flexible Layout
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-fl__container').first());
    await sineWaveGeneratorTreeItem2.dragTo(page.locator('.c-fl__container').first());
    await stackedPlotTreeItem.dragTo(page.locator('.c-fl__container').nth(1));

    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();
  });

  test('selecting a flexible layout column hides the styles tab', async ({ page }) => {
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();
    // Expect to find a styles tab
    let stylesTab = await page.locator('.c-inspector__tab[title="Styles"]').count();
    expect(stylesTab).toBe(1);

    // Select flexible layout column
    await page.locator('.c-fl-container__header').first().click();
    // Expect to find no styles tab
    stylesTab = await page.locator('.c-inspector__tab[title="Styles"]').count();
    expect(stylesTab).toBe(0);
  });

  test('styling the flexible layout properly applies the styles to the container', async ({
    page
  }) => {
    const backgroundColor = 'rgb(91, 15, 0)';
    const fontColor = 'rgb(230, 184, 175)';
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();
    // Select styles tab
    await page.locator('.c-inspector__tab[title="Styles"]').click();
    // Set background color
    await page.locator('.c-icon-button.icon-paint-bucket').click();
    await page.locator(`.c-palette__item[style="background: ${backgroundColor};"]`).click();
    // Set font color
    await page.locator('.c-icon-button.icon-font').click();
    await page.locator(`.c-palette__item[style="background: ${fontColor};"]`).click();

    // Find Flexible Layout container
    let flexibleLayoutContainer = await page.locator('.c-fl__container-holder');
    let layoutStyles = await flexibleLayoutContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match set styles
    expect(layoutStyles.background).toBe(backgroundColor);
    expect(layoutStyles.fontColor).toBe(fontColor);

    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Reload page and check styles again
    await page.goto(flexibleLayout.url);
    flexibleLayoutContainer = await page.locator('.c-fl__container-holder');
    layoutStyles = await flexibleLayoutContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match set styles
    expect(layoutStyles.background).toBe(backgroundColor);
    expect(layoutStyles.fontColor).toBe(fontColor);
  });

  test('styling a child object of the flexible layout properly applies that style to only that child', async ({
    page
  }) => {
    const backgroundColor = 'rgb(91, 15, 0)';
    const fontColor = 'rgb(230, 184, 175)';
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();
    // Select Stacked Plot
    let stackedPlotContainer = await page.locator('.c-plot--stacked');
    // eslint-disable-next-line playwright/no-force-option
    stackedPlotContainer.click({ force: true });

    // Select styles tab
    await page.locator('.c-inspector__tab[title="Styles"]').click();
    // Set background color
    await page.locator('.c-icon-button.icon-paint-bucket').click();
    await page.locator(`.c-palette__item[style="background: ${backgroundColor};"]`).click();
    // Set font color
    await page.locator('.c-icon-button.icon-font[title="Set text color"]').click();
    await page.locator(`.c-palette__item[style="background: ${fontColor};"]`).click();

    // Get Stacked Plot styles
    let stackedPlotStyles = await stackedPlotContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match set styles
    expect(stackedPlotStyles.background).toBe(backgroundColor);
    expect(stackedPlotStyles.fontColor).toBe(fontColor);

    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Reload page and check styles again
    await page.goto(flexibleLayout.url);
    stackedPlotContainer = await page.locator('.c-plot--stacked');
    stackedPlotStyles = await stackedPlotContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match set styles
    expect(stackedPlotStyles.background).toBe(backgroundColor);
    expect(stackedPlotStyles.fontColor).toBe(fontColor);
  });

  test('When the "no style" option is selected, background and text should be reset to inherited styles', async ({
    page
  }) => {
    // Set background and font color on Stacked Plot object
    const backgroundColor = 'rgb(91, 15, 0)';
    const fontColor = 'rgb(230, 184, 175)';
    const inheritedBackgroundColor = 'rgba(0, 0, 0, 0)'; // inherited from the theme
    const inheritedFontColor = 'rgb(170, 170, 170)'; // inherited from the body style
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();
    // Select Stacked Plot
    let stackedPlotContainer = await page.locator('.c-plot--stacked');
    // eslint-disable-next-line playwright/no-force-option
    stackedPlotContainer.click({ force: true });

    // Select styles tab
    await page.locator('.c-inspector__tab[title="Styles"]').click();
    // Set background color
    await page.locator('.c-icon-button.icon-paint-bucket').click();
    await page.locator(`.c-palette__item[style="background: ${backgroundColor};"]`).click();
    // Set font color
    await page.locator('.c-icon-button.icon-font[title="Set text color"]').click();
    await page.locator(`.c-palette__item[style="background: ${fontColor};"]`).click();

    // Get Stacked Plot styles
    let stackedPlotStyles = await stackedPlotContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match set styles
    expect(stackedPlotStyles.background).toBe(backgroundColor);
    expect(stackedPlotStyles.fontColor).toBe(fontColor);

    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Reload page and set styles to "None"
    await page.goto(flexibleLayout.url);

    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();
    // Select Stacked Plot
    stackedPlotContainer = await page.locator('.c-plot--stacked');
    // eslint-disable-next-line playwright/no-force-option
    stackedPlotContainer.click({ force: true });

    // Select styles tab
    await page.locator('.c-inspector__tab[title="Styles"]').click();
    // Set background color
    await page.locator('.c-icon-button.icon-paint-bucket').click();
    await page.locator(`.c-palette__item-none`).click();
    // Set font color
    await page.locator('.c-icon-button.icon-font[title="Set text color"]').click();
    await page.locator(`.c-palette__item-none`).click();

    // Get Stacked Plot styles
    stackedPlotStyles = await stackedPlotContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match inherited styles
    expect(stackedPlotStyles.background).toBe(inheritedBackgroundColor);
    expect(stackedPlotStyles.fontColor).toBe(inheritedFontColor);

    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Reload page and check styles again after resetting styles to "None"
    await page.goto(flexibleLayout.url);

    // Select Stacked Plot
    stackedPlotContainer = await page.locator('.c-plot--stacked');

    // Get Stacked Plot styles
    stackedPlotStyles = await stackedPlotContainer.evaluate((el) => {
      return {
        background: window.getComputedStyle(el).getPropertyValue('background-color'),
        fontColor: window.getComputedStyle(el).getPropertyValue('color')
      };
    });

    // Verify styles match inherited styles
    expect(stackedPlotStyles.background).toBe(inheritedBackgroundColor);
    expect(stackedPlotStyles.fontColor).toBe(inheritedFontColor);
  });
});
