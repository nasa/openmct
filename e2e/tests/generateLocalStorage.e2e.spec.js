/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
This test suite is used for generating localStorage artifacts for visual and performance
tests. This must be generated against app.js
*/

const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('Generate domainObjects and store localstorage as localstorage.json', async ({ page }) => {

    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click :nth-match(:text("Folder"), 2)
    await page.click(':nth-match(:text("Folder"), 2)');

    // Fill text=Properties Title Notes >> input[type="text"]
    await page.fill('text=Properties Title Notes >> input[type="text"]', 'All DomainObjects');
    //await page.fill('input[type="text"]', 'All DomainObjects');

    // Click text=OK
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/07fa1bd8-1e7d-4b74-bc40-f561f8c00535?tc.mode=fixed&tc.startBound=1640392618958&tc.endBound=1640394418958&tc.timeSystem=utc&view=grid' }*/),
        page.click('text=OK')
    ]);

    // Click button:has-text("Create")
    await page.click('button:has-text("Create")');

    // Click text=Timer
    await page.click('text=Timer');

    // Click text=Save In My Items All DomainObjects >> input[type="search"]
    await page.click('text=Save In My Items All DomainObjects >> input[type="search"]');

    // Fill text=Save In My Items All DomainObjects >> input[type="search"]
    await page.fill('text=Save In My Items All DomainObjects >> input[type="search"]', 'All DomainObjects');

    // Click text=OK
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/07fa1bd8-1e7d-4b74-bc40-f561f8c00535/810cc308-76d6-4e64-ab85-cb543c655698?tc.mode=fixed&tc.startBound=1640392618958&tc.endBound=1640394418958&tc.timeSystem=utc&view=timer.view' }*/),
        page.click('text=OK')
    ]);

    // Click button:has-text("Create")
    await page.click('button:has-text("Create")');

    // Click text=Notebook
    await page.click('text=Notebook');

    // Fill text=Properties Title Notes Entry Sorting Newest First Oldest First Note book Type Se >> input[type="text"]
    await page.fill('text=Properties Title Notes Entry Sorting Newest First Oldest First Note book Type Se >> input[type="text"]', 'Notebook');

    // Click text=Save In My Items All DomainObjects Unnamed Timer >> input[type="search"]
    //await page.click('text=Save In My Items All DomainObjects Unnamed Timer >> input[type="search"]');

    // Fill text=Save In My Items All DomainObjects Unnamed Timer >> input[type="search"]
    await page.fill('text=Save In My Items All DomainObjects Unnamed Timer >> input[type="search"]', 'All DomainObjects');

    // Click ul:nth-child(3) .c-tree__item-h .c-tree__item
    await page.click('ul:nth-child(3) .c-tree__item-h .c-tree__item');

    // Click button:has-text("OK")
    await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/ROOT/mine/07fa1bd8-1e7d-4b74-bc40-f561f8c00535/6b10425e-2d7f-4f65-83de-35317fbc2493?tc.mode=fixed&tc.startBound=1640392618958&tc.endBound=1640394418958&tc.timeSystem=utc&view=notebook-vue&pageId=9ad5b4ea-8dec-4cc0-b303-43a4f50ac7fa&sectionId=d298175b-d715-426e-8036-b87056e14525' }*/),
        page.click('button:has-text("OK")')
    ]);

    await page.pause();

    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    fs.writeFileSync('e2e/localstorage.json', localStorage);
});

test('Load localstorage.json and verify contents', async ({ page }) => {

    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    const localStorage = fs.readFileSync('e2e/localstorage.json', 'utf8')

    const deserializedStorage = JSON.parse(localStorage)
    await page.evaluate(deserializedStorage => {
        for (const key in deserializedStorage) {
            localStorage.setItem(key, deserializedStorage[key]);
        }
    }, deserializedStorage);

    await page.reload();
    
    // Expand Default Folder
    await page.click('a:has-text("All DomainObjects Folder")');

    await expect(page.locator('a:has-text("Unnamed Timer Timer")')).toBeEnabled();
    await expect(page.locator('a:has-text("Notebook Notebook")')).toBeEnabled();

});
