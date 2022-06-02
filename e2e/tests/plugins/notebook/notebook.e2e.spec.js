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

test.describe('Notebook CRUD Operations', () => {
    test.fixme('Can create a Notebook Object', async ({ page }) => {
        //Create domain object
        //Newly created notebook should have one Section and one page, 'Unnamed Section'/'Unnamed Page'
    });
    test.fixme('Can update a Notebook Object', async ({ page }) => {});
    test.fixme('Can view a perviously created Notebook Object', async ({ page }) => {});
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

test.describe('Notebook search tests', () => {
    test.fixme('Can search for a single result', async ({ page }) => {});
    test.fixme('Can search for many results', async ({ page }) => {});
    test.fixme('Can search for new and recently modified entries', async ({ page }) => {});
    test.fixme('Can search for section text', async ({ page }) => {});
    test.fixme('Can search for page text', async ({ page }) => {});
    test.fixme('Can search for entry text', async ({ page }) => {});
});

test.describe('Notebook entry tests', () => {
    test.fixme('When a new entry is created, it should be focused', async ({ page }) => {});
    test.fixme('When a telemetry object is dropped into a notebook, a new entry is created and it should be focused', async ({ page }) => {
        // Drag and drop any telmetry object on 'drop object'
        // new entry gets created with telemtry object
    });
    test.fixme('When a telemetry object is dropped into a notebooks existing entry, it should be focused', async ({ page }) => {
        // Drag and drop any telemetry object onto existing entry
        // Entry updated with object and snapshot
    });
    test.fixme('new entries persist through navigation events without save', async ({ page }) => {});
    test.fixme('previous and new entries can be deleted', async ({ page }) => {});
});

test.describe('Snapshot Menu tests', () => {
    test.fixme('When no default notebook is selected, Snapshot Menu dropdown should only have a single option', async ({ page }) => {
        // There should be no default notebook
        // Clear default notebook if exists using `localStorage.setItem('notebook-storage', null);`
        // refresh page
        // Click on 'Notebook Snaphot Menu'
        // 'save to Notebook Snapshots' should be only option there
    });
    test.fixme('When default notebook is updated selected, Snapshot Menu dropdown should list it as the newest option', async ({ page }) => {
        // Create 2a notebooks
        // Set Notebook A as Default
        // Open Snapshot Menu and note that Notebook A is listed
        // Close Snapshot Menu
        // Set Default Notebook to Notebook B
        // Open Snapshot Notebook and note that Notebook B is listed
        // Select Default Notebook Option and verify that Snapshot is added to Notebook B
    });
    test.fixme('Can add Snapshots via Snapshot Menu and details are correct', async ({ page }) => {
        //Note this should be a visual test, too
        // Create Telemetry object
        // Create A notebook with many pages and sections.
        // Set page and section defaults to be between first and last of many. i.e. 3 of 5
        // Navigate to Telemetry object
        // Select Default Notebook Option and verify that Snapshot is added to Notebook A
        // Verify Snapshot Details appear correctly
    });
    test.fixme('Snapshots adjust time conductor', async ({ page }) => {
        // Create Telemetry object
        // Set Telemetry object's timeconductor to Fixed time with Start and Endtimes are recorded
        // Embed Telemetry object into notebook
        // Set Time Conductor to Local clock
        // Click into embedded telemetry object and verify object appears with same fixed time from record
    });
});

test.describe('Snapshot Container tests', () => {
    test.fixme('5 Snapshots can be added to a container', async ({ page }) => {});
    test.fixme('5 Snapshots can be added to a container and Deleted with Delete All action', async ({ page }) => {});
    test.fixme('A snapshot can be Deleted from Container', async ({ page }) => {});
    test.fixme('A snapshot can be Previewed from Container', async ({ page }) => {});
    test.fixme('A snapshot Container can be open and closed', async ({ page }) => {});
    test.fixme('Can add object to Snapshot container and pull into notebook and create a new entry', async ({ page }) => {
        //Create Notebook
        //Create Telemetry Object
        //From Telemetry Object, use 'save to Notebook Snapshots'
        //Snapshots indicator should blink, click on it to view snapshots
        //Navigate to Notebook
        //Drag and Drop onto droppable area for new entry
        //New Entry created with given snapshot added
        //Snapshot removed from container?
    });
    test.fixme('Can add object to Snapshot container and pull into notebook and existing entry', async ({ page }) => {
        //Create Notebook
        //Create Telemetry Object
        //From Telemetry Object, use 'save to Notebook Snapshots'
        //Snapshots indicator should blink, click on it to view snapshots
        //Navigate to Notebook
        //Drag and Drop into exiting entry
        //Existing Entry updated with given snapshot
        //Snapshot removed from container?
    });
    test.fixme('Verify Embedded options for PNG, JPG, and Annotate work correctly', async ({ page }) => {
        //Add snapshot to container
        //Verify PNG, JPG, and Annotate buttons work correctly
    });
});
