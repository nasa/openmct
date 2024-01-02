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

/**
 * This test is dedicated to test styling of various plugins
 */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const { hexToRGB, setStyles, checkStyles } = require('../../../../helper/stylingUtils');

test.describe('Style Inspector Options', () => {
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
      name: 'Stacked Plot',
      parent: flexibleLayout.uuid
    });
  });

  test('styles button appears when appropriate component selected', async ({ page }) => {
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();

    // Select flexible layout column
    await page.getByLabel('Container Handle 1').click();

    // Flex Layout containers should NOT be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeHidden();

    // Select Flex Layout Column
    await page.getByLabel('Flexible Layout Column').click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();

    // Select Stacked Layout Column
    await page.getByLabel('Stacked Plot Frame').click();

    // The overall Flex Layout or Stacked Plot itself MUST be style-able.
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();
  });
});

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

  test('styling the flexible layout properly applies the styles to all containers', async ({
    page
  }) => {
    // Set background and font color on first Flex Colum
    const setBackgroundColor = '#5b0f00';
    const setTextColor = '#e6b8af';

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(
      page,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Flexible Layout Column')
    );

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Flexible Layout Column')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Flexible Layout Column')
    );

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('styling a child object of the flexible layout properly applies that style to only that child', async ({
    page
  }) => {
    // Set background and font color on Stacked Plot object
    const setBackgroundColor = '#5b0f00';
    const setTextColor = '#e6b8af';
    const defaultTextColor = '#aaaaaa'; // default text color
    const NO_STYLE_RGBA = 'rgba(0, 0, 0, 0)'; //default background color value

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Set styles using setStyles function on StackedPlot1 but not StackedPlot2
    await setStyles(page, setBackgroundColor, setTextColor, page.getByLabel('StackedPlot1 Frame'));

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
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
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('a previously styled object will keep its style properties if modified as part of a flex layout', async ({
    page
  }) => {
    // Set background and font color on Stacked Plot object
    const setBackgroundColor = '#5b0f00';
    const setTextColor = '#e6b8af';
    const defaultTextColor = '#aaaaaa'; // default text color
    const NO_STYLE_RGBA = 'rgba(0, 0, 0, 0)'; //default background color value

    //Navigate to stackedPlot
    await page.goto(stackedPlot.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function on StackedPlot1 but not StackedPlot2
    await setStyles(
      page,
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
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Set styles using setStyles function on StackedPlot2
    await setStyles(page, setBackgroundColor, setTextColor, page.getByLabel('StackedPlot2 Frame'));

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
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
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('StackedPlot2 Frame').getByLabel('Stacked Plot Style Target')
    );
  });

  test('When the "no style" option is selected, background and text should be reset to inherited styles', async ({
    page
  }) => {
    // Set background and font color on Stacked Plot object
    const backgroundColor = '#5b0f00';
    const textColor = '#e6b8af';
    const inheritedColor = '#aaaaaa'; // inherited from the body style
    const NO_STYLE_RGBA = 'rgba(0, 0, 0, 0)';

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(page, backgroundColor, textColor, page.getByLabel('StackedPlot1 Frame'));

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page and set Styles to 'None'
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    //Select the 'No Style' option
    await setStyles(page, 'No Style', 'No Style', page.getByLabel('StackedPlot1 Frame'));

    // Check styles using checkStyles function
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(inheritedColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );
    // Save Flexible Layout
    await page.locator('button[title="Save"]').click();
    await page.locator('text=Save and Finish Editing').click();

    // Reload page and verify that styles persist
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles using checkStyles function
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(inheritedColor),
      page.getByLabel('StackedPlot1 Frame').getByLabel('Stacked Plot Style Target')
    );
  });
});
