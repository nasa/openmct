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

const { test, expect } = require('../../../../pluginFixtures');
const utils = require('../../../../helper/faultUtils');
const { selectInspectorTab } = require('../../../../appActions');

test.describe('The Fault Management Plugin using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await utils.navigateToFaultManagementWithExample(page);
  });

  test('Shows a criticality icon for every fault @unstable', async ({ page }) => {
    const faultCount = await page.locator('c-fault-mgmt__list').count();
    const criticalityIconCount = await page.locator('c-fault-mgmt__list-severity').count();

    expect.soft(faultCount).toEqual(criticalityIconCount);
  });

  test('When selecting a fault, it has an "is-selected" class and it\'s information shows in the inspector @unstable', async ({
    page
  }) => {
    await utils.selectFaultItem(page, 1);

    await selectInspectorTab(page, 'Fault Management Configuration');
    const selectedFaultName = await page
      .locator('.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname')
      .textContent();
    const inspectorFaultNameCount = await page
      .locator(`.c-inspector__properties >> :text("${selectedFaultName}")`)
      .count();

    await expect
      .soft(page.locator('.c-faults-list-view-item-body > .c-fault-mgmt__list').first())
      .toHaveClass(/is-selected/);
    expect.soft(inspectorFaultNameCount).toEqual(1);
  });

  test('When selecting multiple faults, no specific fault information is shown in the inspector @unstable', async ({
    page
  }) => {
    await utils.selectFaultItem(page, 1);
    await utils.selectFaultItem(page, 2);

    const selectedRows = page.locator(
      '.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname'
    );
    expect.soft(await selectedRows.count()).toEqual(2);

    await selectInspectorTab(page, 'Fault Management Configuration');
    const firstSelectedFaultName = await selectedRows.nth(0).textContent();
    const secondSelectedFaultName = await selectedRows.nth(1).textContent();
    const firstNameInInspectorCount = await page
      .locator(`.c-inspector__properties >> :text("${firstSelectedFaultName}")`)
      .count();
    const secondNameInInspectorCount = await page
      .locator(`.c-inspector__properties >> :text("${secondSelectedFaultName}")`)
      .count();

    expect.soft(firstNameInInspectorCount).toEqual(0);
    expect.soft(secondNameInInspectorCount).toEqual(0);
  });

  test('Allows you to shelve a fault @unstable', async ({ page }) => {
    const shelvedFaultName = await utils.getFaultName(page, 2);
    const beforeShelvedFault = utils.getFaultByName(page, shelvedFaultName);

    expect.soft(await beforeShelvedFault.count()).toBe(1);

    await utils.shelveFault(page, 2);

    // check it is removed from standard view
    const afterShelvedFault = utils.getFaultByName(page, shelvedFaultName);
    expect.soft(await afterShelvedFault.count()).toBe(0);

    await utils.changeViewTo(page, 'shelved');

    const shelvedViewFault = utils.getFaultByName(page, shelvedFaultName);

    expect.soft(await shelvedViewFault.count()).toBe(1);
  });

  test('Allows you to acknowledge a fault @unstable', async ({ page }) => {
    const acknowledgedFaultName = await utils.getFaultName(page, 3);

    await utils.acknowledgeFault(page, 3);

    const fault = utils.getFault(page, 3);
    await expect.soft(fault).toHaveClass(/is-acknowledged/);

    await utils.changeViewTo(page, 'acknowledged');

    const acknowledgedViewFaultName = await utils.getFaultName(page, 1);
    expect.soft(acknowledgedFaultName).toEqual(acknowledgedViewFaultName);
  });

  test('Allows you to shelve multiple faults @unstable', async ({ page }) => {
    const shelvedFaultNameOne = await utils.getFaultName(page, 1);
    const shelvedFaultNameFour = await utils.getFaultName(page, 4);

    const beforeShelvedFaultOne = utils.getFaultByName(page, shelvedFaultNameOne);
    const beforeShelvedFaultFour = utils.getFaultByName(page, shelvedFaultNameFour);

    expect.soft(await beforeShelvedFaultOne.count()).toBe(1);
    expect.soft(await beforeShelvedFaultFour.count()).toBe(1);

    await utils.shelveMultipleFaults(page, 1, 4);

    // check it is removed from standard view
    const afterShelvedFaultOne = utils.getFaultByName(page, shelvedFaultNameOne);
    const afterShelvedFaultFour = utils.getFaultByName(page, shelvedFaultNameFour);
    expect.soft(await afterShelvedFaultOne.count()).toBe(0);
    expect.soft(await afterShelvedFaultFour.count()).toBe(0);

    await utils.changeViewTo(page, 'shelved');

    const shelvedViewFaultOne = utils.getFaultByName(page, shelvedFaultNameOne);
    const shelvedViewFaultFour = utils.getFaultByName(page, shelvedFaultNameFour);

    expect.soft(await shelvedViewFaultOne.count()).toBe(1);
    expect.soft(await shelvedViewFaultFour.count()).toBe(1);
  });

  test('Allows you to acknowledge multiple faults @unstable', async ({ page }) => {
    const acknowledgedFaultNameTwo = await utils.getFaultName(page, 2);
    const acknowledgedFaultNameFive = await utils.getFaultName(page, 5);

    await utils.acknowledgeMultipleFaults(page, 2, 5);

    const faultTwo = utils.getFault(page, 2);
    const faultFive = utils.getFault(page, 5);

    // check they have been acknowledged
    await expect.soft(faultTwo).toHaveClass(/is-acknowledged/);
    await expect.soft(faultFive).toHaveClass(/is-acknowledged/);

    await utils.changeViewTo(page, 'acknowledged');

    const acknowledgedViewFaultTwo = utils.getFaultByName(page, acknowledgedFaultNameTwo);
    const acknowledgedViewFaultFive = utils.getFaultByName(page, acknowledgedFaultNameFive);

    expect.soft(await acknowledgedViewFaultTwo.count()).toBe(1);
    expect.soft(await acknowledgedViewFaultFive.count()).toBe(1);
  });

  test('Allows you to search faults @unstable', async ({ page }) => {
    const faultThreeNamespace = await utils.getFaultNamespace(page, 3);
    const faultTwoName = await utils.getFaultName(page, 2);
    const faultFiveTriggerTime = await utils.getFaultTriggerTime(page, 5);

    // should be all faults (5)
    let faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(5);

    // search namespace
    await utils.enterSearchTerm(page, faultThreeNamespace);

    faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(1);
    expect.soft(await utils.getFaultNamespace(page, 1)).toEqual(faultThreeNamespace);

    // all faults
    await utils.clearSearch(page);
    faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(5);

    // search name
    await utils.enterSearchTerm(page, faultTwoName);

    faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(1);
    expect.soft(await utils.getFaultName(page, 1)).toEqual(faultTwoName);

    // all faults
    await utils.clearSearch(page);
    faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(5);

    // search triggerTime
    await utils.enterSearchTerm(page, faultFiveTriggerTime);

    faultResultCount = await utils.getFaultResultCount(page);
    expect.soft(faultResultCount).toEqual(1);
    expect.soft(await utils.getFaultTriggerTime(page, 1)).toEqual(faultFiveTriggerTime);
  });

  test('Allows you to sort faults @unstable', async ({ page }) => {
    const highestSeverity = await utils.getHighestSeverity(page);
    const lowestSeverity = await utils.getLowestSeverity(page);
    const faultOneName = 'Example Fault 1';
    const faultFiveName = 'Example Fault 5';
    let firstFaultName = await utils.getFaultName(page, 1);

    expect.soft(firstFaultName).toEqual(faultOneName);

    await utils.sortFaultsBy(page, 'oldest-first');

    firstFaultName = await utils.getFaultName(page, 1);
    expect.soft(firstFaultName).toEqual(faultFiveName);

    await utils.sortFaultsBy(page, 'severity');

    const sortedHighestSeverity = await utils.getFaultSeverity(page, 1);
    const sortedLowestSeverity = await utils.getFaultSeverity(page, 5);
    expect.soft(sortedHighestSeverity).toEqual(highestSeverity);
    expect.soft(sortedLowestSeverity).toEqual(lowestSeverity);
  });
});

test.describe('The Fault Management Plugin without using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await utils.navigateToFaultManagementWithoutExample(page);
  });

  test('Shows no faults when no faults are provided @unstable', async ({ page }) => {
    const faultCount = await page.locator('c-fault-mgmt__list').count();

    expect.soft(faultCount).toEqual(0);

    await utils.changeViewTo(page, 'acknowledged');
    const acknowledgedCount = await page.locator('c-fault-mgmt__list').count();
    expect.soft(acknowledgedCount).toEqual(0);

    await utils.changeViewTo(page, 'shelved');
    const shelvedCount = await page.locator('c-fault-mgmt__list').count();
    expect.soft(shelvedCount).toEqual(0);
  });

  test('Will return no faults when searching @unstable', async ({ page }) => {
    await utils.enterSearchTerm(page, 'fault');

    const faultCount = await page.locator('c-fault-mgmt__list').count();

    expect.soft(faultCount).toEqual(0);
  });
});
