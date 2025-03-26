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

import { createDomainObjectWithDefaults } from '../appActions.js';

const NOTEBOOK_DROP_AREA = '.c-notebook__drag-area';
const CUSTOM_NAME = 'CUSTOM_NAME';
import { fileURLToPath } from 'url';

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
async function enterTextEntry(page, text) {
  await addNotebookEntry(page);
  await enterTextInLastEntry(page, text);
  await commitEntry(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function addNotebookEntry(page) {
  await page.locator(NOTEBOOK_DROP_AREA).click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function enterTextInLastEntry(page, text) {
  await page.getByLabel('Notebook Entry Input').last().fill(text);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function dragAndDropEmbed(page, notebookObject) {
  // Create example telemetry object
  const swg = await createDomainObjectWithDefaults(page, {
    type: 'Sine Wave Generator'
  });
  // Navigate to notebook
  await page.goto(notebookObject.url);
  // Expand the tree to reveal the notebook
  await page.getByLabel('Show selected item in tree').click();
  // Drag and drop the SWG into the notebook
  await page.getByLabel(`Navigate to ${swg.name}`).dragTo(page.locator(NOTEBOOK_DROP_AREA));
  await commitEntry(page);
}

/**
 * @private
 * @param {import('@playwright/test').Page} page
 */
async function commitEntry(page) {
  //Click the Commit Entry button
  await page.locator('.c-ne__save-button > button').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function startAndAddRestrictedNotebookObject(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitRestrictedNotebook.js', import.meta.url))
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/browse/mine?**');

  return createDomainObjectWithDefaults(page, {
    type: CUSTOM_NAME,
    name: 'Restricted Test Notebook'
  });
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function lockPage(page) {
  // Click the Commit Entries button
  await page.getByLabel('Commit Entries').click();
  // Wait until Lock Banner is visible
  await page.locator('text=Lock Page').click();
}

/**
 * Creates a notebook object and adds an entry.
 * @param {import('@playwright/test').Page} - page to load
 * @param {number} [iterations = 1] - the number of entries to create
 */
async function createNotebookAndEntry(page, iterations = 1) {
  const notebook = createDomainObjectWithDefaults(page, { type: 'Notebook' });

  for (let iteration = 0; iteration < iterations; iteration++) {
    await enterTextEntry(page, `Entry ${iteration}`);
  }

  return notebook;
}

/**
 * Creates a notebook object, adds an entry, and adds a tag.
 * @param {import('@playwright/test').Page} page
 * @param {number} [iterations = 1] - the number of entries (and tags) to create
 */
async function createNotebookEntryAndTags(page, iterations = 1) {
  const notebook = await createNotebookAndEntry(page, iterations);
  await page.getByRole('tab', { name: 'Annotations' }).click();

  for (let iteration = 0; iteration < iterations; iteration++) {
    // Hover and click "Add Tag" button
    // Hover is needed here to "slow down" the actions while running in headless mode
    await page.locator(`[aria-label="Notebook Entry"] >> nth = ${iteration}`).click();
    await page.hover(`button:has-text("Add Tag")`);
    await page.locator(`button:has-text("Add Tag")`).click();

    // Click inside the tag search input
    await page.locator('[placeholder="Type to select tag"]').click();
    // Select the "Driving" tag
    await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();

    // Hover and click "Add Tag" button
    // Hover is needed here to "slow down" the actions while running in headless mode
    await page.hover(`button:has-text("Add Tag")`);
    await page.locator(`button:has-text("Add Tag")`).click();
    // Click inside the tag search input
    await page.locator('[placeholder="Type to select tag"]').click();
    // Select the "Science" tag
    await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
  }

  return notebook;
}

export {
  addNotebookEntry,
  commitEntry,
  createNotebookAndEntry,
  createNotebookEntryAndTags,
  dragAndDropEmbed,
  enterTextEntry,
  enterTextInLastEntry,
  lockPage,
  startAndAddRestrictedNotebookObject
};
