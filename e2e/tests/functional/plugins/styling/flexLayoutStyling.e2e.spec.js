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
 * This test is dedicated to test styling of flex layouts
 */

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { checkStyles, hexToRGB, setStyles } from '../../../../helper/stylingUtils.js';
import { test } from '../../../../pluginFixtures.js';

const setBorderColor = '#ff00ff';
const setBackgroundColor = '#5b0f00';
const setTextColor = '#e6b8af';
const defaultFrameBorderColor = '#e6b8af'; //default border color
const defaultBorderTargetColor = '#acacac';
const defaultTextColor = '#acacac'; // default text color
const inheritedColor = '#acacac'; // inherited from the body style
const pukeGreen = '#6aa84f'; //Ugliest green known to man
const NO_STYLE_RGBA = 'rgba(0, 0, 0, 0)'; //default background color value

test.describe('Flexible Layout styling', () => {
  let stackedPlot;
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a Flexible Layout and attach to the Stacked Plot
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Flexible Layout'
    });

    // Create a Stacked Plot and attach to the Flexible Layout
    stackedPlot = await createDomainObjectWithDefaults(page, {
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
    page
  }) => {
    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Flexible Layout Column')
    );

    // Flex Layout Column matches set styles
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Flexible Layout Column')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles of overall Flex Layout
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Flexible Layout Column')
    );

    // Check styles on StackedPlot1. Note: https://github.com/nasa/openmct/issues/7337
    await checkStyles(
      hexToRGB(defaultFrameBorderColor),
      NO_STYLE_RGBA,
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2. Note: https://github.com/nasa/openmct/issues/7337
    await checkStyles(
      hexToRGB(defaultFrameBorderColor),
      NO_STYLE_RGBA,
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('styling a child object of the flexible layout properly applies that style to only that child', async ({
    page
  }) => {
    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Set styles using setStyles function on StackedPlot1 but not StackedPlot2
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('StackedPlot1 Frame')
    );

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page and verify that styles persist
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('if an overall style has been applied to the parent layout or plot, the individual styling should be able to coexist with that', async ({
    page
  }) => {
    //Navigate to stackedPlot
    await page.goto(stackedPlot.url, { waitUntil: 'domcontentloaded' });

    // Edit stackedPlot
    await page.getByLabel('Edit Object').click();

    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function on StackedPlot1 but not StackedPlot2
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Stacked Plot Style Target').locator('div')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Check styles on StackedPlot1 to match the set colors
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2 to verify they are the default
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Set styles using setStyles function on StackedPlot2
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('StackedPlot2 Frame')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page and verify that styles persist
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set Flex Layout Column to puke green
    await setStyles(
      page,
      pukeGreen,
      pukeGreen,
      pukeGreen,
      page.getByLabel('Flexible Layout Column')
    );
    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Flex Layout Column matches set styles
    await checkStyles(
      hexToRGB(pukeGreen),
      hexToRGB(pukeGreen),
      hexToRGB(pukeGreen),
      page.getByLabel('Flexible Layout Column')
    );

    // Check styles on StackedPlot1 matches previously set colors
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2 matches previous set colors
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('when the "no style" option is selected, background and text should be reset to inherited styles', async ({
    page
  }) => {
    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('StackedPlot1 Frame')
    );

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page and set Styles to 'None'
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit Object').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    //Select the 'No Style' option
    await setStyles(
      page,
      'No Style',
      'No Style',
      'No Style',
      page.getByLabel('StackedPlot1 Frame')
    );

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(inheritedColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );
    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page and verify that styles persist
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(defaultBorderTargetColor),
      NO_STYLE_RGBA,
      hexToRGB(inheritedColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );
  });
});
