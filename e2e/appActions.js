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

/**
 * The fixtures in this file are to be used to consolidate common actions performed by the
 * various test suites. The goal is only to avoid duplication of code across test suites and not to abstract
 * away the underlying functionality of the application. For more about the App Action pattern, see /e2e/README.md)
 *
 * For example, if two functions are nearly identical in
 * timer.e2e.spec.js and notebook.e2e.spec.js, that function should be generalized and moved into this file.
 */

/**
 * This common function creates a `domainObject` with default options. It is the preferred way of creating objects
 * in the e2e suite when uninterested in properties of the objects themselves.
 * @param {import('@playwright/test').Page} page
 * @param {string} type
 * @param {string | undefined} name
 */
async function createDomainObjectWithDefaults(page, type, name) {
    // Navigate to focus the 'My Items' folder, and hide the object tree
    // This is necessary so that subsequent objects can be created without a parent
    // TODO: Ideally this would navigate to a common `e2e` folder
    await page.goto('./#/browse/mine?hideTree=true');
    await page.waitForLoadState('networkidle');
    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object specified by 'type'
    await page.click(`li:text("${type}")`);

    // Modify the name input field of the domain object to accept 'name'
    if (name) {
        const nameInput = page.locator('input[type="text"]').nth(2);
        await nameInput.fill("");
        await nameInput.fill(name);
    }

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    return name || `Unnamed ${type}`;
}

/**
* Open the given `domainObject`'s context menu from the object tree.
* Expands the 'My Items' folder if it is not already expanded.
* @param {import('@playwright/test').Page} page
* @param {string} myItemsFolderName the name of the "My Items" folder
* @param {string} domainObjectName the display name of the `domainObject`
*/
async function openObjectTreeContextMenu(page, myItemsFolderName, domainObjectName) {
    const myItemsFolder = page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3);
    const className = await myItemsFolder.getAttribute('class');
    if (!className.includes('c-disclosure-triangle--expanded')) {
        await myItemsFolder.click();
    }

    await page.locator(`a:has-text("${domainObjectName}")`).click({
        button: 'right'
    });
}

// eslint-disable-next-line no-undef
module.exports = {
    createDomainObjectWithDefaults,
    openObjectTreeContextMenu
};
