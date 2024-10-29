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

import { waitForPlotsToRender } from '../appActions.js';
import { expect } from '../pluginFixtures.js';

/**
 * Given a canvas and a set of points, tags the points on the canvas.
 * @param {import('@playwright/test').Page} page
 * @param {HTMLCanvasElement} canvas a telemetry item with a plot
 * @param {number} xEnd a telemetry item with a plot
 * @param {number} yEnd a telemetry item with a plot
 * @returns {Promise}
 */
export async function createTags({ page, canvas, xEnd = 700, yEnd = 520 }) {
  await canvas.hover({ trial: true });

  //Alt+Shift Drag Start to select some points to tag
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');

  await canvas.dragTo(canvas, {
    sourcePosition: {
      x: 1,
      y: 1
    },
    targetPosition: {
      x: xEnd,
      y: yEnd
    }
  });

  //Alt Drag End
  await page.keyboard.up('Alt');
  await page.keyboard.up('Shift');

  //Wait for canvas to stabilize.
  await canvas.hover({ trial: true });

  // add some tags
  await page.getByText('Annotations').click();
  await page.getByRole('button', { name: /Add Tag/ }).click();
  await page.getByPlaceholder('Type to select tag').click();
  await page.getByText('Driving').click();

  await page.getByRole('button', { name: /Add Tag/ }).click();
  await page.getByPlaceholder('Type to select tag').click();
  await page.getByText('Science').click();
}

/**
 * Given a telemetry item (e.g., a Sine Wave Generator) with a plot, tests that the plot can be tagged.
 * @param {import('@playwright/test').Page} page
 * @param {import('../../../../appActions').CreatedObjectInfo} telemetryItem a telemetry item with a plot
 * @returns {Promise}
 */
export async function testTelemetryItem(page, telemetryItem) {
  // Check that telemetry item also received the tag
  await page.goto(telemetryItem.url);

  await expect(page.getByText('No tags to display for this item')).toBeVisible();

  const canvas = page.locator('canvas').nth(1);
  //Wait for canvas to stabilize.
  await waitForPlotsToRender(page);

  await expect(canvas).toBeInViewport();
  await canvas.hover({ trial: true });

  // click on the tagged plot point
  await canvas.click({
    position: {
      x: 100,
      y: 100
    }
  });

  await expect(page.getByText('Science')).toBeVisible();
  await expect(page.getByText('Driving')).toBeHidden();
}

/**
 * Given a page, tests that tags are searchable, deletable, and persist across reloads.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise}
 */
export async function basicTagsTests(page) {
  // Search for Driving
  await page.getByRole('searchbox', { name: 'Search Input' }).click();

  // Clicking elsewhere should cause annotation selection to be cleared
  await expect(page.getByText('No tags to display for this item')).toBeVisible();
  //
  await page.getByRole('searchbox', { name: 'Search Input' }).fill('driv');

  // Always click on the first Sine Wave result
  await page
    .getByLabel('Search Result')
    .getByText(/Sine Wave/)
    .first()
    .click();

  // Delete Driving Tag
  await page.hover('[aria-label="Tag"]:has-text("Driving")');
  await page.locator('[aria-label="Remove tag Driving"]').click();

  // Search for Science Tag
  await page.getByRole('searchbox', { name: 'Search Input' }).click();
  await page.getByRole('searchbox', { name: 'Search Input' }).fill('sc');

  //Expect Science Tag to be present and and Driving Tags to be deleted
  await expect(page.getByLabel('Search Result').first()).toContainText('Science');
  await expect(page.getByLabel('Search Result').first()).not.toContainText('Driving');

  // Search for Driving Tag and expect nothing found
  await page.getByRole('searchbox', { name: 'Search Input' }).click();
  await page.getByRole('searchbox', { name: 'Search Input' }).fill('driv');
  await expect(page.getByText('No results found')).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });

  await waitForPlotsToRender(page);

  //Navigate to the Inspector and check that all tags have been removed
  await expect(page.getByRole('tab', { name: 'Annotations' })).not.toHaveClass(/is-current/);
  await page.getByRole('tab', { name: 'Annotations' }).click();
  await expect(page.getByRole('tab', { name: 'Annotations' })).toHaveClass(/is-current/);
  await expect(page.getByText('No tags to display for this item')).toBeVisible();

  const canvas = page.locator('canvas').nth(1);
  // click on the tagged plot point
  await canvas.click({
    position: {
      x: 100,
      y: 100
    }
  });

  //Expect Science to be visible but Driving to be hidden
  await expect(page.getByText('Science')).toBeVisible();
  await expect(page.getByText('Driving')).toBeHidden();

  //Click elsewhere
  await page.locator('body').click();
  //Click on tagged plot point again
  await canvas.click({
    position: {
      x: 100,
      y: 100
    }
  });

  // Add Driving Tag again
  await page.getByText('Annotations').click();
  await page.getByRole('button', { name: /Add Tag/ }).click();
  await page.getByPlaceholder('Type to select tag').click();
  await page.getByText('Driving').click();

  //Science and Driving Tags should be visible
  await expect(page.getByText('Science')).toBeVisible();
  await expect(page.getByText('Driving')).toBeVisible();

  // Delete Driving Tag again
  await page.hover('[aria-label="Tag"]:has-text("Driving")');
  await page.locator('[aria-label="Remove tag Driving"]').click();

  //Science Tag should be visible and Driving Tag should be hidden
  await expect(page.getByText('Science')).toBeVisible();
  await expect(page.getByText('Driving')).toBeHidden();
}
