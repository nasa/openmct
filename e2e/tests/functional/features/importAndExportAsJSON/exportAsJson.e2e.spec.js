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
This test suite is dedicated to tests which verify the basic operations surrounding exportAsJSON.
*/

// FIXME: Remove this eslint exception once tests are implemented
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('../../../../baseFixtures');

test.describe('ExportAsJSON', () => {
  test.fixme(
    'Create a basic object and verify that it can be exported as JSON from Tree',
    async ({ page }) => {
      //Create domain object
      //Save Domain Object
      //Verify that the newly created domain object can be exported as JSON from the Tree
    }
  );
  test.fixme(
    'Create a basic object and verify that it can be exported as JSON from 3 dot menu',
    async ({ page }) => {
      //Create domain object
      //Save Domain Object
      //Verify that the newly created domain object can be exported as JSON from the 3 dot menu
    }
  );
  test.fixme('Verify that a nested Object can be exported as JSON', async ({ page }) => {
    // Create 2 objects with hierarchy
    // Export as JSON
    // Verify Hierarchy
  });
  test.fixme(
    'Verify that the ExportAsJSON dropdown does not appear for the item X',
    async ({ page }) => {
      // Other than non-persistable objects
    }
  );
});
