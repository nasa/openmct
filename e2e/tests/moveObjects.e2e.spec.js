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
This test suite is dedicated to tests which verify the basic operations surrounding moving objects.
*/

const { test, expect } = require('@playwright/test');

test.describe('Move item tests', () => {
    test.fixme('Create a basic object and verify that it can be moved to another Folder', async ({ page }) => {
        //Create and save Folder
        //Create and save Domain Object
        //Verify that the newly created domain object can be moved to Folder from Step 1.
        //Verify that newly moved object appears in the correct point in Tree
        //Verify that newly moved object appears correctly in Inspector panel
    });
    test.fixme('Create a basic object and verify that it cannot be moved to object without Composition Provider', async ({ page }) => {
        //Create and save Telemetry Object
        //Create and save Domain Object
        //Verify that the newly created domain object cannot be moved to Telemetry Object from step 1.
    });
});
