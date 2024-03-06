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
 */
export async function navigateToFaultManagementWithExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitExampleFaultProvider.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToFaultManagementWithStaticExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitExampleFaultProviderStatic.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToFaultManagementWithoutExample(page) {
  await page.addInitScript({
    path: fileURLToPath(new URL('./addInitFaultManagementPlugin.js', import.meta.url))
  });

  await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function navigateToFaultItemInTree(page) {
  await page.goto('./', { waitUntil: 'networkidle' });

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
 */
export async function acknowledgeFault(page, rowNumber) {
  await openFaultRowMenu(page, rowNumber);
  await page.getByLabel('Acknowledge', { exact: true }).click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
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
 */
export async function acknowledgeMultipleFaults(page, ...nums) {
  const selectRows = nums.map((num) => {
    return selectFaultItem(page, num);
  });
  await Promise.all(selectRows);

  await page.locator('button:has-text("Acknowledge")').click();
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function shelveFault(page, rowNumber) {
  await openFaultRowMenu(page, rowNumber);
  await page.locator('.c-menu >> text="Shelve"').click();
  // Click [aria-label="Save"]
  await page.getByLabel('Save').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function changeViewTo(page, view) {
  await page.locator('.c-fault-mgmt__search-row select').first().selectOption(view);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function sortFaultsBy(page, sort) {
  await page.locator('.c-fault-mgmt__list-header-sortButton select').selectOption(sort);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function enterSearchTerm(page, term) {
  await page.locator('.c-fault-mgmt-search [aria-label="Search Input"]').fill(term);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function clearSearch(page) {
  await enterSearchTerm(page, '');
}

/**
 * @param {import('@playwright/test').Page} page
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
 */
export async function getHighestSeverity(page) {
  const criticalCount = await page.locator('[title=CRITICAL]').count();
  const warningCount = await page.locator('[title=WARNING]').count();

  if (criticalCount > 0) {
    return 'CRITICAL';
  } else if (warningCount > 0) {
    return 'WARNING';
  }

  return 'WATCH';
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getLowestSeverity(page) {
  const warningCount = await page.locator('[title=WARNING]').count();
  const watchCount = await page.locator('[title=WATCH]').count();

  if (watchCount > 0) {
    return 'WATCH';
  } else if (warningCount > 0) {
    return 'WARNING';
  }

  return 'CRITICAL';
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getFaultResultCount(page) {
  const count = await page.locator('.c-faults-list-view-item-body > .c-fault-mgmt__list').count();

  return count;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export function getFault(page, rowNumber) {
  const fault = page.locator(
    `.c-faults-list-view-item-body > .c-fault-mgmt__list >> nth=${rowNumber - 1}`
  );

  return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export function getFaultByName(page, name) {
  const fault = page.locator(`.c-fault-mgmt__list-faultname:has-text("${name}")`);

  return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getFaultName(page, rowNumber) {
  const faultName = await page
    .locator(`.c-fault-mgmt__list-faultname >> nth=${rowNumber - 1}`)
    .textContent();

  return faultName;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getFaultSeverity(page, rowNumber) {
  const faultSeverity = await page
    .locator(`.c-faults-list-view-item-body .c-fault-mgmt__list-severity >> nth=${rowNumber - 1}`)
    .getAttribute('title');

  return faultSeverity;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getFaultNamespace(page, rowNumber) {
  const faultNamespace = await page
    .locator(`.c-fault-mgmt__list-path >> nth=${rowNumber - 1}`)
    .textContent();

  return faultNamespace;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getFaultTriggerTime(page, rowNumber) {
  const faultTriggerTime = await page
    .locator(`.c-fault-mgmt__list-trigTime >> nth=${rowNumber - 1} >> .c-fault-mgmt-item__value`)
    .textContent();

  return faultTriggerTime.toString().trim();
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function openFaultRowMenu(page, rowNumber) {
  // select
  await page
    .getByLabel('Disposition actions')
    .nth(rowNumber - 1)
    .click();
}
