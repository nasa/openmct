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

const { test, expect } = require('../../../../pluginFixtures');
const { expandTreePaneItemByName, createDomainObjectWithDefaults } = require('../../../../appActions');
const nbUtils = require('../../../../helper/notebookUtils');

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
    test.beforeEach(async ({ page }) => {
        //Navigate to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create Notebook
        await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Test Notebook"
        });
    });
    test('Default and new sections are automatically named Unnamed Section with Unnamed Page', async ({ page }) => {
        // Check that the default section and page are created and the name matches the defaults
        const defaultSectionName = await page.locator('.c-notebook__sections .c-list__item__name').textContent();
        expect(defaultSectionName).toBe('Unnamed Section');
        const defaultPageName = await page.locator('.c-notebook__pages .c-list__item__name').textContent();
        expect(defaultPageName).toBe('Unnamed Page');

        // Expand sidebar and add a section
        await page.locator('.c-notebook__toggle-nav-button').click();
        await page.locator('.js-sidebar-sections .c-icon-button.icon-plus').click();

        // Check that new section and page within the new section match the defaults
        const newSectionName = await page.locator('.c-notebook__sections .c-list__item__name').nth(1).textContent();
        expect(newSectionName).toBe('Unnamed Section');
        const newPageName = await page.locator('.c-notebook__pages .c-list__item__name').textContent();
        expect(newPageName).toBe('Unnamed Page');
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
    test.fixme('Section rename operations', async ({ page }) => {
        // Create a new notebook
        // Add a section
        // Rename the section but do not confirm
        // Keyboard press 'Escape'
        // Verify that the section name reverts to the default name
        // Rename the section but do not confirm
        // Keyboard press 'Enter'
        // Verify that the section name is updated
        // Rename the section to "" (empty string)
        // Keyboard press 'Enter' to confirm
        // Verify that the section name reverts to the default name
        // Rename the section to something long that overflows the text box
        // Verify that the section name is not truncated while input is active
        // Confirm the section name edit
        // Verify that the section name is truncated now that input is not active
    });
});

test.describe('Notebook page tests', () => {
    //The following test cases are associated with Notebook Pages
    test.beforeEach(async ({ page }) => {
        //Navigate to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create Notebook
        await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Test Notebook"
        });
    });
    //Test will need to be implemented after a refactor in #5713
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip('Delete page popup is removed properly on clicking dropdown again', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5713'
        });
        // Expand sidebar and add a second page
        await page.locator('.c-notebook__toggle-nav-button').click();
        await page.locator('text=Page Add >> button').click();

        // Click on the 2nd page dropdown button and expect the Delete Page option to appear
        await page.locator('button[title="Open context menu"]').nth(2).click();
        await expect(page.locator('text=Delete Page')).toBeEnabled();
        // Clicking on the same page a second time causes the same Delete Page option to recreate
        await page.locator('button[title="Open context menu"]').nth(2).click();
        await expect(page.locator('text=Delete Page')).toBeEnabled();
        // Clicking on the first page causes the first delete button to detach and recreate on the first page
        await page.locator('button[title="Open context menu"]').nth(1).click();
        const numOfDeletePagePopups = await page.locator('li[title="Delete Page"]').count();
        expect(numOfDeletePagePopups).toBe(1);
    });
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
    test.fixme('Page rename operations', async ({ page }) => {
        // Create a new notebook
        // Add a page
        // Rename the page but do not confirm
        // Keyboard press 'Escape'
        // Verify that the page name reverts to the default name
        // Rename the page but do not confirm
        // Keyboard press 'Enter'
        // Verify that the page name is updated
        // Rename the page to "" (empty string)
        // Keyboard press 'Enter' to confirm
        // Verify that the page name reverts to the default name
        // Rename the page to something long that overflows the text box
        // Verify that the page name is not truncated while input is active
        // Confirm the page name edit
        // Verify that the page name is truncated now that input is not active
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
    test('When an object is dropped into a notebook, a new entry is created and it should be focused @unstable', async ({ page }) => {
        await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });

        // Create Notebook
        const notebook = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Embed Test Notebook"
        });
        // Create Overlay Plot
        await createDomainObjectWithDefaults(page, {
            type: 'Overlay Plot',
            name: "Dropped Overlay Plot"
        });

        await expandTreePaneItemByName(page, 'My Items');

        await page.goto(notebook.url);
        await page.dragAndDrop('role=treeitem[name=/Dropped Overlay Plot/]', '.c-notebook__drag-area');

        const embed = page.locator('.c-ne__embed__link');
        const embedName = await embed.textContent();

        await expect(embed).toHaveClass(/icon-plot-overlay/);
        expect(embedName).toBe('Dropped Overlay Plot');
    });
    test('When an object is dropped into a notebooks existing entry, it should be focused @unstable', async ({ page }) => {
        await page.goto('./#/browse/mine', { waitUntil: 'networkidle' });

        // Create Notebook
        const notebook = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Embed Test Notebook"
        });
        // Create Overlay Plot
        await createDomainObjectWithDefaults(page, {
            type: 'Overlay Plot',
            name: "Dropped Overlay Plot"
        });

        await expandTreePaneItemByName(page, 'My Items');

        await page.goto(notebook.url);

        await nbUtils.enterTextEntry(page, 'Entry to drop into');
        await page.dragAndDrop('role=treeitem[name=/Dropped Overlay Plot/]', 'text=Entry to drop into');

        const existingEntry = page.locator('.c-ne__content', { has: page.locator('text="Entry to drop into"') });
        const embed = existingEntry.locator('.c-ne__embed__link');
        const embedName = await embed.textContent();

        await expect(embed).toHaveClass(/icon-plot-overlay/);
        expect(embedName).toBe('Dropped Overlay Plot');
    });
    test.fixme('new entries persist through navigation events without save', async ({ page }) => {});
    test.fixme('previous and new entries can be deleted', async ({ page }) => {});
});
