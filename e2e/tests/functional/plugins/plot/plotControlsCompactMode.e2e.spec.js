/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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
 * This test suite is dedicated to testing the rendering and interaction of plots.
 *
 */

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Plot Controls in compact mode', () => {
  let timeStrip;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    timeStrip = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip'
    });

    // Create an overlay plot with a sine wave generator
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: timeStrip.uuid
    });
    await page.goto(`${timeStrip.url}`);
  });

  test('Plots show cursor guides', async ({ page }) => {
    // hover over plot for plot controls
    await page.getByLabel('Plot Canvas').hover();
    // click on cursor guides control
    await page.getByTitle('Toggle cursor guides').click();
    await page.getByLabel('Plot Canvas').hover();
    await expect(page.getByLabel('Vertical cursor guide')).toBeVisible();
    await expect(page.getByLabel('Horizontal cursor guide')).toBeVisible();
  });
});
