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
This test suite is dedicated to tests which verify the basic operations surrounding the example event generator.
*/

const { test, expect } = require('../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../appActions');

test.describe('Example Event Generator CRUD Operations', () => {
  test('Can create a Test Event Generator and it results in the table View', async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Create a name for the object
    const newObjectName = 'Test Event Generator';

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      name: newObjectName
    });

    //Assertions against newly created object which define standard behavior
    await expect(page.waitForURL(/.*&view=table/)).toBeTruthy();
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(newObjectName);
  });
});

test.describe('Example Event Generator Telemetry Event Verficiation', () => {
  test.fixme('telemetry is coming in for test event', async ({ page }) => {
    // Go to object created in step one
    // Verify the telemetry table is filled with > 1 row
  });
  test.fixme('telemetry is sorted by time ascending', async ({ page }) => {
    // Go to object created in step one
    // Verify the telemetry table has a class with "is-sorting asc"
  });
});
