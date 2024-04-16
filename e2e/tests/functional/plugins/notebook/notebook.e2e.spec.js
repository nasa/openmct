/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { fileURLToPath } from 'url';

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { copy, paste, selectAll } from '../../../../helper/hotkeys/hotkeys.js';
import * as nbUtils from '../../../../helper/notebookUtils.js';
import { expect, streamToString, test } from '../../../../pluginFixtures.js';

const NOTEBOOK_NAME = 'Notebook';

test.describe('Notebook CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('Can create a Notebook Object', async ({ page }) => {
    //Create domain object
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
    //Newly created notebook should have one Section and one page, 'Unnamed Section'/'Unnamed Page'
    const notebookSectionNames = page.locator('.c-notebook__sections .c-list__item__name');
    const notebookPageNames = page.locator('.c-notebook__pages .c-list__item__name');
    await expect(notebookSectionNames).toBeHidden();
    await expect(notebookPageNames).toBeHidden();
    await expect(notebookSectionNames).toHaveText('Unnamed Section');
    await expect(notebookPageNames).toHaveText('Unnamed Page');
  });
  test.fixme('Can update a Notebook Object', async ({ page }) => {});
  test.fixme('Can view a previously created Notebook Object', async ({ page }) => {});
  test.fixme('Can Delete a Notebook Object', async ({ page }) => {
    // Other than non-persistable objects
  });
});

test.describe('Default Notebook', () => {
  // General Default Notebook statements
  // ## Useful commands:
  // 1.  - To check default notebook:
  //     `JSON.parse(localStorage.getItem('notebook-storage'));`
  // 1.  - Clear default notebook:
  //     `localStorage.setItem('notebook-storage', null);`
  test.fixme(
    'A newly created Notebook is automatically set as the default notebook if no other notebooks exist',
    async ({ page }) => {
      //Create new notebook
      //Verify Default Notebook Characteristics
    }
  );
  test.fixme(
    'A newly created Notebook is automatically set as the default notebook if at least one other notebook exists',
    async ({ page }) => {
      //Create new notebook A
      //Create second notebook B
      //Verify Non-Default Notebook A Characteristics
      //Verify Default Notebook B Characteristics
    }
  );
  test.fixme(
    'If a default notebook is deleted, the second most recent notebook becomes the default',
    async ({ page }) => {
      //Create new notebook A
      //Create second notebook B
      //Delete Notebook B
      //Verify Default Notebook A Characteristics
    }
  );
});

