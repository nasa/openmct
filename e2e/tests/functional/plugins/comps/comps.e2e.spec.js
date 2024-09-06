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
import { createDomainObjectWithDefaults, setRealTimeMode } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Comps', () => {
  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Basic Functionality Works', async ({ page }) => {
    // Create the comps with defaults
    const comp = await createDomainObjectWithDefaults(page, { type: 'Derived Telemetry' });

    // Create a sine wave generator within the comp
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: comp.uuid
    });

    // Check that expressions can be edited
    await page.goto(comp.url);
    await page.getByLabel('Edit Object').click();
    await page.getByPlaceholder('Enter an expression').fill('a*2');
    await page.getByText('Current Output').click();
    await expect(page.getByText('Expression valid')).toBeVisible();

    // Check that expressions are marked invalid
    await page.getByLabel('Reference Name Input for a').fill('b');
    await page.getByText('Current Output').click();
    await expect(page.getByText('Invalid: Undefined symbol a')).toBeVisible();

    // Check that test data works
    await page.getByPlaceholder('Enter an expression').fill('b*2');
    await page.getByLabel('Reference Test Value for b').fill('5');
    await page.getByLabel('Apply Test Data').click();
    let testValue = await page.getByLabel('Current Output Value').textContent();
    expect(testValue).toBe('10');

    // Check that real data works
    await page.getByLabel('Apply Test Data').click();
    await setRealTimeMode(page);
    testValue = await page.getByLabel('Current Output Value').textContent();
    expect(testValue).not.toBe('10');
    // should be a number
    expect(parseFloat(testValue)).not.toBeNaN();

    // Check that the comps are saved
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    const expression = await page.getByLabel('Expression', { exact: true }).textContent();
    expect(expression).toBe('b*2');

    // Check that comps work after being saved
    testValue = await page.getByLabel('Current Output Value').textContent();
    expect(testValue).not.toBe('10');
    // should be a number
    expect(parseFloat(testValue)).not.toBeNaN();

    // Check that output format can be changed
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'Config' }).click();
    await page.getByLabel('Output Format').click();
    await page.getByLabel('Output Format').fill('%d');
    await page.getByRole('tab', { name: 'Config' }).click();
    // Ensure we only have one digit
    await expect(page.getByLabel('Current Output Value')).toHaveText(/^-1$|^0$|^1$/);
    // And that it persists post save
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await expect(page.getByLabel('Current Output Value')).toHaveText(/^-1$|^0$|^1$/);
  });
});
