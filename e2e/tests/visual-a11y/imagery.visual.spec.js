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
import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { MISSION_TIME, VISUAL_FIXED_URL } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';
const TEN_MINUTES = 10 * 60 * 1000;

test.describe('Visual - Example Imagery', () => {
  let exampleImagery;
  let parentLayout;

  test.beforeEach(async ({ page }) => {
    //Start at UNIX epoch time while initializing. The clock needs to run so that debounce functions etc. work.
    await page.clock.install({ time: 0 });
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });

    parentLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Parent Layout'
    });

    exampleImagery = await createDomainObjectWithDefaults(page, {
      type: 'Example Imagery',
      name: 'Example Imagery Test',
      parent: parentLayout.uuid
    });

    // Modify Example Imagery to create a really stable image which will never let us down
    await page.goto(exampleImagery.url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page
      .locator('#imageLocation-textarea')
      .fill(
        'https://raw.githubusercontent.com/nasa/openmct/554f77c42fec81cf0f63e62b278012cb08d82af9/e2e/test-data/rick.jpg,https://raw.githubusercontent.com/nasa/openmct/554f77c42fec81cf0f63e62b278012cb08d82af9/e2e/test-data/rick.jpg'
      );
    await page.getByRole('button', { name: 'Save' }).click();
    await page.clock.pauseAt(MISSION_TIME);
    await page.reload({ waitUntil: 'domcontentloaded' });

    //Hide the Browse and Inspect panes to make the image more stable
    await page.getByTitle('Collapse Browse Pane').click();
    await page.getByTitle('Collapse Inspect Pane').click();
  });

  test('Example Imagery in Fixed Time', async ({ page, theme }) => {
    await page.goto(exampleImagery.url, { waitUntil: 'domcontentloaded' });
    // Scroll the rightmost thumbnail into view
    const lastImageThumbnail = page.getByLabel('Image Thumbnail from').last();
    await lastImageThumbnail.scrollIntoViewIfNeeded();
    await expect(lastImageThumbnail).toBeInViewport();

    await expect(page.getByLabel('Image Wrapper')).toBeVisible();

    await percySnapshot(page, `Example Imagery in Fixed Time (theme: ${theme})`);

    await page.getByLabel('Image Wrapper').hover();

    await percySnapshot(page, `Example Imagery Hover in Fixed Time (theme: ${theme})`);
  });

  test('Example Imagery in Real Time', async ({ page, theme }) => {
    await page.goto(exampleImagery.url, { waitUntil: 'domcontentloaded' });

    // Scroll the rightmost thumbnail into view
    await scrollLastThumbnailIntoView(page);

    await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();
    await page.getByRole('button', { name: 'Time Conductor Mode Menu' }).click();
    await page.getByRole('menuitem', { name: /Real-Time/ }).click();
    await page.clock.pauseAt(MISSION_TIME + TEN_MINUTES);
    // Resume clock to allow debounce functions to fire.
    await page.waitForURL(/tc\.mode=local/);
    //dismiss the time conductor popup
    await page.getByLabel('Discard changes and close time popup').click();
    await scrollLastThumbnailIntoView(page);

    await percySnapshot(page, `Example Imagery in Real Time (theme: ${theme})`);
  });

  test('Example Imagery in Display Layout', async ({ page, theme }) => {
    await page.goto(parentLayout.url, { waitUntil: 'domcontentloaded' });

    await expect(page.getByLabel('Image Wrapper')).toBeVisible();
    await percySnapshot(page, `Example Imagery in Display Layout (theme: ${theme})`);
  });
});

async function scrollLastThumbnailIntoView(page) {
  const lastImageThumbnail = page.getByLabel('Image Thumbnail from').last();
  await lastImageThumbnail.scrollIntoViewIfNeeded();
  await expect(lastImageThumbnail).toBeInViewport();
}
