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
        const requests = [];
        page.on('request', (rq) => requests.push(rq));

        const [notebookUrlRequest, allDocsRequest] = await Promise.all([
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
    });
});
