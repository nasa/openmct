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

// FIXME: Remove this eslint exception once tests are implemented
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('../../../../baseFixtures');

test.describe('Remote Clock', () => {
  // eslint-disable-next-line require-await
  test.fixme('blocks historical requests until first tick is received', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5221'
    });
    // addInitScript to with remote clock
    // Switch time conductor mode to 'remote clock'
    // Navigate to telemetry
    // Verify that the plot renders historical data within the correct bounds
    // Refresh the page
    // Verify again that the plot renders historical data within the correct bounds
  });
});
