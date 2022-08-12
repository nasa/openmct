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

const path = require('path');
const { test } = require('../../pluginFixtures');
const percySnapshot = require('@percy/playwright');

test.describe('The Fault Management Plugin Visual Test', () => {

    test('icon test', async ({ page, theme }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, '../../helper/', 'addInitFaultManagementPlugin.js') });
        await page.goto('./', { waitUntil: 'networkidle' });

        await percySnapshot(page, `Fault Management icon appears in tree (theme: '${theme}')`);
    });

    test('fault list and acknowledged faults', async ({ page, theme }) => {
        await navigateToFaultManagementWithExample(page);

        await percySnapshot(page, `Shows a list of faults in the standard view (theme: '${theme}')`);

        await acknowledgeFault(page, 1);
        await changeViewTo(page, 'acknowledged');

        await percySnapshot(page, `Acknowledged faults, have a checkmark on the fault icon and appear in the acknowldeged view (theme: '${theme}')`);
    });

    test('shelved faults', async ({ page, theme }) => {
        await navigateToFaultManagementWithExample(page);

        await shelveFault(page, 1);
        await changeViewTo(page, 'shelved');

        await percySnapshot(page, `Shelved faults appear in the shelved view (theme: '${theme}')`);

        await openFaultRowMenu(page, 1);

        await percySnapshot(page, `Shelved faults have a 3-dot menu with Unshelve option enabled (theme: '${theme}')`);
    });

    test('3-dot menu for fault', async ({ page, theme }) => {
        await navigateToFaultManagementWithExample(page);

        await openFaultRowMenu(page, 1);

        await percySnapshot(page, `Faults have a 3-dot menu with Acknowledge, Shelve and Unshelve (Unshelve is disabled) options (theme: '${theme}')`);
    });

    test('ability to acknowledge or shelve', async ({ page, theme }) => {
        await navigateToFaultManagementWithExample(page);

        await selectFaultItem(page, 1);

        await percySnapshot(page, `Selected faults highlight the ability to Acknowledge or Shelve above the fault list (theme: '${theme}')`);
    });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function navigateToFaultManagementWithExample(page) {
    // eslint-disable-next-line no-undef
    await page.addInitScript({ path: path.join(__dirname, '../../helper/', 'addInitExampleFaultProviderStatic.js') });

    await navigateToFaultItemInTree(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function navigateToFaultItemInTree(page) {
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
    // eslint-disable-next-line playwright/no-force-option
    await page.check(`.c-fault-mgmt-item > input >> nth=${rowNumber - 1}`, { force: true }); // this will not work without force true, saw this may be a pw bug
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function openFaultRowMenu(page, rowNumber) {
    // select
    await page.locator(`.c-fault-mgmt-item > .c-fault-mgmt__list-action-button >> nth=${rowNumber - 1}`).click();

}
