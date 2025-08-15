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
import { expect, scanForA11yViolations, test } from '../../avpFixtures.js';
import { VISUAL_FIXED_URL } from '../../constants.js';
import { enterTextEntry, startAndAddRestrictedNotebookObject } from '../../helper/notebookUtils.js';

test.describe('Visual - Restricted Notebook @a11y', () => {
  test.beforeEach(async ({ page }) => {
    const restrictedNotebook = await startAndAddRestrictedNotebookObject(page);
    await page.goto(restrictedNotebook.url + '?hideTree=true&hideInspector=true');
  });

  test('Restricted Notebook is visually correct @addInit', async ({ page, theme }) => {
    // Take a snapshot of the newly created CUSTOM_NAME notebook
    await percySnapshot(page, `Restricted Notebook with CUSTOM_NAME (theme: '${theme}')`);
  });
});

test.describe('Visual - Notebook Snapshot @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./?hideTree=true&hideInspector=true', { waitUntil: 'domcontentloaded' });
  });
  test('Visual check for Snapshot Annotation', async ({ page, theme }) => {
    await page.getByLabel('Open the Notebook Snapshot Menu').click();
    await page.getByRole('menuitem', { name: 'Save to Notebook Snapshots' }).click();
    await page.getByLabel('Show Snapshots').click();

    await page.getByLabel('My Items Notebook Embed').getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: 'View Snapshot' }).click();

    await page.getByLabel('Annotate this snapshot').click();
    await expect(page.locator('#snap-annotation-canvas')).toBeVisible();
    // Clear the canvas
    await page.getByRole('button', { name: 'Put text [T]' }).click();
    // Click in the Painterro canvas to add a text annotation
    await page.locator('.ptro-crp-el').click();
    await page.locator('.ptro-text-tool-input').fill('...is there life on mars?');
    await percySnapshot(page, `Notebook Snapshot with text entry open (theme: '${theme}')`);

    // When working with Painterro, we need to check that the Apply button is hidden after clicking
    await page.getByTitle('Apply').click();
    await expect(page.getByTitle('Apply')).toBeHidden();

    // Save and exit annotation window
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Open up annotation again
    await page.getByRole('img', { name: 'My Items thumbnail' }).click();
    await expect(page.getByLabel('Modal Overlay').getByRole('img')).toBeVisible();

    // Take a snapshot
    await percySnapshot(page, `Notebook Snapshot with annotation (theme: '${theme}')`);
  });
});

test.describe('Visual - Notebook @a11y', () => {
  let notebook;
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });
    notebook = await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Test Notebook'
    });
  });
  test('Accepts dropped objects as embeds', async ({ page, theme }) => {
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Dropped Overlay Plot'
    });

    //Open Tree to perform drag
    await page.getByRole('button', { name: 'Browse' }).click();

    await page.getByLabel('Expand My Items folder').click();

    await page.goto(notebook.url);

    await page
      .getByLabel('Navigate to Dropped Overlay Plot')
      .dragTo(page.getByLabel('To start a new entry, click here or drag and drop any object'));

    await percySnapshot(page, `Notebook w/ dropped embed (theme: ${theme})`);
  });
  test("Blur 'Add tag' on Notebook", async ({ page, theme }) => {
    await enterTextEntry(page, 'Entry 0');

    await percySnapshot(page, `Notebook Entry (theme: '${theme}')`);

    // Open the Inspector
    await page.getByRole('button', { name: 'Inspect' }).click();
    // Open the Annotations tab
    await page.getByRole('tab', { name: 'Annotations' }).click();

    // Take snapshot of the notebook with the Annotations tab opened
    await percySnapshot(page, `Notebook Annotation (theme: '${theme}')`);

    // Add annotation
    await page.locator('button:has-text("Add Tag")').click();

    // Take snapshot of the notebook with the AutoComplete field visible
    await percySnapshot(page, `Notebook Add Tag (theme: '${theme}')`);

    // Click inside the AutoComplete field
    await page.locator('[placeholder="Type to select tag"]').click();

    // Click on the "Tags" header (simulating a click outside the autocomplete field)
    await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

    // Take snapshot of the notebook with the AutoComplete field hidden and with the "Add Tag" button visible
    await percySnapshot(page, `Notebook Annotation de-select blur (theme: '${theme}')`);
  });
  test('Visual check of entry hover and selection', async ({ page, theme }) => {
    // Make two entries so we can test an unselected entry
    await enterTextEntry(page, 'Entry 0');
    await enterTextEntry(page, 'Entry 1');

    // Hover the first entry
    await page.getByText('Entry 0').hover();

    // Take a snapshot
    await percySnapshot(page, `Notebook Non-selected Entry Hover (theme: '${theme}')`);

    // Click the first entry
    await page.getByText('Entry 0').click();

    // Take a snapshot
    await percySnapshot(page, `Notebook Selected Entry Hover (theme: '${theme}')`);

    // Hover the text entry area
    await page.getByText('Entry 0').hover();

    // Take a snapshot
    await percySnapshot(page, `Notebook Selected Entry Text Area Hover (theme: '${theme}')`);

    // Click the text entry area
    await page.getByText('Entry 0').click();

    // Take a snapshot
    await percySnapshot(page, `Notebook Selected Entry Text Area Active (theme: '${theme}')`);
  });
  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
