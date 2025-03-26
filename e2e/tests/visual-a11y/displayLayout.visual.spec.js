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

import {
  createDomainObjectWithDefaults,
  createStableStateTelemetry,
  linkParameterToObject
} from '../../appActions.js';
import { MISSION_TIME, VISUAL_FIXED_URL } from '../../constants.js';
import { test } from '../../pluginFixtures.js';

test.describe('Visual - Display Layout @clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });

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

    const stableStateTelemetry = await createStableStateTelemetry(page);
    await linkParameterToObject(page, stableStateTelemetry.name, child1Layout.name);
    await linkParameterToObject(page, stableStateTelemetry.name, child2Layout.name);

    // Pause the clock at a time where the telemetry is stable 20 minutes in the future
    await page.clock.pauseAt(new Date(MISSION_TIME + 1200000));

    await page.goto(parentLayout.url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Edit Object' }).click();

    // Select the child right layout
    await page
      .getByLabel('Child Right Layout Layout', { exact: true })
      .getByLabel('Move Sub-object Frame')
      .click();
    // FIXME: Click to select the parent object (layout)
    await page.getByLabel('Move Sub-object Frame').nth(3).click();

    // Move the second layout element to the right
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
    await page.getByRole('tab', { name: 'Elements' }).click();
    await percySnapshot(page, `Toolbar does not overflow into inspector (theme: '${theme}')`);
  });
});
