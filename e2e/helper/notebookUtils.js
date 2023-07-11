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

const { createDomainObjectWithDefaults } = require('../appActions');

const NOTEBOOK_DROP_AREA = '.c-notebook__drag-area';

/**
 * @param {import('@playwright/test').Page} page
 */
async function enterTextEntry(page, text) {
  // Click the 'Add Notebook Entry' area
  await page.locator(NOTEBOOK_DROP_AREA).click();

  // enter text
  await page.locator('[aria-label="Notebook Entry"].is-selected div.c-ne__text').fill(text);
  await commitEntry(page);
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
  await page.click('button[title="Show selected item in tree"]');
  // Drag and drop the SWG into the notebook
  await page.dragAndDrop(`text=${swg.name}`, NOTEBOOK_DROP_AREA);
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

// eslint-disable-next-line no-undef
module.exports = {
  enterTextEntry,
  dragAndDropEmbed
};
