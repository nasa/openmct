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
 * This test suite template is to be used when verifying Test Data files found in /e2e/test-data/
 */

const { test } = require('../../baseFixtures');

test.describe('recycled_local_storage @localStorage', () => {
  //We may want to do some additional level of verification of this file. For now, we just verify that it exists and can be used in a test suite.
  test.use({ storageState: './e2e/test-data/recycled_local_storage.json' });
  test('Can use recycled_local_storage file', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
});
