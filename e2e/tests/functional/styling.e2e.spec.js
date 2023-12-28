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

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');

test.describe('Flex Layout Style Inspector Options', () => {
  let flexibleLayout;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a Flexible Layout and attach to the Stacked Plot
    flexibleLayout = await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Flexible Layout'
    });
  });

  test('selecting a flexible layout column hides the styles tab', async ({ page }) => {
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Expect to find styles tab
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeVisible();

    // Select flexible layout column
    await page.getByLabel('Container Handle 1').click();

    // Expect to find no styles tab
    await expect(page.getByRole('tab', { name: 'Styles' })).toBeHidden();
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
      name: 'Stacked Plot',
      parent: flexibleLayout.uuid
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

  test('styling the flexible layout properly applies the styles to all containers', async ({
    page
  }) => {
    // Values to set styles to
    const backgroundColor = '#5b0f00';
    const textColor = '#e6b8af';

    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(page, backgroundColor, textColor, page.getByLabel('Flexible Layout Column'));

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('Flexible Layout Column')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('Flexible Layout Column')
    );
  });

  test('styling a child object of the flexible layout properly applies that style to only that child', async ({
    page
  }) => {
    const backgroundColor = '#5b0f00';
    const textColor = '#e6b8af';
    // Directly navigate to the flexible layout
    await page.goto(flexibleLayout.url, { waitUntil: 'domcontentloaded' });

    // Edit Flexible Layout
    await page.getByLabel('Edit').click();

    // Select styles tab
    await page.getByRole('tab', { name: 'Styles' }).click();

    // Set styles using setStyles function
    await setStyles(page, backgroundColor, textColor, page.getByLabel('Stacked Plot Frame'));

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('Stacked Plot Style Target')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('Stacked Plot Style Target')
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
    await setStyles(page, backgroundColor, textColor, page.getByLabel('Stacked Plot Frame'));

    // Check styles using checkStyles function
    await checkStyles(
      hexToRGB(backgroundColor),
      hexToRGB(textColor),
      page.getByLabel('Stacked Plot Style Target')
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
    await setStyles(page, 'No Style', 'No Style', page.getByLabel('Stacked Plot Frame'));

    // Check styles using checkStyles function
    await checkStyles(
      NO_STYLE_RGBA,
      hexToRGB(inheritedColor),
      page.getByLabel('Stacked Plot Style Target')
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
      page.getByLabel('Stacked Plot Style Target')
    );
  });
});

/**
 * Converts a hex color value to its RGB equivalent.
 *
 * @param {string} hex - The hex color value.
 * @returns {string} The RGB equivalent of the hex color.
 */
function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : null;
}

/**
 * Sets the background and text color of a given element.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} backgroundColorHex - The hex value of the background color to set, or 'No Style'.
 * @param {string} textColorHex - The hex value of the text color to set, or 'No Style'.
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the element whose style is to be set.
 */
async function setStyles(page, backgroundColorHex, textColorHex, locator) {
  await locator.click(); // Assuming the locator is clickable and opens the style setting UI
  await page.getByLabel('Set background color').click();
  await page.getByLabel(backgroundColorHex).click();
  await page.getByLabel('Set text color').click();
  await page.getByLabel(textColorHex).click();
}

/**
 * Checks if the styles of an element match the expected values.
 *
 * @param {string} expectedBackgroundColor - The expected background color in RGB format.
 * @param {string} expectedTextColor - The expected text color in RGB format.
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the element whose style is to be checked.
 */
async function checkStyles(expectedBackgroundColor, expectedTextColor, locator) {
  const layoutStyles = await locator.evaluate((el) => {
    return {
      background: window.getComputedStyle(el).getPropertyValue('background-color'),
      fontColor: window.getComputedStyle(el).getPropertyValue('color')
    };
  });

  expect(layoutStyles.background).toContain(expectedBackgroundColor);
  expect(layoutStyles.fontColor).toContain(expectedTextColor);
}
