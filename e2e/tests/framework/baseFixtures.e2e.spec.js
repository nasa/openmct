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
This test suite is dedicated to testing our use of the playwright framework as it
relates to how we've extended it (i.e. ./e2e/baseFixtures.js) and assumptions made in our dev environment
(`npm start` and ./e2e/webpack-dev-middleware.js)
*/

const { test } = require('../../baseFixtures.js');

test.describe('baseFixtures tests', () => {
  test('Verify that tests fail if console.error is thrown', async ({ page }) => {
    test.fail();
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Verify that ../fixtures.js detects console log errors
    await Promise.all([
      page.evaluate(() => console.error('This should result in a failure')),
      page.waitForEvent('console') // always wait for the event to happen while triggering it!
    ]);
  });
  test('Verify that tests pass if console.warn is thrown', async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Verify that ../fixtures.js detects console log errors
    await Promise.all([
      page.evaluate(() => console.warn('This should result in a pass')),
      page.waitForEvent('console') // always wait for the event to happen while triggering it!
    ]);
  });
});
