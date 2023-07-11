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

/*
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets.
*/

const { test, expect } = require('../../../../baseFixtures');

test.describe('Sine Wave Generator', () => {
  test('Create new Sine Wave Generator Object and validate create Form Logic', async ({
    page,
    browserName
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'firefox', 'This test needs to be updated to work with firefox');

    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click Sine Wave Generator
    await page.click('text=Sine Wave Generator');

    // Verify that the each required field has required indicator
    // Title
    await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/req/);

    // Verify that the Notes row does not have a required indicator
    await expect(
      page.locator('.c-form__section div:nth-child(3) .form-row .c-form-row__state-indicator')
    ).not.toContain('.req');
    await page.locator('textarea[type="text"]').fill('Optional Note Text');

    // Period
    await expect(page.locator('div:nth-child(4) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Amplitude
    await expect(page.locator('div:nth-child(5) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Offset
    await expect(page.locator('div:nth-child(6) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Data Rate
    await expect(page.locator('div:nth-child(7) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Phase
    await expect(page.locator('div:nth-child(8) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Randomness
    await expect(page.locator('div:nth-child(9) .c-form-row__state-indicator')).toHaveClass(/req/);

    // Verify that by removing value from required text field shows invalid indicator
    await page
      .locator(
        'text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]'
      )
      .fill('');
    await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/invalid/);

    // Verify that by adding value to empty required text field changes invalid to valid indicator
    await page
      .locator(
        'text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]'
      )
      .fill('New Sine Wave Generator');
    await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/valid/);

    // Verify that by removing value from required number field shows invalid indicator
    await page.locator('.field.control.l-input-sm input').first().fill('');
    await expect(page.locator('div:nth-child(4) .c-form-row__state-indicator')).toHaveClass(
      /invalid/
    );

    // Verify that by adding value to empty required number field changes invalid to valid indicator
    await page.locator('.field.control.l-input-sm input').first().fill('3');
    await expect(page.locator('div:nth-child(4) .c-form-row__state-indicator')).toHaveClass(
      /valid/
    );

    // Verify that can change value of number field by up/down arrows keys
    // Click .field.control.l-input-sm input >> nth=0
    await page.locator('.field.control.l-input-sm input').first().click();
    // Press ArrowUp 3 times to change value from 3 to 6
    await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');
    await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');
    await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');

    const value = await page.locator('.field.control.l-input-sm input').first().inputValue();
    await expect(value).toBe('6');

    //Click text=OK
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("OK")')]);

    // Verify that the Sine Wave Generator is displayed and correct
    // Verify object properties
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(
      'New Sine Wave Generator'
    );

    // Verify canvas rendered and can be interacted with
    await page
      .locator('canvas')
      .nth(1)
      .click({
        position: {
          x: 341,
          y: 28
        }
      });

    // Verify that where we click on canvas shows the number we clicked on
    // Note that any number will do, we just care that a number exists
    await expect(page.locator('.value-to-display-nearestValue')).toContainText(
      /[+-]?([0-9]*[.])?[0-9]+/
    );
  });
});
