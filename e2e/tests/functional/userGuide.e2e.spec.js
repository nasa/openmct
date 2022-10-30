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

/*
This test suite is dedicated to tests which verify link to the User's Guide.
*/

const { test, expect } = require('../../baseFixtures.js');

test.describe('User Docs tests',
    () => {
        test('Verify the Link to User\'s Guide in About Modal', async ({page}) => {
            // Go to baseURL
            await page.goto('./', {waitUntil: 'networkidle'});

            // Click About button
            await page.click('.l-shell__app-logo');

            // Verify that clicking on the Open MCT User's Guide opens up another tab on licenses url
            const [page2] = await Promise.all([
                page.waitForEvent('popup'),
                page.locator('text=Click here for the Open MCT User\'s Guide in PDF format.').click()
            ]);
            await page2.waitForLoadState('networkidle'); //Avoids timing issues with juggler/firefox
            expect(page2.waitForURL('**/Open_MCT_Users_Guide.pdf')).toBeTruthy();
        });
    });
