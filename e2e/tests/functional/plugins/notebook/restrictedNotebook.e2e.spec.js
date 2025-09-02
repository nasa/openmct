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

import {
  dragAndDropEmbed,
  enterTextEntry,
  lockPage,
  startAndAddRestrictedNotebookObject
} from '../../../../helper/notebookUtils.js';
import { expect, streamToString, test } from '../../../../pluginFixtures.js';

const TEST_TEXT = 'Testing text for entries.';
const TEST_TEXT_NAME = 'Test Page';

test.describe('Restricted Notebook', () => {
  let notebook;
  test.beforeEach(async ({ page }) => {
    notebook = await startAndAddRestrictedNotebookObject(page);
  });

  test('Can be renamed @addInit', async ({ page }) => {
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(`${notebook.name}`);
  });

  test('Can be deleted if there are no locked pages @addInit', async ({ page }) => {
    await openObjectTreeContextMenu(page, notebook.url);

    const menuOptions = page.locator('.c-menu ul');
    await expect.soft(menuOptions).toContainText('Remove');

    const restrictedNotebookTreeObject = page.locator(`a:has-text("${notebook.name}")`);

    // notebook tree object exists
    await expect(restrictedNotebookTreeObject).toHaveCount(1);

    // Click Remove Text
    await page.locator('li[role="menuitem"]:has-text("Remove")').click();

    // Click 'Ok' on confirmation window
    await page.locator('button:has-text("OK")').click();

    // has been deleted
    await expect(restrictedNotebookTreeObject).toHaveCount(0);
  });

  test('Can be locked if at least one page has one entry @addInit', async ({ page }) => {
    await enterTextEntry(page, TEST_TEXT);

    await expect(page.getByLabel('Commit Entries')).toHaveCount(1);
  });
});

test.describe('Restricted Notebook with at least one entry and with the page locked @addInit', () => {
  let notebook;
  test.beforeEach(async ({ page }) => {
    notebook = await startAndAddRestrictedNotebookObject(page);
    await enterTextEntry(page, TEST_TEXT);
    await lockPage(page);

    // open sidebar
    await page.locator('button.c-notebook__toggle-nav-button').click();
  });

  test('Locked page should now be in a locked state @addInit', async ({ page }, testInfo) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(testInfo.project === 'chrome-beta', 'Test is unreliable on chrome-beta');
    // main lock message on page
    const lockMessage = page.locator(
      'text=This page has been committed and cannot be modified or removed'
    );
    await expect(lockMessage).toHaveCount(1);

    // lock icon on page in sidebar
    const pageLockIcon = page.locator('ul.c-notebook__pages li div.icon-lock');
    await expect(pageLockIcon).toHaveCount(1);

    // no way to remove a restricted notebook with a locked page
    await openObjectTreeContextMenu(page, notebook.url);
    const menuOptions = page.locator('.c-menu ul');

    await expect(menuOptions).not.toContainText('Remove');
  });

  test('Can still: add page, rename, add entry, delete unlocked pages @addInit', async ({
    page
  }) => {
    // Add a new page to the section
    await page.getByRole('button', { name: 'Add Page' }).click();
    // Focus the new page by clicking it
    await page.getByText('Unnamed Page').nth(1).click();
    // Rename the new page
    await page.getByText('Unnamed Page').nth(1).fill(TEST_TEXT_NAME);

    // expect to be able to rename unlocked pages
    await page.getByText(TEST_TEXT_NAME).press('Enter'); // exit contenteditable state
    await expect(page.locator('div').filter({ hasText: /^Test Page$/ })).toHaveCount(1);

    // enter test text
    await enterTextEntry(page, TEST_TEXT);

    // expect new page to be lockable
    await expect(page.getByLabel('Commit Entries')).toHaveCount(1);

    // Click the context menu button for the new page
    await page.getByTitle('Open context menu').click();
    // Delete the page
    await page.getByRole('menuitem', { name: 'Delete Page' }).click();
    // Click OK button
    await page.getByRole('button', { name: 'Ok', exact: true }).click();

    // deleted page, should no longer exist
    const deletedPageElement = page.getByText(TEST_TEXT_NAME);
    await expect(deletedPageElement).toHaveCount(0);
  });
});

test.describe('Restricted Notebook with a page locked and with an embed @addInit', () => {
  test.beforeEach(async ({ page }) => {
    const notebook = await startAndAddRestrictedNotebookObject(page);
    await dragAndDropEmbed(page, notebook);
  });

  test('Allows embeds to be deleted if page unlocked @addInit', async ({ page }) => {
    // Click embed popup menu
    await page.getByLabel('Notebook Entry').getByLabel('More actions').click();

    const embedMenu = page.getByLabel('Super Menu');
    await expect(embedMenu).toContainText('Remove This Embed');
  });

  test('Disallows embeds to be deleted if page locked @addInit', async ({ page }) => {
    await lockPage(page);
    // Click embed popup menu
    await page.getByLabel('Notebook Entry').getByLabel('More actions').click();

    const embedMenu = page.getByLabel('Super Menu');
    await expect(embedMenu).not.toContainText('Remove This Embed');
  });
});

test.describe('can export restricted notebook as text', () => {
  test.beforeEach(async ({ page }) => {
    await startAndAddRestrictedNotebookObject(page);
  });

  test('basic functionality', async ({ page }) => {
    await enterTextEntry(page, `Foo bar entry`);
    // Click on 3 Dot Menu
    await page.locator('button[title="More actions"]').click();
    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('menuitem', { name: /Export Notebook as Text/ }).click();

    await page.getByRole('button', { name: 'Save' }).click();

    //Verify exported text as a stream of text instead of a file read from the filesystem
    const download = await downloadPromise;
    const readStream = await download.createReadStream();
    const exportedText = await streamToString(readStream);
    expect(exportedText).toContain('Foo bar entry');
  });

  test.fixme('can export multiple notebook entries as text', async ({ page }) => {});
  test.fixme('can export all notebook entry metdata', async ({ page }) => {});
  test.fixme('can export all notebook tags', async ({ page }) => {});
  test.fixme('can export all notebook snapshots', async ({ page }) => {});
});

/**
 * Open the given `domainObject`'s context menu from the object tree.
 * Expands the path to the object and scrolls to it if necessary.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url the url to the object
 */
async function openObjectTreeContextMenu(page, url) {
  await page.goto(url);
  await page.getByLabel('Show selected item in tree').click();
  await page.locator('.is-navigated-object').click({
    button: 'right'
  });
}
