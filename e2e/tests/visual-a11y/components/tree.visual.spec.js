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

import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../../appActions.js';
import { test } from '../../../avpFixtures.js';
import { VISUAL_FIXED_URL } from '../../../constants.js';

//Declare the scope of the visual test
const treePane = "[role=tree][aria-label='Main Tree']";

test.describe('Visual - Tree Pane', () => {
  test('Tree pane in various states', async ({ page, theme }) => {
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });

    //Open Tree
    await page.getByRole('button', { name: 'Browse' }).click();

    //Create a Folder Structure
    const foo = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Foo Folder'
    });

    const bar = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Bar Folder',
      parent: foo.uuid
    });

    const baz = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Baz Folder',
      parent: bar.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'A Clock'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Clock',
      name: 'Z Clock'
    });

    await percySnapshot(page, `Tree Pane w/ collapsed tree (theme: ${theme})`, {
      scope: treePane
    });

    await page.getByLabel('Expand My Items folder').click();

    await page.goto(foo.url);
    await page.getByLabel('Navigate to A Clock').dragTo(page.getByLabel('Object View'));
    await page.getByLabel('Navigate to Z Clock').dragTo(page.getByLabel('Object View'));
    await page.goto(bar.url);
    await page.getByLabel('Navigate to A Clock').dragTo(page.getByLabel('Object View'));
    await page.getByLabel('Navigate to Z Clock').dragTo(page.getByLabel('Object View'));
    await page.goto(baz.url);
    await page.getByLabel('Navigate to A Clock').dragTo(page.getByLabel('Object View'));
    await page.getByLabel('Navigate to Z Clock').dragTo(page.getByLabel('Object View'));

    await percySnapshot(page, `Tree Pane w/ single level expanded (theme: ${theme})`, {
      scope: treePane
    });

    await page.getByLabel(`Expand ${foo.name} folder`).click();
    await page.getByLabel(`Expand ${bar.name} folder`).click();
    await page.getByLabel(`Expand ${baz.name} folder`).click();

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3 * 1000); //https://github.com/nasa/openmct/issues/7059

    await percySnapshot(page, `Tree Pane w/ multiple levels expanded (theme: ${theme})`, {
      scope: treePane
    });
  });
});
