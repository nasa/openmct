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
  getFault,
  getFaultByName,
  getFaultName,
  getFaultNamespace,
  getFaultTriggerTime,
  navigateToFaultManagementWithoutExample,
  navigateToFaultManagementWithStaticExample,
  selectFaultItem,
  shelveFault,
  shelveMultipleFaults,
  sortFaultsBy
} from '../../../../helper/faultUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('The Fault Management Plugin using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithStaticExample(page);
  });

  test('Shows a criticality icon for every fault', async ({ page }) => {
    const faultCount = await page.locator('c-fault-mgmt__list').count();
    const criticalityIconCount = await page.locator('c-fault-mgmt__list-severity').count();

    expect(faultCount).toEqual(criticalityIconCount);
  });

  test('When selecting a fault, it has an "is-selected" class and its information shows in the inspector', async ({
    page
  }) => {
    await selectFaultItem(page, 1);

    await page.getByRole('tab', { name: 'Config' }).click();

    const inspectorFaultName = page
      .getByLabel('Source inspector properties')
      .getByLabel('inspector property value');

    await expect(page.getByLabel('Fault triggered at').first()).toHaveClass(/is-selected/);
    await expect(inspectorFaultName).toHaveCount(1);
  });

  test('When selecting multiple faults, no specific fault information is shown in the inspector', async ({
    page
  }) => {
    await selectFaultItem(page, 1);
    await selectFaultItem(page, 2);

    const selectedRows = page.getByRole('checkbox', { checked: true });
    await expect(selectedRows).toHaveCount(2);

    await page.getByRole('tab', { name: 'Config' }).click();
    const firstSelectedFaultName = await selectedRows.nth(0).textContent();
    const secondSelectedFaultName = await selectedRows.nth(1).textContent();
    await expect(
      page.locator(`.c-inspector__properties >> :text("${firstSelectedFaultName}")`)
    ).toHaveCount(0);
    await expect(
      page.locator(`.c-inspector__properties >> :text("${secondSelectedFaultName}")`)
    ).toHaveCount(0);
  });

  test('Allows you to shelve a fault', async ({ page }) => {
    const shelvedFaultName = await getFaultName(page, 2);
    const beforeShelvedFault = getFaultByName(page, shelvedFaultName);

    await expect(beforeShelvedFault).toHaveCount(1);

    await shelveFault(page, 2);

    // check it is removed from standard view
    const afterShelvedFault = getFaultByName(page, shelvedFaultName);
    await expect(afterShelvedFault).toHaveCount(0);

    await changeViewTo(page, 'shelved');

    const shelvedViewFault = getFaultByName(page, shelvedFaultName);

    await expect(shelvedViewFault).toHaveCount(1);
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
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(5);

    // search namespace
    await page
      .getByLabel('Fault Management Object View')
      .getByLabel('Search Input')
      .fill(faultThreeNamespace);

    await expect(page.getByLabel('Fault triggered at')).toHaveCount(1);
    expect(await getFaultNamespace(page, 1)).toEqual(faultThreeNamespace);

    // all faults
    await page.getByLabel('Fault Management Object View').getByLabel('Search Input').fill('');
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(5);

    // search name
    await page
      .getByLabel('Fault Management Object View')
      .getByLabel('Search Input')
      .fill(faultTwoName);

    await expect(page.getByLabel('Fault triggered at')).toHaveCount(1);
    expect(await getFaultName(page, 1)).toEqual(faultTwoName);

    // all faults
    await page.getByLabel('Fault Management Object View').getByLabel('Search Input').fill('');
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(5);

    // search triggerTime
    await page
      .getByLabel('Fault Management Object View')
      .getByLabel('Search Input')
      .fill(faultFiveTriggerTime);

    await expect(page.getByLabel('Fault triggered at')).toHaveCount(1);
    expect(await getFaultTriggerTime(page, 1)).toEqual(faultFiveTriggerTime);
  });

  test('Allows you to sort faults', async ({ page }) => {
    /**
     * Compares two severity levels and returns a number indicating their relative order.
     *
     * @param {'CRITICAL' | 'WARNING' | 'WATCH'} severity1 - The first severity level to compare.
     * @param {'CRITICAL' | 'WARNING' | 'WATCH'} severity2 - The second severity level to compare.
     * @returns {number} - A negative number if severity1 is less severe than severity2,
     *                     a positive number if severity1 is more severe than severity2,
     *                     or 0 if they are equally severe.
     */
    // eslint-disable-next-line func-style
    const compareSeverity = (severity1, severity2) => {
      const severityOrder = ['WATCH', 'WARNING', 'CRITICAL'];
      return severityOrder.indexOf(severity1) - severityOrder.indexOf(severity2);
    };

    const faultOneName = 'Example Fault 1';
    const faultFiveName = 'Example Fault 5';
    let firstFaultName = await getFaultName(page, 1);

    expect(firstFaultName).toEqual(faultOneName);

    await sortFaultsBy(page, 'oldest-first');

    firstFaultName = await getFaultName(page, 1);
    expect(firstFaultName).toEqual(faultFiveName);

    await sortFaultsBy(page, 'severity');

    const firstFaultSeverityLabel = await page
      .getByLabel('Severity:')
      .first()
      .getAttribute('aria-label');
    const firstFaultSeverity = firstFaultSeverityLabel.split(' ').slice(1).join(' ');

    const lastFaultSeverityLabel = await page
      .getByLabel('Severity:')
      .last()
      .getAttribute('aria-label');
    const lastFaultSeverity = lastFaultSeverityLabel.split(' ').slice(1).join(' ');

    expect(compareSeverity(firstFaultSeverity, lastFaultSeverity)).toBeGreaterThan(0);
  });
});

test.describe('The Fault Management Plugin without using example faults', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFaultManagementWithoutExample(page);
  });

  test('Shows no faults when no faults are provided', async ({ page }) => {
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(0);

    await changeViewTo(page, 'acknowledged');
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(0);

    await changeViewTo(page, 'shelved');
    await expect(page.getByLabel('Fault triggered at')).toHaveCount(0);
  });

  test('Will return no faults when searching', async ({ page }) => {
    await page.getByLabel('Fault Management Object View').getByLabel('Search Input').fill('fault');

    await expect(page.getByLabel('Fault triggered at')).toHaveCount(0);
  });
});
