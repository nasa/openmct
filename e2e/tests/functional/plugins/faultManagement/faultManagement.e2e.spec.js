/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
const path = require('path');

test.describe('The Fault Management Plugin', () => {
    test.beforeEach(async ({ page }) => {
        await startAndNavigateToFaultManagement(page);
    });

    test('Shows a criticality icon for every fault', async ({ page }) => {
        const faultCount = await page.locator('c-fault-mgmt__list').count();
        const criticalityIconCount = await page.locator('c-fault-mgmt__list-severity').count();

        expect.soft(faultCount).toEqual(criticalityIconCount);
    });

    test('When selecting a fault, it has an "is-selected" class and it\'s information shows in the inspector', async ({ page }) => {
        await selectFaultItem(page, 1);

        const selectedFaultName = await page.locator('.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname').textContent();
        const inspectorFaultNameCount = await page.locator(`.c-inspector__properties >> :text("${selectedFaultName}")`).count();

        await expect.soft(page.locator('.c-faults-list-view-item-body > .c-fault-mgmt__list').first()).toHaveClass(/is-selected/);
        expect.soft(inspectorFaultNameCount).toEqual(1);
    });

    test('When selecting multiple faults, no specific fault information is shown in the inspector', async ({ page }) => {
        await selectFaultItem(page, 1);
        await selectFaultItem(page, 2);

        const selectedRows = page.locator('.c-fault-mgmt__list.is-selected .c-fault-mgmt__list-faultname');
        expect.soft(await selectedRows.count()).toEqual(2);

        const firstSelectedFaultName = await selectedRows.nth(0).textContent();
        const secondSelectedFaultName = await selectedRows.nth(1).textContent();
        const firstNameInInspectorCount = await page.locator(`.c-inspector__properties >> :text("${firstSelectedFaultName}")`).count();
        const secondNameInInspectorCount = await page.locator(`.c-inspector__properties >> :text("${secondSelectedFaultName}")`).count();

        expect.soft(firstNameInInspectorCount).toEqual(0);
        expect.soft(secondNameInInspectorCount).toEqual(0);
    });

    test('Allows you to shelve a fault', async ({ page }) => {
        const shelvedFaultName = await getFaultName(page, 2);
        const beforeShelvedFault = getFaulBytName(page, shelvedFaultName);

        expect.soft(await beforeShelvedFault.count()).toBe(1);

        await shelveFault(page, 2);

        // check it is removed from standard view
        const afterShelvedFault = getFaulBytName(page, shelvedFaultName);
        expect.soft(await afterShelvedFault.count()).toBe(0);

        await changeViewTo(page, 'shelved');

        const shelvedViewFault = getFaulBytName(page, shelvedFaultName);

        expect.soft(await shelvedViewFault.count()).toBe(1);
    });

    test('Allows you to acknowledge a fault', async ({ page }) => {
        const acknowledgedFaultName = await getFaultName(page, 3);

        await acknowledgeFault(page, 3);

        const fault = getFault(page, 3);
        await expect.soft(fault).toHaveClass(/is-acknowledged/);

        await changeViewTo(page, 'acknowledged');

        const acknowledgedViewFaultName = await getFaultName(page, 1);
        expect.soft(acknowledgedFaultName).toEqual(acknowledgedViewFaultName);
    });

    test('Allows you to shelve multiple faults', async ({ page }) => {
        const shelvedFaultNameOne = await getFaultName(page, 1);
        const shelvedFaultNameFour = await getFaultName(page, 4);

        const beforeShelvedFaultOne = getFaulBytName(page, shelvedFaultNameOne);
        const beforeShelvedFaultFour = getFaulBytName(page, shelvedFaultNameFour);

        expect.soft(await beforeShelvedFaultOne.count()).toBe(1);
        expect.soft(await beforeShelvedFaultFour.count()).toBe(1);

        await shelveMultipleFaults(page, 1, 4);

        // check it is removed from standard view
        const afterShelvedFaultOne = getFaulBytName(page, shelvedFaultNameOne);
        const afterShelvedFaultFour = getFaulBytName(page, shelvedFaultNameFour);
        expect.soft(await afterShelvedFaultOne.count()).toBe(0);
        expect.soft(await afterShelvedFaultFour.count()).toBe(0);

        await changeViewTo(page, 'shelved');

        const shelvedViewFaultOne = getFaulBytName(page, shelvedFaultNameOne);
        const shelvedViewFaultFour = getFaulBytName(page, shelvedFaultNameFour);

        expect.soft(await shelvedViewFaultOne.count()).toBe(1);
        expect.soft(await shelvedViewFaultFour.count()).toBe(1);
    });

    test('Allows you to acknowledge multiple faults', async ({ page }) => {
        const acknowledgedFaultNameTwo = await getFaultName(page, 2);
        const acknowledgedFaultNameFive = await getFaultName(page, 5);

        await acknowledgeMultipleFaults(page, 2, 5);

        const faultTwo = getFault(page, 2);
        const faultFive = getFault(page, 5);

        // check they have been acknowledged
        await expect.soft(faultTwo).toHaveClass(/is-acknowledged/);
        await expect.soft(faultFive).toHaveClass(/is-acknowledged/);

        await changeViewTo(page, 'acknowledged');

        const acknowledgedViewFaultTwo = getFaulBytName(page, acknowledgedFaultNameTwo);
        const acknowledgedViewFaultFive = getFaulBytName(page, acknowledgedFaultNameFive);

        expect.soft(await acknowledgedViewFaultTwo.count()).toBe(1);
        expect.soft(await acknowledgedViewFaultFive.count()).toBe(1);
    });

    test('Allows you to search faults', async ({ page }) => {
        const faultThreeNamespace = await getFaultNamespace(page, 3);
        const faultTwoName = await getFaultName(page, 2);
        const faultFiveTriggerTime = await getFaultTriggerTime(page, 5);

        // should be all faults (5)
        let faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(5);

        // search namespace
        await enterSearchTerm(page, faultThreeNamespace);

        faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(1);
        expect.soft(await getFaultNamespace(page, 1)).toEqual(faultThreeNamespace);

        // all faults
        await clearSearch(page);
        faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(5);

        // search name
        await enterSearchTerm(page, faultTwoName);

        faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(1);
        expect.soft(await getFaultName(page, 1)).toEqual(faultTwoName);

        // all faults
        await clearSearch(page);
        faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(5);

        // search triggerTime
        await enterSearchTerm(page, faultFiveTriggerTime);

        faultResultCount = await getFaultResultCount(page);
        expect.soft(faultResultCount).toEqual(1);
        expect.soft(await getFaultTriggerTime(page, 1)).toEqual(faultFiveTriggerTime);
    });

    test('Allows you to sort faults', async ({ page }) => {
        const highestSeverity = await getHighestSeverity(page);
        const lowestSeverity = await getLowestSeverity(page);
        const faultOneName = 'Example Fault 1';
        const faultFiveName = 'Example Fault 5';
        let firstFaultName = await getFaultName(page, 1);

        expect.soft(firstFaultName).toEqual(faultOneName);

        await sortFaultsBy(page, 'oldest-first');

        firstFaultName = await getFaultName(page, 1);
        expect.soft(firstFaultName).toEqual(faultFiveName);

        await sortFaultsBy(page, 'severity');

        const sortedHighestSeverity = await getFaultSeverity(page, 1);
        const sortedLowestSeverity = await getFaultSeverity(page, 5);
        expect.soft(sortedHighestSeverity).toEqual(highestSeverity);
        expect.soft(sortedLowestSeverity).toEqual(lowestSeverity);
    });

});

