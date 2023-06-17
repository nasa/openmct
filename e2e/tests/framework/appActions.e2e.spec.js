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
  createNotification,
  expandEntireTree
} = require('../../appActions.js');

test.describe('AppActions', () => {
  test('createDomainObjectsWithDefaults', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const e2eFolder = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'e2e folder'
    });

    await test.step('Create multiple flat objects in a row', async () => {
      const timer1 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Foo',
        parent: e2eFolder.uuid
      });
      const timer2 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Bar',
        parent: e2eFolder.uuid
      });
      const timer3 = await createDomainObjectWithDefaults(page, {
        type: 'Timer',
        name: 'Timer Baz',
        parent: e2eFolder.uuid
      });

      await page.goto(timer1.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer1.name);
      await page.goto(timer2.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer2.name);
      await page.goto(timer3.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(timer3.name);
    });

    await test.step('Create multiple nested objects in a row', async () => {
      const folder1 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Foo',
        parent: e2eFolder.uuid
      });
      const folder2 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Bar',
        parent: folder1.uuid
      });
      const folder3 = await createDomainObjectWithDefaults(page, {
        type: 'Folder',
        name: 'Folder Baz',
        parent: folder2.uuid
      });
      await page.goto(folder1.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder1.name);
      await page.goto(folder2.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder2.name);
      await page.goto(folder3.url);
      await expect(page.locator('.l-browse-bar__object-name')).toHaveText(folder3.name);

      expect(folder1.url).toBe(`${e2eFolder.url}/${folder1.uuid}`);
      expect(folder2.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}`);
      expect(folder3.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}/${folder3.uuid}`);
    });
  });
  test('createNotification', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await createNotification(page, {
      message: 'Test info notification',
      severity: 'info'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test info notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/info/);
    await page.locator('[aria-label="Dismiss"]').click();
    await createNotification(page, {
      message: 'Test alert notification',
      severity: 'alert'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test alert notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/alert/);
    await page.locator('[aria-label="Dismiss"]').click();
    await createNotification(page, {
      message: 'Test error notification',
      severity: 'error'
    });
    await expect(page.locator('.c-message-banner__message')).toHaveText('Test error notification');
    await expect(page.locator('.c-message-banner')).toHaveClass(/error/);
    await page.locator('[aria-label="Dismiss"]').click();
  });
  test('expandEntireTree', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const rootFolder = await createDomainObjectWithDefaults(page, {
      type: 'Folder'
    });
    const folder1 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: rootFolder.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      parent: folder1.uuid
    });
    const folder2 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder1.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder1.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      parent: folder2.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      parent: folder2.uuid
    });

    await page.goto('./#/browse/mine');
    await expandEntireTree(page);
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const treePaneCollapsedItems = treePane.getByRole('treeitem', { expanded: false });
    expect(await treePaneCollapsedItems.count()).toBe(0);

    await page.goto('./#/browse/mine');
    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object specified by 'type'
    await page.click(`li[role='menuitem']:text("Clock")`);
    await expandEntireTree(page, 'Create Modal Tree');
    const locatorTree = page.getByRole('tree', {
      name: 'Create Modal Tree'
    });
    const locatorTreeCollapsedItems = locatorTree.locator('role=treeitem[expanded=false]');
    expect(await locatorTreeCollapsedItems.count()).toBe(0);
  });
});
