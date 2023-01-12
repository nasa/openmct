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

/*
* This test suite is dedicated to testing the operator status plugin.
*/

// const path = require('path');
const { test, expect } = require('../../../../pluginFixtures');

/*

Precondition: Inject Example User, Operator Status Plugins
Verify that user 1 sees updates from user/role 2 (Not possible without openmct-yamcs implementation)

Clear Role Status of single user test
STUB (test.fixme) Rolling through each

*/

test.describe('Operator Status', () => {
    test.beforeEach(async ({ page }) => {

        // FIXME: determine if plugins will be added to index.html or need to be injected
        // await Promise.all([
        //     page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitExampleUser.js') }),
        //     page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitOperatorStatus.js') })
        // ]);
        page.on('console', msg => console.log(msg.text()))

        await page.goto('./', { waitUntil: 'networkidle' });
    });

    // verify that operator status is visible
    test('operator status is visible and expands when clicked', async ({ page }) => {
        await page.locator('div[title="Set my operator status"]').isVisible();
        await page.locator('div[title="Set my operator status"]').click();

        // expect default status to be 'GO'
        await expect(page.locator('.c-status-poll-panel')).toBeVisible();

    });
    // Verify that user 1 sees updates from user/role 2 (Not possible without openmct-yamcs implementation)
    test('operator status table reflects answered values', async ({ page }) => {
        // user navigates to operator status poll
        const statusPollIndicator = page.locator('div[title="Set my operator status"]');
        await statusPollIndicator.click();

        // get user role value
        const userRole = page.locator('.c-status-poll-panel__user-role');
        const userRoleText = await userRole.innerText();

        // get selected status value
        const selectStatus = page.locator('select[name="setStatus"]');
        const initialStatusValue = await selectStatus.inputValue();

        // open manage status poll
        const manageStatusPollIndicator = page.locator('div[title="Set the current poll question"]');
        await manageStatusPollIndicator.click();
        // parse the table row values
        const row = page.locator(`tr:has-text("${userRoleText}")`);
        const rowValues = await row.innerText();
        const rowValuesArr = rowValues.split('\t');
        const COLUMN_STATUS_INDEX = 1;
        // check initial set value matches status table
        expect(rowValuesArr[COLUMN_STATUS_INDEX].toLowerCase())
            .toEqual(initialStatusValue.toLowerCase());

        // change user status
        await statusPollIndicator.click();
        // FIXME: might want to grab a dynamic option instead of arbitrary
        await page.locator('select[name="setStatus"]').selectOption({ index: 2});
        const updatedStatusValue = await selectStatus.inputValue();
        // verify user status is reflected in table
        await manageStatusPollIndicator.click();

        const updatedRow = page.locator(`tr:has-text("${userRoleText}")`);
        const updatedRowValues = await updatedRow.innerText();
        const updatedRowValuesArr = updatedRowValues.split('\t');

        expect(updatedRowValuesArr[COLUMN_STATUS_INDEX].toLowerCase()).toEqual(updatedStatusValue.toLowerCase());

    });

    test.fixme('clear poll button removes poll responses', () => {
    });

});
