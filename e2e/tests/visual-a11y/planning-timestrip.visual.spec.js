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
import fs from 'fs';

import { createDomainObjectWithDefaults, createPlanFromJSON } from '../../appActions.js';
import { scanForA11yViolations, test } from '../../avpFixtures.js';
import { waitForAnimations } from '../../baseFixtures.js';
import { VISUAL_FIXED_URL } from '../../constants.js';
import { setBoundsToSpanAllActivities } from '../../helper/planningUtils.js';

const examplePlanSmall2 = JSON.parse(
  fs.readFileSync(new URL('../../test-data/examplePlans/ExamplePlan_Small2.json', import.meta.url))
);

test.describe('Visual - Time Strip @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });
  });
  test('Time Strip View', async ({ page, theme }) => {
    const timeStrip = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip',
      name: 'Time Strip Visual Test'
    });
    await createPlanFromJSON(page, {
      json: examplePlanSmall2,
      parent: timeStrip.uuid,
      name: 'examplePlanSmall2'
    });
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: timeStrip.uuid,
      name: 'Sine Wave Generator'
    });
    await page.goto(VISUAL_FIXED_URL, { waitUntil: 'domcontentloaded' });

    //This will indirectly modify the url such that the SWG is not rendered
    await setBoundsToSpanAllActivities(page, examplePlanSmall2, timeStrip.url);

    //TODO Find a way to set the "now" activity line

    //This will stabilize the state of the test and allow the SWG to render as empty
    await waitForAnimations(page.getByLabel('Plot Canvas'));

    await percySnapshot(page, `Time Strip View (theme: ${theme}) - With SWG and Plan`);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  await scanForA11yViolations(page, testInfo.title);
});
