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

const { expect } = require('../pluginFixtures');

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

// eslint-disable-next-line no-undef
module.exports = {
  checkStyles,
  setStyles,
  hexToRGB
};
