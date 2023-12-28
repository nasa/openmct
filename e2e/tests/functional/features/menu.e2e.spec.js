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
This test suite is dedicated to tests which verify persistability checks
*/

const { test, expect } = require('../../baseFixtures.js');

const path = require('path');

test.describe('Persistence operations @addInit', () => {
  // add non persistable root item
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: path.join(__dirname, '../../helper', 'addNoneditableObject.js')
    });
  });

  test('Non-persistable objects should not show persistence related actions', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.locator('text=Persistence Testing').first().click({
      button: 'right'
    });

    const menuOptions = page.locator('.c-menu li');

    await expect.soft(menuOptions).toContainText(['Open In New Tab', 'View', 'Create Link']);
    await expect(menuOptions).not.toContainText([
      'Move',
      'Duplicate',
      'Remove',
      'Add New Folder',
      'Edit Properties...',
      'Export as JSON',
      'Import from JSON'
    ]);
  });
});