/**
 * @param {import('@playwright/test').Page} page
 */
async function startAndNavigateToFaultManagement(page) {

    // eslint-disable-next-line no-undef
    await page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitExampleFaultProvider.js') });
    await page.goto('./', { waitUntil: 'networkidle' });

    // Click text=Fault Management
    await page.click('text=Fault Management'); // this verifies the plugin has been added
    await page.waitForNavigation({waitUntil: 'networkidle'});
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function acknowledgeFault(page, rowNumber) {
    await openFaultRowMenu(page, rowNumber);
    await page.locator('.c-menu >> text="Acknowledge"').click();
    // Click [aria-label="Save"]
    await page.locator('[aria-label="Save"]').click();

}

/**
 * @param {import('@playwright/test').Page} page
 */
async function shelveMultipleFaults(page, ...nums) {
    const selectRows = nums.map((num) => {
        return selectFaultItem(page, num);
    });
    await Promise.all(selectRows);

    await page.locator('button:has-text("Shelve")').click();
    await page.locator('[aria-label="Save"]').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function acknowledgeMultipleFaults(page, ...nums) {
    const selectRows = nums.map((num) => {
        return selectFaultItem(page, num);
    });
    await Promise.all(selectRows);

    await page.locator('button:has-text("Acknowledge")').click();
    await page.locator('[aria-label="Save"]').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function shelveFault(page, rowNumber) {
    await openFaultRowMenu(page, rowNumber);
    await page.locator('.c-menu >> text="Shelve"').click();
    // Click [aria-label="Save"]
    await page.locator('[aria-label="Save"]').click();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function changeViewTo(page, view) {
    await page.locator('.c-fault-mgmt__search-row select').first().selectOption(view);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function sortFaultsBy(page, sort) {
    await page.locator('.c-fault-mgmt__list-header-sortButton select').selectOption(sort);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function enterSearchTerm(page, term) {
    await page.locator('.c-fault-mgmt-search [aria-label="Search Input"]').fill(term);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function clearSearch(page) {
    await enterSearchTerm(page, '');
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function selectFaultItem(page, rowNumber) {
    // eslint-disable-next-line playwright/no-force-option
    await page.check(`.c-fault-mgmt-item > input >> nth=${rowNumber - 1}`, { force: true }); // this will not work without force true, saw this may be a pw bug
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getHighestSeverity(page) {
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
async function getLowestSeverity(page) {
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
async function getFaultResultCount(page) {
    const count = await page.locator('.c-faults-list-view-item-body > .c-fault-mgmt__list').count();

    return count;
}

/**
 * @param {import('@playwright/test').Page} page
 */
function getFault(page, rowNumber) {
    const fault = page.locator(`.c-faults-list-view-item-body > .c-fault-mgmt__list >> nth=${rowNumber - 1}`);

    return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 */
function getFaulBytName(page, name) {
    const fault = page.locator(`.c-fault-mgmt__list-faultname:has-text("${name}")`);

    return fault;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getFaultName(page, rowNumber) {
    const faultName = await page.locator(`.c-fault-mgmt__list-faultname >> nth=${rowNumber - 1}`).textContent();

    return faultName;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getFaultSeverity(page, rowNumber) {
    const faultSeverity = await page.locator(`.c-faults-list-view-item-body .c-fault-mgmt__list-severity >> nth=${rowNumber - 1}`).getAttribute('title');

    return faultSeverity;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getFaultNamespace(page, rowNumber) {
    const faultNamespace = await page.locator(`.c-fault-mgmt__list-path >> nth=${rowNumber - 1}`).textContent();

    return faultNamespace;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getFaultTriggerTime(page, rowNumber) {
    const faultTriggerTime = await page.locator(`.c-fault-mgmt__list-trigTime >> nth=${rowNumber - 1} >> .c-fault-mgmt-item__value`).textContent();

    return faultTriggerTime.toString().trim();
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function openFaultRowMenu(page, rowNumber) {
    // select
    await page.locator(`.c-fault-mgmt-item > .c-fault-mgmt__list-action-button >> nth=${rowNumber - 1}`).click();

}
