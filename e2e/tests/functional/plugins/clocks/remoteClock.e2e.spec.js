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

// FIXME: Remove this eslint exception once tests are implemented
// eslint-disable-next-line no-unused-vars
const { setRemoteClockMode } = require('../../../../appActions');
const { test, expect } = require('../../../../baseFixtures');
// const path = require('path');

test.describe('Remote Clock', () => {
    // test.use({ storageState: path.join(__dirname, '../../../../test-data/RemoteClockTestData_storage.json')});
    // eslint-disable-next-line no-undef
    test.beforeEach(async ({ page }) => {
        // eslint-disable-next-line no-undef
        // await page.addInitScript({ path: path.join(__dirname, '../../../../helper/', 'addInitRemoteClock.js') });
        await page.goto('./', { waitUntil: 'networkidle' });
    });

    test.fixme('blocks historical requests until first tick is received', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5221'
        });
        // addInitScript to with remote clock
        // Switch time conductor mode to 'remote clock'
        await setRemoteClockMode(page);
        // Navigate to telemetry
        await page.click('role=treeitem[name=/Remote Clock Ticker/]');
        await page.reload();

        // Verify that the plot renders historical data within the correct bounds
        // Refresh the page
        // Verify again that the plot renders historical data within the correct bounds
    });
});
