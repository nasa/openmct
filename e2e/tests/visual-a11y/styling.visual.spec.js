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

/**
 * This test is dedicated to test notification banner functionality and its accessibility attributes.
 */

import percySnapshot from '@percy/playwright';

import { createDomainObjectWithDefaults } from '../../appActions.js';
import { scanForA11yViolations, test } from '../../avpFixtures.js';
import { setStyles } from '../../helper/stylingUtils.js';

const setBorderColor = '#ff00ff';
const setBackgroundColor = '#5b0f00';
const setTextColor = '#e6b8af';

test.describe('Flexible Layout styling @a11y', () => {
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a Flexible Layout and attach to the Stacked Plot
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Flexible Layout'
    });

    // Create a Stacked Plot and attach to the Flexible Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'StackedPlot1',
      parent: flexibleLayout.uuid
    });

    // Create a Stacked Plot and attach to the Flexible Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'StackedPlot2',
      parent: flexibleLayout.uuid
    });
  });

  test('styling the flexible layout properly applies the styles to flex layout', async ({
    page,
    theme
  }) => {
    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    await percySnapshot(page, `Flex Layout with 2 children (theme: '${theme}')`);

    // Set styles using setStyles function
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Flexible Layout Column')
    );

    await percySnapshot(page, `Edit Mode Styled Flex Layout Column (theme: '${theme}')`);

    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('StackedPlot1 Frame')
    );

    await percySnapshot(
      page,
      `Edit Mode Styled Flex Layout with Styled StackedPlot (theme: '${theme}')`
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await percySnapshot(
      page,
      `Saved Styled Flex Layout with Styled StackedPlot (theme: '${theme}')`
    );
  });
  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});

test.describe('Stacked Plot styling @a11y', () => {
  let stackedPlot;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a Stacked Plot
    stackedPlot = await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'StackedPlot1'
    });

    // Create two SWGs and attach them to the Stacked Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator 1',
      parent: stackedPlot.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator 2',
      parent: stackedPlot.uuid
    });
  });

  test('styling the flexible layout properly applies the styles to flex layout', async ({
    page,
    theme
  }) => {
    // Directly navigate to the flexible layout
    await page.goto(stackedPlot.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    await percySnapshot(page, `StackedPlot with 2 SWG (theme: '${theme}')`);

    // Set styles using setStyles function
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByRole('tab', { name: 'Styles' }) //Workaround for https://github.com/nasa/openmct/issues/7229
    );

    //Set Font Size to 72
    await page.getByLabel('Set Font Size').click();
    await page.getByRole('menuitem', { name: '72px' }).click();

    //Set Font Type to Monospace Bold
    await page.getByLabel('Set Font Type').click();
    await page.getByRole('menuitem', { name: 'Monospace Bold' }).click();

    await percySnapshot(page, `Edit Mode StackedPlot Styled (theme: '${theme}')`);

    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    await percySnapshot(page, `Edit Mode StackedPlot with Styled SWG (theme: '${theme}')`);

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await percySnapshot(page, `Saved Styled StackedPlot (theme: '${theme}')`);
  });
  test.afterEach(async ({ page }, testInfo) => {
    await scanForA11yViolations(page, testInfo.title);
  });
});
