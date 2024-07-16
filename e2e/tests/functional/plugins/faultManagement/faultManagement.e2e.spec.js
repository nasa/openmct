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

import {
  acknowledgeFault,
  acknowledgeMultipleFaults,
  changeViewTo,
  clearSearch,
  enterSearchTerm,
  getFault,
  getFaultByName,
  getFaultName,
  getFaultNamespace,
  getFaultResultCount,
  getFaultSeverity,
  getFaultTriggerTime,
  getHighestSeverity,
  getLowestSeverity,
  navigateToFaultManagementWithExample,
  navigateToFaultManagementWithoutExample,
  selectFaultItem,
  shelveFault,
  shelveMultipleFaults,
  sortFaultsBy
} from '../../../../helper/faultUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('The Fault Management Plugin using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithExample(page);
  });

  test('Shows a criticality icon for every fault', async ({ page }) => {
    const faultCount = await page.locator('c-fault-mgmt__list').count();
    const criticalityIconCount = await page.locator('c-fault-mgmt__list-severity').count();

    expect(faultCount).toEqual(criticalityIconCount);
  });

  test('When selecting a fault, it has an "is-selected" class and it\'s information shows in the inspector', async ({
    page
  }) => {
    await selectFaultItem(page, 1);

    await page.getByRole('tab', { name: 'Config' }).click();
    const selectedFaultName = await page
      .locator('.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname')
      .textContent();
    const inspectorFaultNameCount = await page
      .locator(`.c-inspector__properties >> :text("${selectedFaultName}")`)
      .count();

    await expect(
      page.locator('.c-faults-list-view-item-body > .c-fault-mgmt__list').first()
    ).toHaveClass(/is-selected/);
    expect(inspectorFaultNameCount).toEqual(1);
  });

  test('When selecting multiple faults, no specific fault information is shown in the inspector', async ({
    page
  }) => {
    await selectFaultItem(page, 1);
    await selectFaultItem(page, 2);

    const selectedRows = page.locator(
      '.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname'
    );
    expect(await selectedRows.count()).toEqual(2);

    await page.getByRole('tab', { name: 'Config' }).click();
    const firstSelectedFaultName = await selectedRows.nth(0).textContent();
    const secondSelectedFaultName = await selectedRows.nth(1).textContent();
    const firstNameInInspectorCount = await page
      .locator(`.c-inspector__properties >> :text("${firstSelectedFaultName}")`)
      .count();
    const secondNameInInspectorCount = await page
      .locator(`.c-inspector__properties >> :text("${secondSelectedFaultName}")`)
      .count();

    expect(firstNameInInspectorCount).toEqual(0);
    expect(secondNameInInspectorCount).toEqual(0);
  });

  test('Allows you to shelve a fault', async ({ page }) => {
    const shelvedFaultName = await getFaultName(page, 2);
    const beforeShelvedFault = getFaultByName(page, shelvedFaultName);

    await expect(beforeShelvedFault).toHaveCount(1);

    await shelveFault(page, 2);

    // check it is removed from standard view
    const afterShelvedFault = getFaultByName(page, shelvedFaultName);
    expect(await afterShelvedFault.count()).toBe(0);

    await changeViewTo(page, 'shelved');

    const shelvedViewFault = getFaultByName(page, shelvedFaultName);

    expect(await shelvedViewFault.count()).toBe(1);
  });

  test('Allows you to acknowledge a fault', async ({ page }) => {
    const acknowledgedFaultName = await getFaultName(page, 3);

    await acknowledgeFault(page, 3);

    const fault = getFault(page, 3);
    await expect(fault).toHaveClass(/is-acknowledged/);

    await changeViewTo(page, 'acknowledged');

    const acknowledgedViewFaultName = await getFaultName(page, 1);
    expect(acknowledgedFaultName).toEqual(acknowledgedViewFaultName);
  });

  test('Allows you to shelve multiple faults', async ({ page }) => {
    const shelvedFaultNameOne = await getFaultName(page, 1);
    const shelvedFaultNameFour = await getFaultName(page, 4);

    const beforeShelvedFaultOne = getFaultByName(page, shelvedFaultNameOne);
    const beforeShelvedFaultFour = getFaultByName(page, shelvedFaultNameFour);

    await expect(beforeShelvedFaultOne).toHaveCount(1);
    await expect(beforeShelvedFaultFour).toHaveCount(1);

    await shelveMultipleFaults(page, 1, 4);

    // check it is removed from standard view
    const afterShelvedFaultOne = getFaultByName(page, shelvedFaultNameOne);
    const afterShelvedFaultFour = getFaultByName(page, shelvedFaultNameFour);
    await expect(afterShelvedFaultOne).toHaveCount(0);
    await expect(afterShelvedFaultFour).toHaveCount(0);

    await changeViewTo(page, 'shelved');

    const shelvedViewFaultOne = getFaultByName(page, shelvedFaultNameOne);
    const shelvedViewFaultFour = getFaultByName(page, shelvedFaultNameFour);

    await expect(shelvedViewFaultOne).toHaveCount(1);
    await expect(shelvedViewFaultFour).toHaveCount(1);
  });

  test('Allows you to acknowledge multiple faults', async ({ page }) => {
    const acknowledgedFaultNameTwo = await getFaultName(page, 2);
    const acknowledgedFaultNameFive = await getFaultName(page, 5);

    await acknowledgeMultipleFaults(page, 2, 5);

    const faultTwo = getFault(page, 2);
    const faultFive = getFault(page, 5);

    // check they have been acknowledged
    await expect(faultTwo).toHaveClass(/is-acknowledged/);
    await expect(faultFive).toHaveClass(/is-acknowledged/);

    await changeViewTo(page, 'acknowledged');

    const acknowledgedViewFaultTwo = getFaultByName(page, acknowledgedFaultNameTwo);
    const acknowledgedViewFaultFive = getFaultByName(page, acknowledgedFaultNameFive);

    await expect(acknowledgedViewFaultTwo).toHaveCount(1);
    await expect(acknowledgedViewFaultFive).toHaveCount(1);
  });

  test('Allows you to search faults', async ({ page }) => {
    const faultThreeNamespace = await getFaultNamespace(page, 3);
    const faultTwoName = await getFaultName(page, 2);
    const faultFiveTriggerTime = await getFaultTriggerTime(page, 5);

    // should be all faults (5)
    let faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(5);

    // search namespace
    await enterSearchTerm(page, faultThreeNamespace);

    faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(1);
    expect(await getFaultNamespace(page, 1)).toEqual(faultThreeNamespace);

    // all faults
    await clearSearch(page);
    faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(5);

    // search name
    await enterSearchTerm(page, faultTwoName);

    faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(1);
    expect(await getFaultName(page, 1)).toEqual(faultTwoName);

    // all faults
    await clearSearch(page);
    faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(5);

    // search triggerTime
    await enterSearchTerm(page, faultFiveTriggerTime);

    faultResultCount = await getFaultResultCount(page);
    expect(faultResultCount).toEqual(1);
    expect(await getFaultTriggerTime(page, 1)).toEqual(faultFiveTriggerTime);
  });

  test('Allows you to sort faults', async ({ page }) => {
    const highestSeverity = await getHighestSeverity(page);
    const lowestSeverity = await getLowestSeverity(page);
    const faultOneName = 'Example Fault 1';
    const faultFiveName = 'Example Fault 5';
    let firstFaultName = await getFaultName(page, 1);

    expect(firstFaultName).toEqual(faultOneName);

    await sortFaultsBy(page, 'oldest-first');

    firstFaultName = await getFaultName(page, 1);
    expect(firstFaultName).toEqual(faultFiveName);

    await sortFaultsBy(page, 'severity');

    const sortedHighestSeverity = await getFaultSeverity(page, 1);
    const sortedLowestSeverity = await getFaultSeverity(page, 5);
    expect(sortedHighestSeverity).toEqual(highestSeverity);
    expect(sortedLowestSeverity).toEqual(lowestSeverity);
  });
});

test.describe('The Fault Management Plugin without using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithoutExample(page);
  });

  test('Shows no faults when no faults are provided', async ({ page }) => {
    const faultCount = await page.locator('c-fault-mgmt__list').count();

    expect(faultCount).toEqual(0);

    await changeViewTo(page, 'acknowledged');
    const acknowledgedCount = await page.locator('c-fault-mgmt__list').count();
    expect(acknowledgedCount).toEqual(0);

    await changeViewTo(page, 'shelved');
    const shelvedCount = await page.locator('c-fault-mgmt__list').count();
    expect(shelvedCount).toEqual(0);
  });

  test('Will return no faults when searching', async ({ page }) => {
    await enterSearchTerm(page, 'fault');

    const faultCount = await page.locator('c-fault-mgmt__list').count();

    expect(faultCount).toEqual(0);
  });
});
