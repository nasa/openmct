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
const { first } = require('lodash');

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

        await shelveFault(page, 2);
        await changeViewTo(page, 'shelved');

        const shelvedViewFaultName = await getFaultName(page, 1);

        expect.soft(shelvedFaultName).toEqual(shelvedViewFaultName);
    });

    test('Allows you to acknowledge a fault', async ({ page }) => {
        const acknowledgedFaultName = await getFaultName(page, 3);

        await acknowledgeFault(page, 3);
        await changeViewTo(page, 'acknowledged');

        const acknowledgedViewFaultName = await getFaultName(page, 1);

        expect.soft(acknowledgedFaultName).toEqual(acknowledgedViewFaultName);
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
async function selectFaultItem(page, rowNumber) {
    await page.locator(`.c-fault-mgmt-item > input >> nth=${rowNumber - 1}`).check();
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
async function openFaultRowMenu(page, rowNumber) {
    // select
    await page.locator(`.c-fault-mgmt-item > .c-fault-mgmt__list-action-button >> nth=${rowNumber - 1}`).click();

}

// Ensure that the disposition button for an individual fault works by selecting acknowledge or shelve.
// Then, navigate to each view and ensure that the correct faults appear in the correct disposition views.
// Also, check the same with selecting multiple faults and using the larger disposition options located directly under search.
// Ensure that search works properly by entering keywords and observing the correct faults are shown.
// Check to see if the sort button works and changes according to the options selected (Newest First, Oldest First, Severity)
// When selecting the Acknowledged view, ensure that the criticality icons are not blinking. and that the criticality icon includes a checkmark.
// When selecting the Unacknowledged view, check that the criticality icons are blinking.
// When selecting the Shelved view, check that the contents of the fault are italicized and _slightly greyed out, and criticality icon is not blinking.
// When selecting Standard View, ensure that only acknowledged and unacknowledged faults appear, and its criticality icons are blinking accordingly.
// Shelve a fault for a short period of time. When the time specified runs out, ensure that the fault returns back to its Unacknowledged state and is NOT shelved.
