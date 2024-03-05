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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks.
*/

import fs from 'fs/promises';
import { fileURLToPath } from 'url';

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

const NOTEBOOK_NAME = 'Notebook';

test.describe('Snapshot image tests', () => {
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });

  test('Can drop an image onto a notebook and create a new entry', async ({ page }) => {
    const imageData = await fs.readFile(
      fileURLToPath(
        new URL('../../../../../src/images/favicons/favicon-96x96.png', import.meta.url)
      )
    );
    const imageArray = new Uint8Array(imageData);
    const fileData = Array.from(imageArray);

    const dropTransfer = await page.evaluateHandle((data) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'favicon-96x96.png', { type: 'image/png' });
      dataTransfer.items.add(file);
      return dataTransfer;
    }, fileData);

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: dropTransfer });
    await page.locator('.c-ne__save-button > button').click();
    // be sure that entry was created
    await expect(page.getByText('favicon-96x96.png')).toBeVisible();

    await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).click();
    // expect large image to be displayed
    await expect(page.getByRole('dialog').getByText('favicon-96x96.png')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    // drop another image onto the entry
    await page.dispatchEvent('.c-snapshots', 'drop', { dataTransfer: dropTransfer });

    const secondThumbnail = page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).nth(1);
    await secondThumbnail.waitFor({ state: 'attached' });
    // expect two embedded images now
    expect(await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).count()).toBe(2);

    await page.locator('.c-snapshot.c-ne__embed').first().getByTitle('More actions').click();

    await page.getByRole('menuitem', { name: /Remove This Embed/ }).click();
    await page.getByRole('button', { name: 'Ok', exact: true }).click();
    // Ensure that the thumbnail is removed before we assert
    await secondThumbnail.waitFor({ state: 'detached' });

    // expect one embedded image now as we deleted the other
    expect(await page.getByRole('img', { name: 'favicon-96x96.png thumbnail' }).count()).toBe(1);
  });
});

test.describe('Snapshot image failure tests', () => {
  test.use({ failOnConsoleError: false });
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });

  test('Get an error notification when dropping unknown file onto notebook entry', async ({
    page
  }) => {
    // fill Uint8Array array with some garbage data
    const garbageData = new Uint8Array(100);
    const fileData = Array.from(garbageData);

    const dropTransfer = await page.evaluateHandle((data) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'someGarbage.foo', { type: 'unknown/garbage' });
      dataTransfer.items.add(file);
      return dataTransfer;
    }, fileData);

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: dropTransfer });

    // should have gotten a notification from OpenMCT that we couldn't add it
    await expect(page.getByText('Unknown object(s) dropped and cannot embed')).toBeVisible();
  });

  test('Get an error notification when dropping big files onto notebook entry', async ({
    page
  }) => {
    const garbageSize = 15 * 1024 * 1024; // 15 megabytes

    await page.addScriptTag({
      // make the garbage client side
      content: `window.bigGarbageData = new Uint8Array(${garbageSize})`
    });

    const bigDropTransfer = await page.evaluateHandle(() => {
      const dataTransfer = new DataTransfer();
      const file = new File([window.bigGarbageData], 'bigBoy.png', { type: 'image/png' });
      dataTransfer.items.add(file);
      return dataTransfer;
    });

    await page.dispatchEvent('.c-notebook__drag-area', 'drop', { dataTransfer: bigDropTransfer });

    // should have gotten a notification from OpenMCT that we couldn't add it as it's too big
    await expect(page.getByText('unable to embed')).toBeVisible();
  });
});
