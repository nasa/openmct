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

// test.fixme('make sure regular notebooks work exactly how they used to');
// test.fixme('make sure you can pass in a name to the Notebook and RestrictedNotebook plugins and that they show in Open MCT');
// test.fixme('create a restricted notebook');
// test.fixme('make sure you can do anything that you can do to a normal notebook (observe "Lock Page" shows when an entry is started)');
// test.fixme('open section/page sidebar');
// test.fixme('Lock a page (verify confirmation)');
// test.fixme('make sure locks show for page and the section that page is in');
// test.fixme('make sure you cannot remove the restricted notebook (right click remove from tree)');
// test.fixme('make sure you can nott edit section titles or section names if locked');
// test.fixme('try to delete/edit an entry from a locked notebook (you should not be able)');
// test.fixme('try to remove an embed from a locked page entry (make sure you can preview though)');
// test.fixme('make sure if the notebook section/page was default, that it was NOT default once locked');
// test.fixme('try to drop an item into a locked page (you should not be able), do the same with a snapshot');
// test.fixme('make sure search works as expected');
// test.fixme('in search, make sure there are locked and unlocked page entries with embeds, make sure you can remove unlocked ones and not remove locked ones');

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Restricted Notebook', () => {

    test.beforeEach(async ({ page }) => {
        // eslint-disable-next-line no-undef
        await page.addInitScript({ path: path.join(__dirname, 'addRestrictedNotebook.js') });

        page.on('console', msg => console.log(msg.text()));

        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.pause();
        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=CUSTOM_NAME');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed CUSTOM_NAME');
    });

    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
        await page.pause();
    });

});
