/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

const { test, expect } = require('@playwright/test');

test.describe('Sine Wave Generator', () => {
    test('Create new Sine Wave Generator Object and validate create Form Logic', async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click Sine Wave Generator
        await page.click('text=Sine Wave Generator');

        // Verify that the each required field has required indicator
        // Title
        await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(['c-form-row__state-indicator  req']);

        // Verify that the Notes row does not have a required indicator
        await expect(page.locator('.c-form__section div:nth-child(3) .form-row .c-form-row__state-indicator')).not.toContain('.req');

        // Period
        await expect(page.locator('.c-form__section div:nth-child(4) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Amplitude
        await expect(page.locator('.c-form__section div:nth-child(5) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Offset
        await expect(page.locator('.c-form__section div:nth-child(6) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Data Rate
        await expect(page.locator('.c-form__section div:nth-child(7) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Phase
        await expect(page.locator('.c-form__section div:nth-child(8) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Randomness
        await expect(page.locator('.c-form__section div:nth-child(9) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req']);

        // Verify that by removing value from required text field shows invalid indicator
        await page.locator('text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]').fill('');
        await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(['c-form-row__state-indicator  req invalid']);

        // Verify that by adding value to empty required text field changes invalid to valid indicator
        await page.locator('text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]').fill('non empty');
        await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(['c-form-row__state-indicator  req valid']);

        // Verify that by removing value from required number field shows invalid indicator
        await page.locator('.field.control.l-input-sm input').first().fill('');
        await expect(page.locator('.c-form__section div:nth-child(4) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req invalid']);

        // Verify that by adding value to empty required number field changes invalid to valid indicator
        await page.locator('.field.control.l-input-sm input').first().fill('3');
        await expect(page.locator('.c-form__section div:nth-child(4) .form-row .c-form-row__state-indicator')).toHaveClass(['c-form-row__state-indicator  req valid']);

        // Verify that can change value of number field by up/down arrows keys
        // Click .field.control.l-input-sm input >> nth=0
        await page.locator('.field.control.l-input-sm input').first().click();
        // Press ArrowUp 3 times to change value from 3 to 6
        await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');
        await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');
        await page.locator('.field.control.l-input-sm input').first().press('ArrowUp');

        const value = await page.locator('.field.control.l-input-sm input').first().inputValue();
        await expect(value).toBe('6');

        // Click .c-form-row__state-indicator.grows
        await page.locator('.c-form-row__state-indicator.grows').click();

        // Click text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]
        await page.locator('text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]').click();

        // Click .c-form-row__state-indicator >> nth=0
        await page.locator('.c-form-row__state-indicator').first().click();

        // Fill text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]
        await page.locator('text=Properties Title Notes Period Amplitude Offset Data Rate (hz) Phase (radians) Ra >> input[type="text"]').fill('New Sine Wave Generator');

        // Double click div:nth-child(4) .form-row .c-form-row__controls
        await page.locator('div:nth-child(4) .form-row .c-form-row__controls').dblclick();

        // Click .field.control.l-input-sm input >> nth=0
        await page.locator('.field.control.l-input-sm input').first().click();

        // Click div:nth-child(4) .form-row .c-form-row__state-indicator
        await page.locator('div:nth-child(4) .form-row .c-form-row__state-indicator').click();

        // Click .field.control.l-input-sm input >> nth=0
        await page.locator('.field.control.l-input-sm input').first().click();

        // Click .field.control.l-input-sm input >> nth=0
        await page.locator('.field.control.l-input-sm input').first().click();

        // Click div:nth-child(5) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(5) .form-row .c-form-row__controls .form-control .field input').click();

        // Click div:nth-child(5) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(5) .form-row .c-form-row__controls .form-control .field input').click();

        // Click div:nth-child(5) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(5) .form-row .c-form-row__controls .form-control .field input').click();

        // Click div:nth-child(6) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(6) .form-row .c-form-row__controls .form-control .field input').click();

        // Double click div:nth-child(7) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(7) .form-row .c-form-row__controls .form-control .field input').dblclick();

        // Click div:nth-child(7) .form-row .c-form-row__state-indicator
        await page.locator('div:nth-child(7) .form-row .c-form-row__state-indicator').click();

        // Click div:nth-child(7) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(7) .form-row .c-form-row__controls .form-control .field input').click();

        // Fill div:nth-child(7) .form-row .c-form-row__controls .form-control .field input
        await page.locator('div:nth-child(7) .form-row .c-form-row__controls .form-control .field input').fill('3');

        //Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.click('text=OK')
        ]);

        // Verify that the Sine Wave Generator is displayed and correct
        // Verify object properties
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('New Sine Wave Generator');

        // Verify canvas rendered
        await page.locator('canvas').nth(1).click({
            position: {
                x: 341,
                y: 28
            }
        });
    });
});
