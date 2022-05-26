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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks.
*/

const { test } = require('../../../fixtures');
const { expect } = require('@playwright/test');

test.describe('Notebook CRUD Operations', () => {
    test.fixme('Can create a Notebook Object', async ({ page }) => {
        //Create domain object
        //Newly created notebook should have one Section and one page, 'Unnamed Section'/'Unnamed Page'
    });
    test.fixme('Can update a Notebook Object', async ({ page }) => {
        //Create domain object
        //Save Domain Object
        //Verify that the newly created domain object can be exported as JSON from the 3 dot menu
    });
    test.fixme('Can view a perviously created Notebook Object', async ({ page }) => {
        // Create 2 objects with hierarchy
        // Export as JSON
        // Verify Hiearchy
    });
    test.fixme('Can Delete a Notebook Object', async ({ page }) => {
        // Other than non-persistible objects
    });
});

test.describe('Default Notebook', () => {
    // General Default Notebook statements
    // ## Useful commands:
    // 1.  - To check default notebook:
    //     `JSON.parse(localStorage.getItem('notebook-storage'));`
    // 1.  - Clear default notebook:
    //     `localStorage.setItem('notebook-storage', null);`
    test.fixme('A newly created Notebook is automatically set as the default notebook if no other notebooks exist', async ({ page }) => {
        //Create new notebook
        //Verify Default Notebook Characteristics
    });
    test.fixme('A newly created Notebook is automatically set as the default notebook if at least one other notebook exists', async ({ page }) => {
        //Create new notebook A
        //Create second notebook B
        //Verify Non-Default Notebook A Characteristics
        //Verify Default Notebook B Characteristics
    });
    test.fixme('If a default notebook is deleted, the second most recent notebook becomes the default', async ({ page }) => {
        //Create new notebook A
        //Create second notebook B
        //Delete Notebook B
        //Verify Default Notebook A Characteristics
    });
});

test.describe('Notebook section tests', () => {
    //The following test cases are associated with Notebook Sections
    test.fixme('New sections are automatically named Unnamed Section with Unnamed Page', async ({ page }) => {
        //Create new notebook A
        //Add section
        //Verify new section and new page details
    });
    test.fixme('Section selection operations and associated behavior', async ({ page }) => {
        //Create new notebook A
        //Add Sections until 6 total with no default section/page
        //Select 3rd section
        //Delete 4th section
        //3rd section is still selected
        //Delete 3rd section
        //1st section is selected
        //Set 3rd section as default
        //Delete 2nd section
        //3rd section is still default
        //Delete 3rd section
        //1st is selected and there is no default notebook
    });
});

test.describe('Notebook page tests', () => {
    //The following test cases are associated with Notebook Pages
    test.fixme('Page selection operations and associated behavior', async ({ page }) => {
        //Create new notebook A
        //Delete existing Page
        //New 'Unnamed Page' automatically created
        //Create 6 total Pages without a default page
        //Select 3rd
        //Delete 3rd
        //First is now selected
        //Set 3rd as default
        //Select 2nd page
        //Delete 2nd page
        //3rd (default) is now selected
        //Set 3rd as default page
        //Select 3rd (default) page
        //Delete 3rd page
        //First is now selected and there is no default notebook
    });
});

//Notebook Search tests
//
// ## III. Entries:
// 1.  - Add new entry into page should create entry and focus on it
// 1.  - Drag and drop any telmetry object on 'drop object'
//     - new entry gets created with telemtry object
// 1.  - Add new entry into page
//     - drop any telmetry object on this entry
//     - telmetry object appears inside this entry
// 1.  - Add new entry into page, enter text
//     - navigate away and return
//     - edit entry text
//     - navigate away and return back
//     - confirm text is correct
// 1.  - delete previously created entry

// ## IV: Snapshot Menu:
// 1.  - There should be no default notebook
//     - Clear default notebook if exists using `localStorage.setItem('notebook-storage', null);`
//     - refresh page
//     - Click on 'Notebook Snaphot Menu'
//     - Following popup option should be there
//         1. save to Notebook Snapshots
// 1.  - Check for default notebook if there is one, else add some entry into one of notebook to make it default
//     - Click on 'Notebook Snaphot Menu'
//     - Following popup options should be there
//         1. save to Default Notebook
//         1. save to Notebook Snapshots
// 1.  - Select any telemetry object eg: SWG
//     - From 'Notebook Snaphot Menu' click on 'save to Default Notebook'
//     - Navigate to default notebook - section - page and verify that SWG snaphot has been added with correct details

// ## V: Snapshot container:
// 1.  - Select any telemetry object eg: SWG
//     - Click on 'Notebook Snaphot Menu'
//     - from popup options click on 'save to Notebook Snapshots'
//     - Snapshots indicator should blink, click on it to view snapshots
//     - drag and drop snapshot on droppable area for new enrty
//     - this should create a new entry with given snaphot has been added to it
// 1.  - Select any telemetry object eg: SWG
//     - Click on 'Notebook Snaphot Menu'
//     - from popup options click on 'save to Notebook Snapshots'
//     - Snapshots indicator should blink, click on it to view snapshots
//     - goto any notebook with pre exisintg entry (if not create new entry)
//     - drag and drop snapshot on exisintg entry
//     - this should add a given snaphot inside that entry

// ## VI: Embeds:
// 1.  - Add SWG using snapshot to notebook
//     - Go to that entry
//     - click on thumbnail image
//     - should open image with PNG, JPG and Annotate buttons
//     - verify they all work as intended
// 1.  - Add SWG using snapshot to notebook
//     - note down start and end time on time conductor and Fixed Timestamp/Local Clock
//     - Go to that entry
//     - change start and end time on time conductor if Local Clock
//     - click on embed Name/Text
//     - should take to that object
//     - also verify that start and end time on time conductor (also should automatically switch to Fixed timestamp)*/