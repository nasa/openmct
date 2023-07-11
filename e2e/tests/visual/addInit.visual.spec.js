/* eslint-disable no-undef */
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
/* global __dirname */
/*
Collection of Visual Tests set to run with modified init scripts to inject plugins not otherwise available in the default contexts.

These should only use functional expect statements to verify assumptions about the state
in a test and not for functional verification of correctness. Visual tests are not supposed
to "fail" on assertions. Instead, they should be used to detect changes between builds or branches.

Note: Larger testsuite sizes are OK due to the setup time associated with these tests.
*/

// eslint-disable-next-line no-unused-vars
const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const percySnapshot = require('@percy/playwright');
const path = require('path');

const CUSTOM_NAME = 'CUSTOM_NAME';

test.describe('Visual - addInit', () => {
  test.use({
    clockOptions: {
      now: 0, //Set browser clock to UNIX Epoch
      shouldAdvanceTime: false //Don't advance the clock
    }
  });

  test('Restricted Notebook is visually correct @addInit @unstable', async ({ page, theme }) => {
    await page.addInitScript({
      path: path.join(__dirname, '../../helper', './addInitRestrictedNotebook.js')
    });
    //Go to baseURL
    await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });

    await createDomainObjectWithDefaults(page, { type: CUSTOM_NAME });

    // Take a snapshot of the newly created CUSTOM_NAME notebook
    await percySnapshot(page, `Restricted Notebook with CUSTOM_NAME (theme: '${theme}')`);
  });
});
