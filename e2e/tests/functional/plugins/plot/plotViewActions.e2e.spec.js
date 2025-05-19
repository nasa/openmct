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
Tests to verify log plot functionality when objects are missing
*/

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

const SWG_NAME = 'Sine Wave Generator';
const OVERLAY_PLOT_NAME = 'Overlay Plot';
const STACKED_PLOT_NAME = 'Stacked Plot';

test.describe('For a default Plot View, Plot View Action:', () => {
  let download;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const plot = await createDomainObjectWithDefaults(page, {
      type: SWG_NAME,
      name: SWG_NAME
    });

    await page.goto(plot.url);

    // Set up dialog handler before clicking the export button
    await page.getByLabel('More actions').click();
  });

  test.afterEach(async ({ page }) => {
    if (download) {
      await download.cancel();
    }
  });

  test('Export as PNG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as PNG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${SWG_NAME} - plot.png`);
  });

  test('Export as JPG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as JPG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${SWG_NAME} - plot.jpeg`);
  });
});

test.describe('For an Overlay Plot View, Plot View Action:', () => {
  let download;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: OVERLAY_PLOT_NAME,
      name: OVERLAY_PLOT_NAME
    });

    await createDomainObjectWithDefaults(page, {
      type: SWG_NAME,
      name: SWG_NAME,
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);

    // Set up dialog handler before clicking the export button
    await page.getByLabel('More actions').click();
  });

  test.afterEach(async ({ page }) => {
    if (download) {
      await download.cancel();
    }
  });

  test('Export as PNG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as PNG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${OVERLAY_PLOT_NAME} - plot.png`);
  });

  test('Export as JPG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as JPG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${OVERLAY_PLOT_NAME} - plot.jpeg`);
  });
});

test.describe('For a Stacked Plot View, Plot View Action:', () => {
  let download;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const stackedPlot = await createDomainObjectWithDefaults(page, {
      type: STACKED_PLOT_NAME,
      name: STACKED_PLOT_NAME
    });

    await createDomainObjectWithDefaults(page, {
      type: SWG_NAME,
      name: SWG_NAME,
      parent: stackedPlot.uuid
    });

    await page.goto(stackedPlot.url);

    // Set up dialog handler before clicking the export button
    await page.getByLabel('More actions').click();
  });

  test.afterEach(async ({ page }) => {
    if (download) {
      await download.cancel();
    }
  });

  test('Export as PNG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as PNG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${STACKED_PLOT_NAME} - stacked-plot.png`);
  });

  test('Export as JPG, will suggest the correct default filename', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as JPG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${STACKED_PLOT_NAME} - stacked-plot.jpeg`);
  });
});

test.describe('Plot View Action:', () => {
  let download;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const plot = await createDomainObjectWithDefaults(page, {
      type: SWG_NAME,
      name: `!@#${SWG_NAME}!@#><`
    });

    await page.goto(plot.url);

    // Set up dialog handler before clicking the export button
    await page.getByLabel('More actions').click();
  });

  test.afterEach(async ({ page }) => {
    if (download) {
      await download.cancel();
    }
  });

  test('Export as PNG saved filenames will not include invalid characters', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as PNG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${SWG_NAME} - plot.png`);
  });

  test('Export as JPG saved filenames will not include invalid characters', async ({ page }) => {
    // Start waiting for download before clicking. Note no await.
    const downloadPromise = page.waitForEvent('download');

    // trigger the download
    await page.getByLabel('Export as JPG').click();

    download = await downloadPromise;

    // Verify the filename contains the expected pattern
    expect(download.suggestedFilename()).toBe(`${SWG_NAME} - plot.jpeg`);
  });
});
