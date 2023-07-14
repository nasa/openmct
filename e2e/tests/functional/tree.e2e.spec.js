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

const { test, expect } = require('../../pluginFixtures.js');
const {
  createDomainObjectWithDefaults,
  openObjectTreeContextMenu
} = require('../../appActions.js');

test.describe('Main Tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Creating a child object within a folder and immediately opening it shows the created object in the tree @couchdb', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5975'
    });

    const folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await page.getByTitle('Show selected item in tree').click();

    const clock = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      parent: folder.uuid
    });

    await expandTreePaneItemByName(page, folder.name);
    await assertTreeItemIsVisible(page, clock.name);
  });

  test('Creating a child object on one tab and expanding its parent on the other shows the correct composition @2p', async ({
    page,
    openmctConfig
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6391'
    });

    const { myItemsFolderName } = openmctConfig;
    const page2 = await page.context().newPage();

    // Both pages: Go to baseURL
    await Promise.all([
      page.goto('./', { waitUntil: 'networkidle' }),
      page2.goto('./', { waitUntil: 'networkidle' })
    ]);

    const page1Folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await expandTreePaneItemByName(page2, myItemsFolderName);
    await assertTreeItemIsVisible(page2, page1Folder.name);
  });

  test('Creating a child object on one tab and expanding its parent on the other shows the correct composition @couchdb @2p', async ({
    page,
    openmctConfig
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6391'
    });

    const { myItemsFolderName } = openmctConfig;
    const page2 = await page.context().newPage();

    // Both pages: Go to baseURL
    await Promise.all([
      page.goto('./', { waitUntil: 'networkidle' }),
      page2.goto('./', { waitUntil: 'networkidle' })
    ]);

    const page1Folder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });

    await expandTreePaneItemByName(page2, myItemsFolderName);
    await assertTreeItemIsVisible(page2, page1Folder.name);
  });

  test('Renaming an object reorders the tree @unstable', async ({ page, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Foo'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Bar'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Baz'
    });

    const clock1 = await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'aaa'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'www'
    });

    // Expand the root folder
    await expandTreePaneItemByName(page, myItemsFolderName);

    await test.step('Reorders objects with the same tree depth', async () => {
      await getAndAssertTreeItems(page, ['aaa', 'Bar', 'Baz', 'Foo', 'www']);
      await renameObjectFromContextMenu(page, clock1.url, 'zzz');
      await getAndAssertTreeItems(page, ['Bar', 'Baz', 'Foo', 'www', 'zzz']);
    });

    await test.step('Reorders links to objects as well as original objects', async () => {
      await page.click('role=treeitem[name=/Bar/]');
      await page.dragAndDrop('role=treeitem[name=/www/]', '.c-object-view');
      await page.dragAndDrop('role=treeitem[name=/zzz/]', '.c-object-view');
      await page.click('role=treeitem[name=/Baz/]');
      await page.dragAndDrop('role=treeitem[name=/www/]', '.c-object-view');
      await page.dragAndDrop('role=treeitem[name=/zzz/]', '.c-object-view');
      await page.click('role=treeitem[name=/Foo/]');
      await page.dragAndDrop('role=treeitem[name=/www/]', '.c-object-view');
      await page.dragAndDrop('role=treeitem[name=/zzz/]', '.c-object-view');
      // Expand the unopened folders
      await expandTreePaneItemByName(page, 'Bar');
      await expandTreePaneItemByName(page, 'Baz');
      await expandTreePaneItemByName(page, 'Foo');

      await renameObjectFromContextMenu(page, clock1.url, '___');
      await getAndAssertTreeItems(page, [
        '___',
        'Bar',
        '___',
        'www',
        'Baz',
        '___',
        'www',
        'Foo',
        '___',
        'www',
        'www'
      ]);
    });
  });
  test('Opening and closing an item before the request has been fulfilled will abort the request @couchdb', async ({
    page,
    openmctConfig
  }) => {
    const { myItemsFolderName } = openmctConfig;
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
        name: `Expand ${myItemsFolderName} folder`
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
  const treeItems = page.locator('[role="treeitem"]');
  const allTexts = await treeItems.allInnerTexts();
  // Get rid of root folder ('My Items') as its position will not change
  allTexts.shift();
  expect(allTexts).toEqual(expected);
}

async function assertTreeItemIsVisible(page, name) {
  const mainTree = page.getByRole('tree', {
    name: 'Main Tree'
  });
  const treeItem = mainTree.getByRole('treeitem', {
    name
  });

  await expect(treeItem).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function expandTreePaneItemByName(page, name) {
  const mainTree = page.getByRole('tree', {
    name: 'Main Tree'
  });
  const treeItem = mainTree.getByRole('treeitem', {
    name,
    expanded: false
  });
  await treeItem.locator('.c-disclosure-triangle').click();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 * @param {string} url
 * @param {string} newName
 */
async function renameObjectFromContextMenu(page, url, newName) {
  await openObjectTreeContextMenu(page, url);
  await page.click('li:text("Edit Properties")');
  const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
  await nameInput.fill('');
  await nameInput.fill(newName);
  await page.click('[aria-label="Save"]');
}
