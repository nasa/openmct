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
 * This test suite verifies modifying the image location of the example imagery object.
 */

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Example Imagery Object Custom Images', () => {
  let exampleImagery;
  test.beforeEach(async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a default 'Example Imagery' object
    exampleImagery = await createDomainObjectWithDefaults(page, {
      name: 'Example Imagery',
      type: 'Example Imagery'
    });

    // Verify that the created object is focused
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(exampleImagery.name);
    await page.getByLabel('Focused Image Element').hover({ trial: true });

    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });
  // this requires CORS to be enabled in some fashion
  test.fixme('Can right click on image and save it as a file', async ({ page }) => {});
  test('Can provide a custom image location for the example imagery object', async ({ page }) => {
    // Modify Example Imagery to create a really stable image which will never let us down
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page
      .locator('#imageLocation-textarea')
      .fill(
        'https://raw.githubusercontent.com/nasa/openmct/554f77c42fec81cf0f63e62b278012cb08d82af9/e2e/test-data/rick.jpg,https://raw.githubusercontent.com/nasa/openmct/554f77c42fec81cf0f63e62b278012cb08d82af9/e2e/test-data/rick.jpg'
      );
    await page.getByRole('button', { name: 'Save' }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for the thumbnails to finish their scroll animation
    // (Wait until the rightmost thumbnail is in view)
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();

    await expect(page.getByLabel('Image Wrapper')).toBeVisible();
  });
  test.fixme('Can provide a custom image with spaces in name', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7903'
    });
    await page.goto(exampleImagery.url, { waitUntil: 'domcontentloaded' });

    // Modify Example Imagery to create a really stable image which will never let us down
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page
      .locator('#imageLocation-textarea')
      .fill(
        'https://raw.githubusercontent.com/nasa/openmct/d8c64f183400afb70137221fc1a035e091bea912/e2e/test-data/rick%20space%20roll.jpg'
      );
    await page.getByRole('button', { name: 'Save' }).click();
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for the thumbnails to finish their scroll animation
    // (Wait until the rightmost thumbnail is in view)
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();

    await expect(page.getByLabel('Image Wrapper')).toBeVisible();
  });
});
