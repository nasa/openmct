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

import { expect } from '../pluginFixtures.js';

/**
 * Converts a hex color value to its RGB equivalent.
 *
 * @param {string} hex - The hex color value. i.e. '#5b0f00'
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
 * @param {string} borderColorHex - The hex value of the border color to set, or 'No Style'.
 * @param {string} backgroundColorHex - The hex value of the background color to set, or 'No Style'.
 * @param {string} textColorHex - The hex value of the text color to set, or 'No Style'.
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the element whose style is to be set.
 */
async function setStyles(page, borderColorHex, backgroundColorHex, textColorHex, locator) {
  await locator.click(); // Assuming the locator is clickable and opens the style setting UI
  await page.getByLabel('Set border color').click();
  await page.getByLabel(borderColorHex).click();
  await page.getByLabel('Set background color').click();
  await page.getByLabel(backgroundColorHex).click();
  await page.getByLabel('Set text color').click();
  await page.getByLabel(textColorHex).click();
}

/**
 * Checks if the styles of an element match the expected values.
 *
 * @param {string} expectedBorderColor - The expected border color in RGB format. Default is '#e6b8af' or 'rgb(230, 184, 175)'
 * @param {string} expectedBackgroundColor - The expected background color in RGB format.
 * @param {string} expectedTextColor - The expected text color in RGB format. Default is #aaaaaa or 'rgb(170, 170, 170)'
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the element whose style is to be checked.
 */
async function checkStyles(
  expectedBorderColor,
  expectedBackgroundColor,
  expectedTextColor,
  locator
) {
  const layoutStyles = await locator.evaluate((el) => {
    return {
      border: window.getComputedStyle(el).getPropertyValue('border-top-color'), //infer the left, right, and bottom
      background: window.getComputedStyle(el).getPropertyValue('background-color'),
      fontColor: window.getComputedStyle(el).getPropertyValue('color')
    };
  });
  expect(layoutStyles.border).toContain(expectedBorderColor);
  expect(layoutStyles.background).toContain(expectedBackgroundColor);
  expect(layoutStyles.fontColor).toContain(expectedTextColor);
}

/**
 * Checks if the font Styles of an element match the expected values.
 *
 * @param {string} expectedFontSize - The expected font size in '72px' format. Default is 'Default'
 * @param {string} expectedFontWeight - The expected font Type. Format as '700' for bold. Default is 'Default'
 * @param {string} expectedFontFamily - The expected font Type. Format as "\"Andale Mono\", sans-serif". Default is 'Default'
 * @param {import('@playwright/test').Locator} locator - The Playwright locator for the element whose style is to be checked.
 */
async function checkFontStyles(expectedFontSize, expectedFontWeight, expectedFontFamily, locator) {
  const layoutStyles = await locator.evaluate((el) => {
    return {
      fontSize: window.getComputedStyle(el).getPropertyValue('font-size'),
      fontWeight: window.getComputedStyle(el).getPropertyValue('font-weight'),
      fontFamily: window.getComputedStyle(el).getPropertyValue('font-family')
    };
  });
  expect(layoutStyles.fontSize).toContain(expectedFontSize);
  expect(layoutStyles.fontWeight).toContain(expectedFontWeight);
  expect(layoutStyles.fontFamily).toContain(expectedFontFamily);
}

export { checkFontStyles, checkStyles, hexToRGB, setStyles };
