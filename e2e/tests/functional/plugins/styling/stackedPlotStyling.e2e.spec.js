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
 * This test is dedicated to test styling of stacked plots
 */

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import {
  checkFontStyles,
  checkStyles,
  hexToRGB,
  setStyles
} from '../../../../helper/stylingUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

const setBorderColor = '#ff00ff';
const setBackgroundColor = '#5b0f00';
const setTextColor = '#e6b8af';
const defaultFrameBorderColor = '#e6b8af'; //default border color
const defaultBorderTargetColor = '#aaaaaa';
const defaultTextColor = '#aaaaaa'; // default text color
const inheritedColor = '#aaaaaa'; // inherited from the body style
const pukeGreen = '#6aa84f'; //Ugliest green known to man
const NO_STYLE_RGBA = 'rgba(0, 0, 0, 0)'; //default background color value
const setFontSize = '72px';
const setFontType = 'sans-serif'; //Andale Mono", sans-serif

test.describe('Stacked Plot styling', () => {
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

  test('styling the overlay plot properly applies the styles to all containers', async ({
    page
  }) => {
    // Directly navigate to the stackedplot
    await page.goto(stackedPlot.url, { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Edit').click();

    await page.getByRole('tab', { name: 'Styles' }).click();

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

    //Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Style Target')
    );

    await checkFontStyles(setFontSize, setFontType, page.getByLabel('Stacked Plot Item Sine Wave Generator 1'));

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    //Verify styles are correct after reload
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Style Target')
    );

    //Verify that stacked Plot Items inherit only text properties
    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 2')
    );
  });

  test('styling a child object of the flexible layout properly applies that style to only that child', async ({
    page
  }) => {
    await page.goto(stackedPlot.url, { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Edit').click();

    await page.getByRole('tab', { name: 'Styles' }).click();

    //Check default styles for SWG1 and SWG2
    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 2')
    );

    // Set styles using setStyles function on StackedPlot1 but not StackedPlot2
    await setStyles(
      page,
      setBorderColor,
      setBackgroundColor,
      setTextColor,
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    // Save Flexible Layout
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 2')
    );

    // Reload page and verify that styles persist
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check styles on StackedPlot1
    await checkStyles(
      hexToRGB(setBorderColor),
      hexToRGB(setBackgroundColor),
      hexToRGB(setTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 1')
    );

    // Check styles on StackedPlot2
    await checkStyles(
      NO_STYLE_RGBA,
      NO_STYLE_RGBA,
      hexToRGB(defaultTextColor),
      page.getByLabel('Stacked Plot Item Sine Wave Generator 2')
    );
  });
});
