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

test.describe('Timeline Container Resizing', () => {
  /** @type {import('@playwright/test').Locator} */
  let timeStrip;
  let containers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    timeStrip = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip',
      name: 'Time Strip'
    });

    containers = [];

    for (let i = 1; i <= 5; i++) {
      const container = await createDomainObjectWithDefaults(page, {
        type: 'Overlay Plot',
        name: `Swim Lane ${i}`,
        parent: timeStrip.uuid
      });
      containers.push(container);
    }
  });

  test('default configuration', async ({ page }) => {
    let timeStripObject = await page.evaluate(async (uuid) => await window.openmct.objects.get(uuid), timeStrip.uuid);

    await test.step('default swim lane label width', async () => {
      expect(timeStripObject.configuration.swimLaneLabelWidth).toBe(200);
    });

    await test.step('will not have containers if composition modified outside of view', async () => {
      expect(timeStripObject.configuration.containers.length).not.toBe(5);
    });

    // Now go to the time strip view
    await page.goto(timeStrip.url);
    // Click the Edit button
    await page.getByRole('button', { name: 'Edit Object', exact: true }).click();

    // Click the Save button
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    
    // get the updated object
    timeStripObject = await page.evaluate(async (uuid) => await window.openmct.objects.get(uuid), timeStrip.uuid);
      
    console.log(timeStripObject);
    await test.step('will create default containers if none exist', async () => {
      expect(timeStripObject.configuration.containers.length).toBe(5);
    });
  });

  test.beforeEach(async ({ page }) => {
    // Now go to the time strip view
    await page.goto(timeStrip.url);
  });

  test('should resize containers vertically through drag and drop', async ({ page }) => {
    // Click the Edit button
    await page.getByRole('button', { name: 'Edit Object', exact: true }).click();

    // Get initial container sizes
    const initialSizes = await getContainerSizes(page);

    // Find the first container and its resizer
    const container = page.locator('.timeline-container').first();
    const resizer = container.locator('.drag-resizer');

    // Get initial height
    const initialHeight = await container.evaluate((el) => el.offsetHeight);

    // Drag down to resize
    await resizer.hover();
    await page.mouse.down();
    await page.mouse.move(0, 50); // Move down 50 pixels
    await page.mouse.up();

    // Get new height
    const newHeight = await container.evaluate((el) => el.offsetHeight);

    // Verify container resized correctly
    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  test('should maintain minimum container size during drag', async ({ page }) => {
    // Get first container
    const container = page.locator('.timeline-container').first();
    const resizer = container.locator('.drag-resizer');

    // Try to resize container below minimum size
    await resizer.hover();
    await page.mouse.down();
    await page.mouse.move(0, -100); // Move up significantly
    await page.mouse.up();

    // Get final size
    const finalSize = await container.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).flexGrow)
    );

    // Verify size is not below minimum
    expect(finalSize).toBeGreaterThan(MIN_CONTAINER_SIZE - 1);
  });

  test('should set fixed pixel height through inspector', async ({ page }) => {
    // Get first container
    const container = page.locator('.timeline-container').first();

    // Open inspector
    await page.locator('.inspector-button').click();

    // Set fixed height
    const heightInput = page.locator('.inspector .height-input');
    await heightInput.fill('200');
    await heightInput.press('Enter');

    // Verify container has fixed height
    const height = await container.evaluate((el) => el.offsetHeight);
    expect(height).toBe(200);

    // Verify container has fixed class
    await expect(container).toHaveClass(/fixed/);
  });

  test('should maintain fixed height during window resize', async ({ page }) => {
    // Set fixed height on container
    const container = page.locator('.timeline-container').first();
    await page.locator('.inspector-button').click();
    const heightInput = page.locator('.inspector .height-input');
    await heightInput.fill('200');
    await heightInput.press('Enter');

    // Get initial height
    const initialHeight = await container.evaluate((el) => el.offsetHeight);

    // Resize window
    await page.setViewportSize({ width: 1200, height: 800 });

    // Verify height remains the same
    const newHeight = await container.evaluate((el) => el.offsetHeight);
    expect(newHeight).toBe(initialHeight);
  });

  test('should toggle between fixed and flexible height', async ({ page }) => {
    // Get first container
    const container = page.locator('.timeline-container').first();

    // Set fixed height
    await page.locator('.inspector-button').click();
    const heightInput = page.locator('.inspector .height-input');
    await heightInput.fill('200');
    await heightInput.press('Enter');

    // Verify container has fixed class
    await expect(container).toHaveClass(/fixed/);

    // Remove fixed height
    await heightInput.fill('');
    await heightInput.press('Enter');

    // Verify container is no longer fixed
    await expect(container).not.toHaveClass(/fixed/);
  });

  test('should maintain total container height during resize operations', async ({ page }) => {
    // Get initial total height
    const initialHeights = await getContainerHeights(page);
    const initialTotal = initialHeights.reduce((sum, height) => sum + height, 0);

    // Resize first container
    const container = page.locator('.timeline-container').first();
    const resizer = container.locator('.drag-resizer');
    await resizer.hover();
    await page.mouse.down();
    await page.mouse.move(0, 50); // Move down 50 pixels
    await page.mouse.up();

    // Get new total height
    const newHeights = await getContainerHeights(page);
    const newTotal = newHeights.reduce((sum, height) => sum + height, 0);

    // Verify total height remains approximately the same
    // Allow small margin of error due to rounding
    expect(Math.abs(newTotal - initialTotal)).toBeLessThan(10);
  });
});
