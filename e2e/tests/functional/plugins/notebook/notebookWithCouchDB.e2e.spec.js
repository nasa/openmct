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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks with CouchDB.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Notebook Tests with CouchDB @couchdb', () => {
    let testNotebook;
    test.beforeEach(async ({ page }) => {
        //Navigate to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create Notebook
        testNotebook = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "TestNotebook"
        });
    });

    test('Inspect Notebook Entry Network Requests', async ({ page }) => {
        await page.getByText('Annotations').click();
        // Expand sidebar
        await page.locator('.c-notebook__toggle-nav-button').click();

        // Collect all request events to count and assert after notebook action
        let addingNotebookElementsRequests = [];
        page.on('request', (request) => addingNotebookElementsRequests.push(request));

        let [notebookUrlRequest, allDocsRequest] = await Promise.all([
            // Waits for the next request with the specified url
            page.waitForRequest(`**/openmct/${testNotebook.uuid}`),
            page.waitForRequest('**/openmct/_all_docs?include_docs=true'),
            // Triggers the request
            page.click('[aria-label="Add Page"]'),
            // Ensures that there are no other network requests
            page.waitForLoadState('networkidle')
        ]);
        // Assert that only two requests are made
        // Network Requests are:
        // 1) The actual POST to create the page
        // 2) The shared worker event from 👆 request
        expect(addingNotebookElementsRequests.length).toBe(2);

        // Assert on request object
        expect(notebookUrlRequest.postDataJSON().metadata.name).toBe('TestNotebook');
        expect(notebookUrlRequest.postDataJSON().model.persisted).toBeGreaterThanOrEqual(notebookUrlRequest.postDataJSON().model.modified);
        expect(allDocsRequest.postDataJSON().keys).toContain(testNotebook.uuid);

        // Add an entry
        // Network Requests are:
        // 1) The actual POST to create the entry
        // 2) The shared worker event from 👆 POST request
        addingNotebookElementsRequests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"]').click();
        await page.locator('[aria-label="Notebook Entry Input"]').fill(`First Entry`);
        await page.locator('[aria-label="Notebook Entry Input"]').press('Enter');
        await page.waitForLoadState('networkidle');
        expect(addingNotebookElementsRequests.length).toBeLessThanOrEqual(2);

        // Add some tags
        // Network Requests are for each tag creation are:
        // 1) Getting the original path of the parent object
        // 2) Getting the original path of the grandparent object (recursive call)
        // 3) Creating the annotation/tag object
        // 4) The shared worker event from 👆 POST request
        // 5) Mutate notebook domain object's annotationModified property
        // 6) The shared worker event from 👆 POST request
        // 7) Notebooks fetching new annotations due to annotationModified changed
        // 8) The update of the notebook domain's object's modified property
        // 9) The shared worker event from 👆 POST request
        // 10) Entry is timestamped
        // 11) The shared worker event from 👆 POST request

        addingNotebookElementsRequests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Driving")');
        page.waitForLoadState('networkidle');
        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(11);

        addingNotebookElementsRequests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Drilling")');
        page.waitForLoadState('networkidle');
        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(11);

        addingNotebookElementsRequests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Science")');
        page.waitForLoadState('networkidle');
        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(11);

        // Delete all the tags
        // Network requests are:
        // 1) Send POST to mutate _delete property to true on annotation with tag
        // 2) The shared worker event from 👆 POST request
        // 3) Timestamp update on entry
        // 4) The shared worker event from 👆 POST request
        // This happens for 3 tags so 12 requests
        addingNotebookElementsRequests = [];
        await page.hover('[aria-label="Tag"]:has-text("Driving")');
        await page.locator('[aria-label="Remove tag Driving"]').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Driving")', {state: 'hidden'});
        await page.hover('[aria-label="Tag"]:has-text("Drilling")');
        await page.locator('[aria-label="Remove tag Drilling"]').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Drilling")', {state: 'hidden'});
        page.hover('[aria-label="Tag"]:has-text("Science")');
        await page.locator('[aria-label="Remove tag Science"]').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Science")', {state: 'hidden'});
        page.waitForLoadState('networkidle');
        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(12);

        // Add two more pages
        await page.click('[aria-label="Add Page"]');
        await page.click('[aria-label="Add Page"]');

        // Add three entries
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"]').click();
        await page.locator('[aria-label="Notebook Entry Input"]').fill(`First Entry`);
        await page.locator('[aria-label="Notebook Entry Input"]').press('Enter');

        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=1').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=1').fill(`Second Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=1').press('Enter');

        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=2').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=2').fill(`Third Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=2').press('Enter');

        // Add three tags
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Science")');

        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Drilling")');

        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Driving")');
        page.waitForLoadState('networkidle');

        // Add a fourth entry
        // Network requests are:
        // 1) Send POST to add new entry
        // 2) The shared worker event from 👆 POST request
        // 3) Timestamp update on entry
        // 4) The shared worker event from 👆 POST request
        addingNotebookElementsRequests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=3').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=3').fill(`Fourth Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=3').press('Enter');
        page.waitForLoadState('networkidle');

        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(4);

        // Add a fifth entry
        // Network requests are:
        // 1) Send POST to add new entry
        // 2) The shared worker event from 👆 POST request
        // 3) Timestamp update on entry
        // 4) The shared worker event from 👆 POST request
        addingNotebookElementsRequests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=4').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=4').fill(`Fifth Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=4').press('Enter');
        page.waitForLoadState('networkidle');

        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(4);

        // Add a sixth entry
        // 1) Send POST to add new entry
        // 2) The shared worker event from 👆 POST request
        // 3) Timestamp update on entry
        // 4) The shared worker event from 👆 POST request
        addingNotebookElementsRequests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').fill(`Sixth Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').press('Enter');
        page.waitForLoadState('networkidle');

        expect(filterNonFetchRequests(addingNotebookElementsRequests).length).toBeLessThanOrEqual(4);
    });

    test('Search tests', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/akhenry/openmct-yamcs/issues/69'
        });
        await page.getByText('Annotations').click();
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"]').click();
        await page.locator('[aria-label="Notebook Entry Input"]').fill(`First Entry`);
        await page.locator('[aria-label="Notebook Entry Input"]').press('Enter');

        // Add three tags
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Science")');

        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Drilling")');

        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();
        await page.waitForSelector('[aria-label="Tag"]:has-text("Driving")');

        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Sc');
        await expect(page.locator('[aria-label="Search Result"]').first()).toContainText("Science");
        await expect(page.locator('[aria-label="Search Result"]').first()).not.toContainText("Driving");

        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
        await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').fill('Xq');
        await expect(page.locator('text=No results found')).toBeVisible();
    });
});

// Try to reduce indeterminism of browser requests by only returning fetch requests.
// Filter out preflight CORS, fetching stylesheets, page icons, etc. that can occur during tests
function filterNonFetchRequests(requests) {
    return requests.filter(request => {
        return (request.resourceType() === 'fetch');
    });
}
