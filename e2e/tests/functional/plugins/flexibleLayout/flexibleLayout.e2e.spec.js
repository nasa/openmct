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

const { test, expect } = require('../../../../pluginFixtures');
const {
  createDomainObjectWithDefaults,
  setIndependentTimeConductorBounds
} = require('../../../../appActions');

test.describe('Flexible Layout', () => {
  let sineWaveObject;
  let clockObject;
  let treePane;
  let sineWaveGeneratorTreeItem;
  let clockTreeItem;
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Sine Wave Generator
    sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    // Create Clock Object
    clockObject = await createDomainObjectWithDefaults(page, {
      type: 'Clock'
    });

    // Create a Flexible Layout
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout'
    });

    // Define the Sine Wave Generator and Clock tree items
    treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    clockTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(clockObject.name)
    });
  });
  test('panes have the appropriate draggable attribute while in Edit and Browse modes', async ({
    page
  }) => {
    await page.goto(flexibleLayout.url);
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').first().click();
    // Add the Sine Wave Generator and Clock to the Flexible Layout
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-fl__container.is-empty').first());
    await clockTreeItem.dragTo(page.locator('.c-fl__container.is-empty'));
    // Check that panes can be dragged while Flexible Layout is in Edit mode
    let dragWrapper = page
      .locator('.c-fl-container__frames-holder .c-fl-frame__drag-wrapper')
      .first();
    await expect(dragWrapper).toHaveAttribute('draggable', 'true');
    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();
    // Check that panes are not draggable while Flexible Layout is in Browse mode
    dragWrapper = page.locator('.c-fl-container__frames-holder .c-fl-frame__drag-wrapper').first();
    await expect(dragWrapper).toHaveAttribute('draggable', 'false');
  });
  test('changing toolbar settings in edit mode is immediately reflected and persists upon save', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6942'
    });

    await page.goto(flexibleLayout.url);

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').first().click();
    // Add the Sine Wave Generator and Clock to the Flexible Layout
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-fl__container.is-empty').first());
    await clockTreeItem.dragTo(page.locator('.c-fl__container.is-empty'));

    // Click on the first frame to select it
    await page.locator('.c-fl-container__frame').first().click();
    await expect(page.locator('.c-fl-container__frame > .c-frame').first()).toHaveAttribute(
      's-selected',
      ''
    );

    // Assert the toolbar is visible
    await expect(page.locator('.c-toolbar')).toBeInViewport();

    // Assert the layout is in columns orientation
    expect(await page.locator('.c-fl--rows').count()).toEqual(0);

    // Change the layout to rows orientation
    await page.getByTitle('Columns layout').click();

    // Assert the layout is in rows orientation
    expect(await page.locator('.c-fl--rows').count()).toBeGreaterThan(0);

    // Assert the frame of the first item is visible
    await expect(page.locator('.c-so-view').first()).not.toHaveClass(/c-so-view--no-frame/);

    // Hide the frame of the first item
    await page.getByTitle('Frame visible').click();

    // Assert the frame is hidden
    await expect(page.locator('.c-so-view').first()).toHaveClass(/c-so-view--no-frame/);

    // Assert there are 2 containers
    expect(await page.locator('.c-fl-container').count()).toEqual(2);

    // Add a container
    await page.getByTitle('Add Container').click();

    // Assert there are 3 containers
    expect(await page.locator('.c-fl-container').count()).toEqual(3);

    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Nav away and back
    await page.goto(sineWaveObject.url);
    await page.goto(flexibleLayout.url);

    // Wait for the first frame to be visible so we know the layout has loaded
    await expect(page.locator('.c-fl-container').nth(0)).toBeInViewport();

    // Assert the settings have persisted
    expect(await page.locator('.c-fl-container').count()).toEqual(3);
    expect(await page.locator('.c-fl--rows').count()).toBeGreaterThan(0);
    await expect(page.locator('.c-so-view').first()).toHaveClass(/c-so-view--no-frame/);
  });
  test('items in a flexible layout can be removed with object tree context menu when viewing the flexible layout', async ({
    page
  }) => {
    await page.goto(flexibleLayout.url);
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').first().click();
    // Add the Sine Wave Generator to the Flexible Layout and save changes
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-fl__container.is-empty').first());
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    expect.soft(await page.locator('.c-fl-container__frame').count()).toEqual(1);

    // Expand the Flexible Layout so we can remove the sine wave generator
    await page.locator('.c-tree__item.is-navigated-object .c-disclosure-triangle').click();

    // Bring up context menu and remove
    await sineWaveGeneratorTreeItem.first().click({ button: 'right' });
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();
    await page.locator('button:has-text("OK")').click();

    // Verify that the item has been removed from the layout
    expect(await page.locator('.c-fl-container__frame').count()).toEqual(0);
  });
  test('items in a flexible layout can be removed with object tree context menu when viewing another item', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/3117'
    });
    await page.goto(flexibleLayout.url);
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    // Add the Sine Wave Generator to the Flexible Layout and save changes
    await sineWaveGeneratorTreeItem.dragTo(page.locator('.c-fl__container.is-empty').first());
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    expect.soft(await page.locator('.c-fl-container__frame').count()).toEqual(1);

    // Expand the Flexible Layout so we can remove the sine wave generator
    await page.locator('.c-tree__item.is-navigated-object .c-disclosure-triangle').click();

    // Go to the original Sine Wave Generator to navigate away from the Flexible Layout
    await page.goto(sineWaveObject.url);

    // Bring up context menu and remove
    await sineWaveGeneratorTreeItem.first().click({ button: 'right' });
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();
    await page.locator('button:has-text("OK")').click();

    // navigate back to the display layout to confirm it has been removed
    await page.goto(flexibleLayout.url);

    // Verify that the item has been removed from the layout
    expect(await page.locator('.c-fl-container__frame').count()).toEqual(0);
  });

  test('independent time works with flexible layouts and its children', async ({ page }) => {
    // Create Example Imagery
    const exampleImageryObject = await createDomainObjectWithDefaults(page, {
      type: 'Example Imagery'
    });

    await page.goto(flexibleLayout.url);
    // Edit Flexible Layout
    await page.locator('[title="Edit"]').click();

    // Expand the 'My Items' folder in the left tree
    await page.locator('.c-tree__item__view-control.c-disclosure-triangle').click();
    const exampleImageryTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(exampleImageryObject.name)
    });
    // Add the Sine Wave Generator to the Flexible Layout and save changes
    await exampleImageryTreeItem.dragTo(page.locator('.c-fl__container.is-empty').first());

    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // flip on independent time conductor
    await setIndependentTimeConductorBounds(
      page,
      '2021-12-30 01:01:00.000Z',
      '2021-12-30 01:11:00.000Z'
    );

    // check image date
    await expect(page.getByText('2021-12-30 01:11:00.000Z').first()).toBeVisible();

    // flip it off
    await page.getByRole('switch').click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();
  });
});
