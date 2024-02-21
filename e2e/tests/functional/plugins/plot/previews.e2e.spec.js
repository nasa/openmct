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

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Plots work in Previews', () => {
  test('We can preview plot in display layouts', async ({ page, openmctConfig }) => {
    const { myItemsFolderName } = openmctConfig;
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create a Sinewave Generator
    const sineWaveObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });
    // Create a Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.getByLabel('Edit Object').click();

    // Expand the 'My Items' folder in the left tree
    await page.getByLabel(`Expand ${myItemsFolderName} folder`).click();
    // Add the Sine Wave Generator to the Display Layout and save changes
    const treePane = page.getByRole('tree', {
      name: 'Main Tree'
    });
    const sineWaveGeneratorTreeItem = treePane.getByRole('treeitem', {
      name: new RegExp(sineWaveObject.name)
    });
    const layoutGridHolder = page.getByLabel('Test Display Layout Layout Grid');
    await sineWaveGeneratorTreeItem.dragTo(layoutGridHolder);
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // right click on the plot and select view large
    await page.getByLabel('Sine', { exact: true }).click({ button: 'right' });
    await page.getByLabel('View Historical Data').click();
    await expect(page.getByLabel('Preview Container').getByLabel('Plot Canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByLabel('Expand Test Display Layout layout').click();

    // change to a plot and ensure embiggen works
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Move Sub-object Frame').click();
    await page.getByText('View type').click();
    await page.getByText('Overlay Plot').click();
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await expect(
      page.getByLabel('Test Display Layout Layout', { exact: true }).getByLabel('Plot Canvas')
    ).toBeVisible();
    await expect(page.getByLabel('Preview Container')).toBeHidden();
    await page.getByLabel('Large View').click();
    await expect(page.getByLabel('Preview Container').getByLabel('Plot Canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // get last sinewave tree item (in the display layout)
    await page
      .getByRole('treeitem', { name: /Sine Wave Generator/ })
      .locator('a')
      .last()
      .click({ button: 'right' });
    await page.getByLabel('View', { exact: true }).click();
    await expect(page.getByLabel('Preview Container').getByLabel('Plot Canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  });
});
