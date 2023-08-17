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
This test suite is dedicated to tests which verify the basic operations surrounding importAsJSON.
*/

// FIXME: Remove this eslint exception once tests are implemented
// eslint-disable-next-line no-unused-vars
const { test, expect } = require('../../../../baseFixtures');

test.describe('ExportAsJSON', () => {
  test.fixme('Verify that domain object can be importAsJSON from Tree', async ({ page }) => {
    //Verify that an testdata JSON file can be imported from Tree
    //Verify correctness of imported domain object
  });
  test.fixme(
    'Verify that domain object can be importAsJSON from 3 dot menu on folder',
    async ({ page }) => {
      //Verify that an testdata JSON file can be imported from 3 dot menu on folder domain object
      //Verify correctness of imported domain object
    }
  );
  test.fixme('Verify that a nested Objects can be importAsJSON', async ({ page }) => {
    // Testdata with hierarchy
    // ImportAsJSON on Tree
    // Verify Hierarchy
  });
  test.fixme(
    'Verify that the ImportAsJSON dropdown does not appear for the item X',
    async ({ page }) => {
      // Other than non-persistable objects
    }
  );
});
