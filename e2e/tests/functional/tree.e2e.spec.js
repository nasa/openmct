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

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Main Tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Creating a child object within a folder and immediately opening it shows the created object in the tree @couchdb @network', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5975'
    });

    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await page.getByLabel('Show selected item in tree').click();

    const clock = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      parent: folder.uuid
    });

    await page.getByLabel(`Expand ${folder.name} folder`).click();

    await expect(
      page.getByRole('tree', { name: 'Main Tree' }).getByRole('treeitem', { name: clock.name })
    ).toBeVisible();
  });

  test('Creating a child object on one tab and expanding its parent on the other shows the correct composition @2p', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6391'
    });

    const page2 = await page.context().newPage();

    // Both pages: Go to baseURL
    await Promise.all([
      page.goto('./', { waitUntil: 'domcontentloaded' }),
      page2.goto('./', { waitUntil: 'domcontentloaded' })
    ]);

    await Promise.all([
      page.waitForURL('**/browse/mine?**'),
      page2.waitForURL('**/browse/mine?**')
    ]);

    const page1Folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await page2.getByLabel('Expand My Items folder').click();

    await expect(
      page2
        .getByRole('tree', { name: 'Main Tree' })
        .getByRole('treeitem', { name: page1Folder.name })
    ).toBeVisible();
  });

  test('Creating a child object on one tab and expanding its parent on the other shows the correct composition @couchdb @network @2p', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6391'
    });

    const page2 = await page.context().newPage();

    // Both pages: Go to baseURL
    await Promise.all([
      page.goto('./', { waitUntil: 'domcontentloaded' }),
      page2.goto('./', { waitUntil: 'domcontentloaded' })
    ]);

    await Promise.all([
      page.waitForURL('**/browse/mine?**'),
      page2.waitForURL('**/browse/mine?**')
    ]);

    const page1Folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await page2.getByLabel('Expand My Items folder').click();
    await expect(
      page2
        .getByRole('tree', { name: 'Main Tree' })
        .getByRole('treeitem', { name: page1Folder.name })
    ).toBeVisible();
  });

  test('Renaming an object reorders the tree', async ({ page }) => {
    const foo = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Foo'
    });

    const bar = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Bar'
    });

    const baz = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Baz'
    });

    let clock1 = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'aaa'
    });

    const www = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'www'
    });

    // Expand the root folder
    await page.getByLabel('Expand My Items folder').click();

    await test.step('Reorders objects with the same tree depth', async () => {
      await getAndAssertTreeItems(page, ['My Items', 'aaa', 'Bar', 'Baz', 'Foo', 'www']);
      clock1.name = 'zzz';
      await renameObjectFromContextMenu(page, clock1.url, clock1.name);
      await getAndAssertTreeItems(page, ['My Items', 'Bar', 'Baz', 'Foo', 'www', 'zzz']);
    });

    await test.step('Reorders links to objects as well as original objects', async () => {
      await page.getByLabel(`Navigate to ${bar.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${www.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${clock1.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${baz.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${www.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${clock1.name}`).dragTo(page.getByLabel('Object View'));
      await page.goto(foo.url);
      await page.getByLabel(`Navigate to ${www.name}`).dragTo(page.getByLabel('Object View'));
      await page.getByLabel(`Navigate to ${clock1.name}`).dragTo(page.getByLabel('Object View'));
      // Expand the unopened folders
      await page.getByLabel(`Expand Bar folder`).click();
      await page.getByLabel(`Expand Baz folder`).click();
      await page.getByLabel(`Expand Foo folder`).click();

      clock1.name = '___';
      await renameObjectFromContextMenu(page, clock1.url, clock1.name);
      await expect(page.getByLabel('Navigate to ' + clock1.name)).toHaveCount(2);
      await getAndAssertTreeItems(page, [
        'My Items',
        '___',
        'Bar',
        'Baz',
        'Foo',
        '___',
        'www',
        'www'
      ]);
    });
  });
  test('Opening and closing an item before the request has been fulfilled will abort the request @couchdb @network', async ({
    page
  }) => {
    let requestWasAborted = false;

    page.on('requestfailed', (request) => {
      // check if the request was aborted
      if (request.failure().errorText === 'net::ERR_ABORTED') {
        requestWasAborted = true;
      }
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Foo'
    });

    // Intercept and delay request
    const delayInMs = 500;

    await page.route('**', async (route, request) => {
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
      route.continue();
    });

    // Quickly Expand/close the root folder
    await page
      .getByRole('button', {
        name: `Expand My Items folder`
      })
      .dblclick({ delay: 400 });

    expect(requestWasAborted).toBe(true);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {Array<string>} expected
 */
async function getAndAssertTreeItems(page, expected) {
  const treeItems = page.getByRole('treeitem');
  await expect(treeItems).toHaveCount(expected.length);
  await expect(treeItems).toHaveText(expected, { useInnerText: true });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 * @param {string} url
 * @param {string} newName
 */
async function renameObjectFromContextMenu(page, url, newName) {
  await openObjectTreeContextMenu(page, url);
  await page.getByLabel('Edit Properties...').click();
  const nameInput = page.getByLabel('Title', { exact: true });
  await nameInput.fill(newName);
  await page.getByLabel('Save').click();
}

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
