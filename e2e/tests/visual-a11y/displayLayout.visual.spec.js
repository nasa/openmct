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

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { VISUAL_URL } from '../../constants.js';
import { test } from '../../pluginFixtures.js';

test.describe('Visual - Display Layout', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(VISUAL_URL, { waitUntil: 'domcontentloaded' });

    const parentLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Parent Layout'
    });
    const child2Layout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Left Layout',
      parent: parentLayout.uuid
    });
    //Create this layout second so that it is on top for the position change
    const child1Layout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Child Right Layout',
      parent: parentLayout.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG 1',
      parent: child1Layout.uuid
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG 2',
      parent: child2Layout.uuid
    });

    await page.goto(parentLayout.url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Edit Object' }).click();

    //Move the Child Right Layout to the Right. It should be on top of the Left Layout at this point.
    await page
      .getByLabel('Child Right Layout Layout', { exact: true })
      .getByLabel('Move Sub-object Frame')
      .click();
    await page.getByLabel('Move Sub-object Frame').nth(3).click(); //I'm not sure why this step is necessary
    await page.getByLabel('X:').click();
    await page.getByLabel('X:').fill('35');
  });

  test('Resize Marquee surrounds selection', async ({ page, theme }) => {
    //This is where the beforeEach leaves off.
    await percySnapshot(page, `Last modified object selected (theme: '${theme}')`);

    await page.getByLabel('Child Left Layout Layout', { exact: true }).click();
    await percySnapshot(page, `Only Left Child Layout has Marque selection (theme: '${theme}')`);

    await page.getByLabel('Child Right Layout Layout', { exact: true }).click();
    await percySnapshot(page, `Only Right Child Layout has Marque selection (theme: '${theme}')`);

    //Only the sub-object in the Right Layout should be highlighted with a marquee
    await page
      .getByLabel('Child Right Layout Layout', { exact: true })
      .getByLabel('Move Sub-object Frame')
      .click();

    await percySnapshot(
      page,
      `Selecting a sub-object from Right Layout selected (theme: '${theme}')`
    );

    await page.getByLabel('Parent Layout Layout', { exact: true }).click();
    await percySnapshot(page, `Parent outer layout selected (theme: '${theme}')`);
  });

  test('Toolbar does not overflow into inspector', async ({ page, theme }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7036'
    });
    await page.getByLabel('Expand Inspect Pane').click();
    await page.getByLabel('Resize Inspect Pane').dragTo(page.getByLabel('X:'));
    await percySnapshot(page, `Toolbar does not overflow into inspector (theme: '${theme}')`);
  });
});
