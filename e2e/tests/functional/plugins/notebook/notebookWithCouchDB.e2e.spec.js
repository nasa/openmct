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
This test suite is dedicated to tests which verify the basic operations surrounding Notebooks with CouchDB.
*/

const { test, expect } = require('../../../../baseFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Notebook Network Request Inspection @couchdb', () => {
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
        // Expand sidebar
        await page.locator('.c-notebook__toggle-nav-button').click();

        // Collect all request events to count and assert after notebook action
        let requests = [];
        page.on('request', (request) => requests.push(request));

        let [notebookUrlRequest, allDocsRequest] = await Promise.all([
            // Waits for the next request with the specified url
            page.waitForRequest(`**/openmct/${testNotebook.uuid}`),
            page.waitForRequest('**/openmct/_all_docs?include_docs=true'),
            // Triggers the request
            page.click('text=Page Add >> button'),
            // Ensures that there are no other network requests
            page.waitForLoadState('networkidle')
        ]);
        // Assert that only two requests are made
        expect(requests.length).toBe(2);

        // Assert on request object
        expect(notebookUrlRequest.postDataJSON().metadata.name).toBe('TestNotebook');
        expect(notebookUrlRequest.postDataJSON().model.persisted).toBeGreaterThanOrEqual(notebookUrlRequest.postDataJSON().model.modified);
        expect(allDocsRequest.postDataJSON().keys).toContain(testNotebook.uuid);

        // Add an entry
        requests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"]').click();
        await page.locator('[aria-label="Notebook Entry Input"]').fill(`First Entry`);
        await page.waitForLoadState('networkidle');
        expect(requests.length).toBeLessThanOrEqual(2);

        // Add some tags
        requests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();
        await page.waitForSelector('.c-tag__label:has-text("Driving")');
        page.waitForLoadState('networkidle');
        expect(requests.length).toBeLessThanOrEqual(12);

        requests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
        await page.waitForSelector('.c-tag__label:has-text("Drilling")');
        page.waitForLoadState('networkidle');
        expect(requests.length).toBeLessThanOrEqual(12);

        requests = [];
        await page.hover(`button:has-text("Add Tag")`);
        await page.locator(`button:has-text("Add Tag")`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
        await page.waitForSelector('.c-tag__label:has-text("Science")');
        page.waitForLoadState('networkidle');
        expect(requests.length).toBeLessThanOrEqual(12);

        // Delete all the tags
        requests = [];
        await page.hover('.c-tag__label:has-text("Driving")');
        await page.locator('.c-tag__label:has-text("Driving") ~ .c-completed-tag-deletion').click();
        await page.waitForSelector('.c-tag__label:has-text("Driving")', {state: 'hidden'});
        await page.hover('.c-tag__label:has-text("Drilling")');
        await page.locator('.c-tag__label:has-text("Drilling") ~ .c-completed-tag-deletion').click();
        await page.waitForSelector('.c-tag__label:has-text("Drilling")', {state: 'hidden'});
        page.hover('.c-tag__label:has-text("Science")');
        await page.locator('.c-tag__label:has-text("Science") ~ .c-completed-tag-deletion').click();
        await page.waitForSelector('.c-tag__label:has-text("Science")', {state: 'hidden'});
        page.waitForLoadState('networkidle');
        expect(requests.length).toBeLessThanOrEqual(10);

        // Add two more pages
        await page.click('text=Page Add >> button');
        await page.click('text=Page Add >> button');

        // Add three entries
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"]').click();
        await page.locator('[aria-label="Notebook Entry Input"]').fill(`First Entry`);

        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=1').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=1').fill(`Second Entry`);

        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=2').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=2').fill(`Third Entry`);

        // Add three tags
        await page.hover(`button:has-text("Add Tag") >> nth=2`);
        await page.locator(`button:has-text("Add Tag") >> nth=2`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Science').click();
        await page.waitForSelector('.c-tag__label:has-text("Science")');

        await page.hover(`button:has-text("Add Tag") >> nth=2`);
        await page.locator(`button:has-text("Add Tag") >> nth=2`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
        await page.waitForSelector('.c-tag__label:has-text("Drilling")');

        await page.hover(`button:has-text("Add Tag") >> nth=2`);
        await page.locator(`button:has-text("Add Tag") >> nth=2`).click();
        await page.locator('[placeholder="Type to select tag"]').click();
        await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();
        await page.waitForSelector('.c-tag__label:has-text("Driving")');
        page.waitForLoadState('networkidle');

        // Add a fourth entry
        requests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=3').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=3').fill(`Fourth Entry`);
        page.waitForLoadState('networkidle');

        expect(requests.length).toBeLessThanOrEqual(5);

        // Add a fifth entry
        requests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=4').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=4').fill(`Fifth Entry`);
        page.waitForLoadState('networkidle');

        expect(requests.length).toBeLessThanOrEqual(5);

        // Add a sixth entry
        requests = [];
        await page.locator('text=To start a new entry, click here or drag and drop any object').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').click();
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').fill(`Sixth Entry`);
        await page.locator('[aria-label="Notebook Entry Input"] >> nth=5').press('Enter');
        page.waitForLoadState('networkidle');

        expect(requests.length).toBeLessThanOrEqual(6);
    });
});
