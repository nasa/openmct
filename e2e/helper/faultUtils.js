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
import { fileURLToPath } from 'url';

import { expect } from '../pluginFixtures.js';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function navigateToFaultManagementWithExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitExampleFaultProvider.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function navigateToFaultManagementWithStaticExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitExampleFaultProviderStatic.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
export async function navigateToFaultManagementWithoutExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitFaultManagementPlugin.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
async function navigateToFaultItemInTree(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/#/browse/mine?**');

  const faultManagementTreeItem = page
    .getByRole('tree', {
      name: 'Main Tree'
    })
    .getByRole('treeitem', {
      name: 'Fault Management'
    });

  // Navigate to "Fault Management" from the tree
  await faultManagementTreeItem.click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<void>}
 */
export async function acknowledgeFault(page, rowNumber) {
  await openFaultRowMenu(page, rowNumber);
  await page.getByLabel('Acknowledge', { exact: true }).click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {...number} nums
 * @returns {Promise<void>}
 */
export async function shelveMultipleFaults(page, ...nums) {
  const selectRows = nums.map((num) => {
    return selectFaultItem(page, num);
  });
  await Promise.all(selectRows);

  await page.getByLabel('Shelve selected faults').click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {...number} nums
 * @returns {Promise<void>}
 */
export async function acknowledgeMultipleFaults(page, ...nums) {
  const selectRows = nums.map((num) => {
    return selectFaultItem(page, num);
  });
  await Promise.all(selectRows);

  await page.getByLabel('Acknowledge selected faults').click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<void>}
 */
export async function shelveFault(page, rowNumber) {
  await openFaultRowMenu(page, rowNumber);
  await page.getByLabel('Shelve', { exact: true }).click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {'severity' | 'newest-first' | 'oldest-first'} sort
 * @returns {Promise<void>}
 */
export async function sortFaultsBy(page, sort) {
  await page.getByTitle('Sort By').getByRole('combobox').selectOption(sort);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {'acknowledged' | 'shelved' | 'standard view'} view
 * @returns {Promise<void>}
 */
export async function changeViewTo(page, view) {
  await page.getByTitle('View Filter').getByRole('combobox').selectOption(view);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<void>}
 */
export async function selectFaultItem(page, rowNumber) {
  await page
    .getByLabel('Select fault')
    .nth(rowNumber - 1)
    .check({
      // Need force here because checkbox state is changed by an event emitted by the checkbox
      // eslint-disable-next-line playwright/no-force-option
      force: true
    });
  await expect(page.getByLabel('Select fault').nth(rowNumber - 1)).toBeChecked();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {import('@playwright/test').Locator}
 */
export function getFault(page, rowNumber) {
  const fault = page.getByLabel('Fault triggered at').nth(rowNumber - 1);

  return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 * @returns {import('@playwright/test').Locator}
 */
export function getFaultByName(page, name) {
  const fault = page.getByLabel('Fault triggered at').filter({
    hasText: name
  });

  return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<string>}
 */
export async function getFaultName(page, rowNumber) {
  const faultName = await page
    .getByLabel('Fault name', { exact: true })
    .nth(rowNumber - 1)
    .textContent();

  return faultName;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<string>}
 */
export async function getFaultNamespace(page, rowNumber) {
  const faultNamespace = await page
    .getByLabel('Fault namespace')
    .nth(rowNumber - 1)
    .textContent();

  return faultNamespace;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<string>}
 */
export async function getFaultTriggerTime(page, rowNumber) {
  const faultTriggerTime = await page
    .getByLabel('Last Trigger Time')
    .nth(rowNumber - 1)
    .textContent();

  return faultTriggerTime.toString().trim();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} rowNumber
 * @returns {Promise<void>}
 */
export async function openFaultRowMenu(page, rowNumber) {
  // select
  await page
    .getByLabel('Fault triggered at')
    .nth(rowNumber - 1)
    .getByLabel('Disposition Actions')
    .click();
}
