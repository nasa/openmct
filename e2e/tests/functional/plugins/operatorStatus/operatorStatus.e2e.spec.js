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

const path = require('path');

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults, setStartOffset, setFixedTimeMode, setRealTimeMode } = require('../../../../appActions');

/*

Precondition: Inject Example User, Operator Status Plugins
Verify that user 1 sees updates from user/role 2 (Not possible without openmct-yamcs implementation)

Clear Role Status of single user test
STUB (test.fixme) Rolling through each

*/

test.describe('Operator Status', () => {
    test.beforeEach(async ({ page }) => {
        await Promise.all([
            page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitExampleUser.js') }),
            page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitOperatorStatus.js') })
        ]);
        await page.goto('./', { waitUntil: 'networkidle' });
    });

    // verify that operator status is visible
    test('operator status is visible and expands when clicked', async ({ page }) => {
        await page.locator('div[title="Set my operator status"]').isVisible();
        await page.locator('div[title="Set my operator status"]').click();

        // expect default status to be 'GO'
        await expect(page.locator('.c-status-poll-panel')).toBeVisible();

        // const selectValue = await page.locator('select[name="setStatus"]').inputValue();
    });
    // Verify that user 1 sees updates from user/role 2 (Not possible without openmct-yamcs implementation)
    test('operator status table reflects answered values', async ({ page }) => {
        // user sees the operator status
        // user navigates to operator status table
        await page.locator('div[title="Set my operator status"]').click();
        // Click .c-status-poll-panel

        // expect default status to be 'GO'
        await expect(await page.locator('.c-status-poll-panel')).toBeVisible();

        // parse the table row values
        // await page.locator('//table/tbody/tr[1]/td[1]').innerText();
    });

    test('clear poll button removes poll responses', () => {

    });

});