test.describe('Notebook section tests', () => {
  //The following test cases are associated with Notebook Sections
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });
  test('Default and new sections are automatically named Unnamed Section with Unnamed Page', async ({
    page
  }) => {
    const notebookSectionNames = page.locator('.c-notebook__sections .c-list__item__name');
    const notebookPageNames = page.locator('.c-notebook__pages .c-list__item__name');
    await expect(notebookSectionNames).toBeHidden();
    await expect(notebookPageNames).toBeHidden();
    // Expand sidebar
    await page.locator('.c-notebook__toggle-nav-button').click();
    // Check that the default section and page are created and the name matches the defaults
    const defaultSectionName = await notebookSectionNames.innerText();
    await expect(notebookSectionNames).toBeVisible();
    expect(defaultSectionName).toBe('Unnamed Section');
    const defaultPageName = await notebookPageNames.innerText();
    await expect(notebookPageNames).toBeVisible();
    expect(defaultPageName).toBe('Unnamed Page');

    // Add a section
    await page.locator('.js-sidebar-sections .c-icon-button.icon-plus').click();

    // Check that new section and page within the new section match the defaults
    const newSectionName = await notebookSectionNames.nth(1).innerText();
    await expect(notebookSectionNames.nth(1)).toBeVisible();
    expect(newSectionName).toBe('Unnamed Section');
    const newPageName = await notebookPageNames.innerText();
    await expect(notebookPageNames).toBeVisible();
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
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });
  //Test will need to be implemented after a refactor in #5713
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('Delete page popup is removed properly on clicking dropdown again', async ({
    page
  }) => {
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

test.describe('Notebook export tests', () => {
  test.beforeEach(async ({ page }) => {
    //Navigate to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create Notebook
    await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });
  test('can export notebook as text', async ({ page }) => {
    await nbUtils.enterTextEntry(page, `Foo bar entry`);
    // Click on 3 Dot Menu
    await page.locator('button[title="More actions"]').click();
    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('menuitem', { name: /Export Notebook as Text/ }).click();

    await page.getByRole('button', { name: 'Save' }).click();
    const download = await downloadPromise;
    const readStream = await download.createReadStream();
    const exportedText = await streamToString(readStream);
    expect(exportedText).toContain('Foo bar entry');
  });
  test.fixme('can export multiple notebook entries as text ', async ({ page }) => {});
  test.fixme('can export all notebook entry metdata', async ({ page }) => {});
  test.fixme('can export all notebook tags', async ({ page }) => {});
  test.fixme('can export all notebook snapshots', async ({ page }) => {});
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
  // Create Notebook with URL Whitelist
  let notebookObject;
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: fileURLToPath(new URL('../../../../helper/addInitNotebookWithUrls.js', import.meta.url))
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    notebookObject = await createDomainObjectWithDefaults(page, {
      type: NOTEBOOK_NAME
    });
  });
  test('When a new entry is created, it should be focused and selected', async ({ page }) => {
    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Click .c-notebook__drag-area
    await page.locator('.c-notebook__drag-area').click();
    await expect(page.getByLabel('Notebook Entry Input')).toBeVisible();
    await expect(page.getByLabel('Notebook Entry', { exact: true })).toHaveClass(/is-selected/);
  });
  test('When an object is dropped into a notebook, a new entry is created and it should be focused @unstable', async ({
    page
  }) => {
    // Create Overlay Plot
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await page
      .getByRole('treeitem', { name: overlayPlot.name })
      .dragTo(page.locator('.c-notebook__drag-area'));

    const embed = page.locator('.c-ne__embed__link');
    const embedName = await embed.innerText();

    await expect(embed).toHaveClass(/icon-plot-overlay/);
    expect(embedName).toBe(overlayPlot.name);
  });
  test('When an object is dropped into a notebooks existing entry, it should be focused @unstable', async ({
    page
  }) => {
    // Create Overlay Plot
    const overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, 'Entry to drop into');
    await page
      .getByRole('treeitem', { name: overlayPlot.name })
      .dragTo(page.locator('text=Entry to drop into'));

    const existingEntry = page.locator('.c-ne__content', {
      has: page.locator('text="Entry to drop into"')
    });
    const embed = existingEntry.locator('.c-ne__embed__link');
    const embedName = await embed.innerText();

    await expect(embed).toHaveClass(/icon-plot-overlay/);
    expect(embedName).toBe(overlayPlot.name);
  });
  test.fixme('new entries persist through navigation events without save', async ({ page }) => {});
  test('previous and new entries can be deleted', async ({ page }) => {
    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    await nbUtils.enterTextEntry(page, 'First Entry');
    await page.hover('text="First Entry"');
    await page.click('button[title="Delete this entry"]');
    await page.getByRole('button', { name: 'Ok' }).filter({ hasText: 'Ok' }).click();
    await expect(page.locator('text="First Entry"')).toBeHidden();
    await nbUtils.enterTextEntry(page, 'Another First Entry');
    await nbUtils.enterTextEntry(page, 'Second Entry');
    await nbUtils.enterTextEntry(page, 'Third Entry');
    await page.hover('[aria-label="Notebook Entry"] >> nth=2');
    await page.click('button[title="Delete this entry"] >> nth=2');
    await page.getByRole('button', { name: 'Ok' }).filter({ hasText: 'Ok' }).click();
    await expect(page.locator('text="Third Entry"')).toBeHidden();
    await expect(page.locator('text="Another First Entry"')).toBeVisible();
    await expect(page.locator('text="Second Entry"')).toBeVisible();
  });
  test('when a valid link is entered into a notebook entry, it becomes clickable when viewing', async ({
    page
  }) => {
    const TEST_LINK = 'http://www.google.com';

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, `This should be a link: ${TEST_LINK} is it?`);

    const validLink = page.locator(`a[href="${TEST_LINK}"]`);

    expect(await validLink.count()).toBe(1);

    // Start waiting for popup before clicking. Note no await.
    const popupPromise = page.waitForEvent('popup');

    await validLink.click();
    const popup = await popupPromise;

    // Wait for the popup to load.
    await popup.waitForLoadState();
    expect.soft(popup.url()).toContain('www.google.com');
  });
  test('when an invalid link is entered into a notebook entry, it does not become clickable when viewing', async ({
    page
  }) => {
    const TEST_LINK = 'www.google.com';

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, `This should NOT be a link: ${TEST_LINK} is it?`);

    const invalidLink = page.locator(`a[href="${TEST_LINK}"]`);

    expect(await invalidLink.count()).toBe(0);
  });
  test('when a link is entered, but it is not in the whitelisted urls, it does not become clickable when viewing', async ({
    page
  }) => {
    const TEST_LINK = 'http://www.bing.com';

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, `This should NOT be a link: ${TEST_LINK} is it?`);

    const invalidLink = page.locator(`a[href="${TEST_LINK}"]`);

    expect(await invalidLink.count()).toBe(0);
  });
  test('when a valid link with a subdomain and a valid domain in the whitelisted urls is entered into a notebook entry, it becomes clickable when viewing', async ({
    page
  }) => {
    const INVALID_TEST_LINK = 'http://bing.google.com';

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, `This should be a link: ${INVALID_TEST_LINK} is it?`);

    const validLink = page.locator(`a[href="${INVALID_TEST_LINK}"]`);

    expect(await validLink.count()).toBe(1);
  });
  test('when a valid secure link is entered into a notebook entry, it becomes clickable when viewing', async ({
    page
  }) => {
    const TEST_LINK = 'https://www.google.com';

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(page, `This should be a link: ${TEST_LINK} is it?`);

    const validLink = page.locator(`a[href="${TEST_LINK}"]`);

    expect(await validLink.count()).toBe(1);

    // Start waiting for popup before clicking. Note no await.
    const popupPromise = page.waitForEvent('popup');

    await validLink.click();
    const popup = await popupPromise;

    // Wait for the popup to load.
    await popup.waitForLoadState();
    expect.soft(popup.url()).toContain('www.google.com');
  });
  test('when a nefarious link is entered into a notebook entry, it is sanitized when viewing', async ({
    page
  }) => {
    const TEST_LINK = 'http://www.google.com?bad=';
    const TEST_LINK_BAD = `http://www.google.com?bad=<script>alert('gimme your cookies')</script>`;

    // Navigate to the notebook object
    await page.goto(notebookObject.url);

    // Reveal the notebook in the tree
    await page.getByLabel('Show selected item in tree').click();

    await nbUtils.enterTextEntry(
      page,
      `This should be a link, BUT not a bad link: ${TEST_LINK_BAD} is it?`
    );

    const sanitizedLink = page.locator(`a[href="${TEST_LINK}"]`);
    const unsanitizedLink = page.locator(`a[href="${TEST_LINK_BAD}"]`);

    expect.soft(await sanitizedLink.count()).toBe(1);
    expect(await unsanitizedLink.count()).toBe(0);
  });
  test('Can add markdown to a notebook entry', async ({ page }) => {
    await page.goto(notebookObject.url);

    // Headers
    const headerMarkdown = `# Big Header\n## Large Header\n### Medium Header\n#### Small Header`;
    await nbUtils.enterTextEntry(page, headerMarkdown);
    await expect(page.getByRole('heading', { name: 'Big Header' })).toBeVisible();

    // Text markup
    const markupText =
      '**This is bold.** _This is italic_. `This is code`. ~This is strikethrough~';
    await nbUtils.enterTextEntry(page, markupText);
    await expect(page.locator('strong:has-text("This is bold.")')).toBeVisible();

    // Tables
    const tablesText = '|Col 1|Col 2|Col3|\n|-|-|-|\n |Value 1|Value 2|Value 3|\n';
    await nbUtils.enterTextEntry(page, tablesText);
    await expect(page.getByRole('cell', { name: 'Value 2' })).toBeVisible();

    // Links
    const linksText =
      'Raw links https://www.google.com and Markdown links like [Google](https://www.google.com) work';
    await nbUtils.enterTextEntry(page, linksText);
    await expect(page.getByRole('link', { name: 'https://www.google.com' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Google', exact: true })).toBeVisible();

    // Lists
    const listsText = '- List item 1\n   - Item 1A \n- List Item 2\n  1. Order 1\n  1. Order 2\n';
    await nbUtils.enterTextEntry(page, listsText);
    const childItem = page.locator('li:has-text("List Item 2") ol li:has-text("Order 2")');
    await expect(childItem).toBeVisible();

    // Code Blocks
    const codeblockTest = '```javascript\nconst foo = "bar";\nconst bar = "foo";\n```';
    await nbUtils.enterTextEntry(page, codeblockTest);
    const codeBlock = page.locator('code.language-javascript:has-text("const foo = \\"bar\\";")');
    await expect(codeBlock).toBeVisible();

    // Blockquotes
    const blockquoteTest =
      'This is a quote by Mark Twain:\n> "The man with a new idea is a crank\n>until the idea succeeds."';
    await nbUtils.enterTextEntry(page, blockquoteTest);
    const firstLineOfBlockquoteText = page.locator(
      'blockquote:has-text("The man with a new idea is a crank")'
    );
    await expect(firstLineOfBlockquoteText).toBeVisible();
    const secondLineOfBlockquoteText = page.locator(
      'blockquote:has-text("until the idea succeeds")'
    );
    await expect(secondLineOfBlockquoteText).toBeVisible();
  });

  /**
   *  Paste into notebook entry tests
   */
  test('Can paste text into a notebook entry', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7686'
    });
    const TEST_TEXT = 'This is a test';
    const iterations = 20;
    const EXPECTED_TEXT = TEST_TEXT.repeat(iterations);

    await page.goto(notebookObject.url);

    await nbUtils.addNotebookEntry(page);
    await nbUtils.enterTextInLastEntry(page, TEST_TEXT);
    await selectAll(page);
    await copy(page);
    for (let i = 0; i < iterations; i++) {
      await paste(page);
    }
    await nbUtils.commitEntry(page);

    await expect(page.locator(`text="${EXPECTED_TEXT}"`)).toBeVisible();
  });

  test('Prevents pasting text into selected notebook entry if not editing', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7686'
    });
    const TEST_TEXT = 'This is a test';

    await page.goto(notebookObject.url);

    await nbUtils.addNotebookEntry(page);
    await nbUtils.enterTextInLastEntry(page, TEST_TEXT);
    await selectAll(page);
    await copy(page);
    await paste(page);
    await nbUtils.commitEntry(page);

    // This should not paste text into the entry
    await paste(page);

    await expect(await page.locator(`text="${TEST_TEXT.repeat(1)}"`).count()).toEqual(1);
    await expect(await page.locator(`text="${TEST_TEXT.repeat(2)}"`).count()).toEqual(0);
  });
});
