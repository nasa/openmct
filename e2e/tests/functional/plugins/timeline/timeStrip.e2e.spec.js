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
import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

const MIN_CONTAINER_SIZE = 5;
const SWIM_LANE_DEFAULT_WIDTH = 200;

// Helper function to get container sizes
async function getContainerSizes(page) {
  const containers = page.locator('.timeline-container');
  const sizes = await containers.evaluateAll((elements) =>
    elements.map((el) => parseFloat(window.getComputedStyle(el).flexGrow))
  );
  return sizes;
}

// Helper function to get container heights
async function getContainerHeights(page) {
  const containers = page.locator('.timeline-container');
  const heights = await containers.evaluateAll((elements) => elements.map((el) => el.offsetHeight));
  return heights;
}

test.describe('Timeline Swim Lane Configuration', () => {
  /** @type {import('@playwright/test').Locator} */
  let timeStrip;
  let timeStripContentHolder;
  let timeAxis;
  let swimLanes;
  let swimLaneLabels;
  let showItemInTreeButton;
  let editButton;
  let treePane;
  // TODO: why the extra pixel?
  const fudge = 1;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    timeStrip = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip',
      name: 'Time Strip'
    });

    // Create Swim Lanes
    for (let i = 0; i <= 4; i++) {
      await createDomainObjectWithDefaults(page, {
        type: 'Overlay Plot',
        name: `Swim Lane ${i}`
      });
    }

    await page.goto(timeStrip.url);
    timeAxis = page.getByLabel('Time Axis');
    timeStripContentHolder = page.getByLabel('Time Strip');
    swimLanes = timeStripContentHolder.locator('.c-timeline__content');
    swimLaneLabels = swimLanes.locator('.c-swimlane__lane-label');
    showItemInTreeButton = page.getByLabel('Show selected item in tree');
    editButton = page.getByRole('button', { name: 'Edit Object', exact: true });
    treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
  });

  test('allows for swim lane label widths to be configured', async ({ page }) => {
    // Edit the Time Strip
    await editButton.click();
    // Expand the 'My Items' folder in the left tree
    await showItemInTreeButton.click();
    // Add objects to the Time Strip
    for (let i = 0; i <= 4; i++) {
      const overlayPlotTreeItem = treePane.getByRole('treeitem', {
        name: `Swim Lane ${i}`
      });
      await overlayPlotTreeItem.dragTo(timeAxis);
    }

    const labelCount = await swimLaneLabels.count();
    await expect(labelCount).toBe(5);

    await test.step(`swim lane label widths default to ${SWIM_LANE_DEFAULT_WIDTH}px`, async () => {
      // Verify the swim lane label widths are identical
      for (let i = 0; i < labelCount; i++) {
        await expect((await swimLaneLabels.nth(i).boundingBox()).width).toBe(
          SWIM_LANE_DEFAULT_WIDTH + fudge
        );
      }
      // The Time Axis is also a swim lane and should have an identical label width
      await expect((await timeAxis.locator('.c-swimlane__lane-label').boundingBox()).width).toBe(
        SWIM_LANE_DEFAULT_WIDTH + fudge
      );
    });

    await test.step('using drag and drop to resize', async () => {
      let widthAfterDragRight;
      let widthAfterDragLeft;
      const dragDistance = 50;
      const swimLaneLabelWidthHandle = page.locator('.c-swimlane__handle');
      const box = await swimLaneLabelWidthHandle.first().boundingBox();
      await swimLaneLabelWidthHandle.first().hover();
      await page.mouse.down();
      await page.mouse.move(box.x + dragDistance, box.y);
      await page.mouse.up();
      widthAfterDragRight = (await swimLaneLabels.nth(0).boundingBox()).width;

      // Verify the swim lane label widths are identical and updated
      for (let i = 0; i < labelCount; i++) {
        const currentWidth = (await swimLaneLabels.nth(i).boundingBox()).width;

        await expect(currentWidth).toBe(widthAfterDragRight);
        await expect(currentWidth).toBeGreaterThan(SWIM_LANE_DEFAULT_WIDTH + fudge);

        widthAfterDragRight = currentWidth;
      }

      // The Time Axis is also a swim lane and should have an identical label width
      await expect((await timeAxis.locator('.c-swimlane__lane-label').boundingBox()).width).toBe(
        widthAfterDragRight
      );

      const bigBox = await swimLaneLabelWidthHandle.first().boundingBox();
      await swimLaneLabelWidthHandle.first().hover();
      await page.mouse.down();
      await page.mouse.move(bigBox.x - dragDistance / 2, bigBox.y);
      await page.mouse.up();

      widthAfterDragLeft = (await swimLaneLabels.nth(0).boundingBox()).width;

      // Verify the swim lane widths are identical and updated
      for (let i = 0; i < labelCount; i++) {
        const currentWidth = (await swimLaneLabels.nth(i).boundingBox()).width;

        await expect(currentWidth).toBe(widthAfterDragLeft);
        await expect(currentWidth).toBeGreaterThan(SWIM_LANE_DEFAULT_WIDTH + fudge);
        await expect(currentWidth).toBeLessThan(widthAfterDragRight);

        widthAfterDragLeft = currentWidth;
      }

      // The Time Axis is also a swim lane and should have an identical label width
      await expect((await timeAxis.locator('.c-swimlane__lane-label').boundingBox()).width).toBe(
        widthAfterDragLeft
      );
    });

    await test.step('using input entry in inspector Elements tab to resize', async () => {
      const size = 100;
      // Click the Elements tag in the Inspector
      await page.getByRole('tab', { name: 'Elements' }).click();

      const input = page.getByLabel('Swim Lane Label Width').locator('input[type="number"]');
      await input.fill(`${size}`);
      await input.blur();

      // Verify the swim lane label widths are identical and updated
      for (let i = 0; i < (await swimLaneLabels.count()); i++) {
        await expect((await swimLaneLabels.nth(i).boundingBox()).width).toBe(size + fudge);
      }

      // The Time Axis is also a swim lane and should have an identical label width
      await expect((await timeAxis.locator('.c-swimlane__lane-label').boundingBox()).width).toBe(
        size + fudge
      );
    });
  });
});
