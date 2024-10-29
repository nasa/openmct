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
/*
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets and styling
*/

import {
  createDomainObjectWithDefaults,
  linkParameterToObject,
  setRealTimeMode
} from '../../../../appActions.js';
import { MISSION_TIME } from '../../../../constants.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Conditionally Styling, using a Condition Set', () => {
  let stateGenerator;
  let conditionSet;
  let displayLayout;
  const STATE_CHANGE_INTERVAL = '1';

  test.beforeEach(async ({ page }) => {
    // Install the clock and set the time to the mission time such that the state generator will be controllable
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create Condition Set, State Generator, and Display Layout
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });
    stateGenerator = await createDomainObjectWithDefaults(page, {
      type: 'State Generator',
      name: 'One Second State Generator'
    });
    // edit the state generator to have a 1 second update rate
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByLabel('State Duration (seconds)', { exact: true }).fill(STATE_CHANGE_INTERVAL);
    await page.getByLabel('Save').click();

    displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
  });

  test('Conditional styling, using a Condition Set, will style correctly based on the output @clock', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7840'
    });

    // set up the condition set to use the state generator
    await page.goto(conditionSet.url, { waitUntil: 'domcontentloaded' });

    // Add the State Generator to the Condition Set by dragging from the main tree
    await page.getByLabel('Show selected item in tree').click();
    await page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: stateGenerator.name
      })
      .dragTo(page.locator('#conditionCollection'));

    // Add the state generator to the first criterion such that there is a condition named 'OFF' when the state generator is off
    await page.getByLabel('Add Condition').click();
    await page
      .getByLabel('Criterion Telemetry Selection')
      .selectOption({ label: stateGenerator.name });
    await page.getByLabel('Criterion Metadata Selection').selectOption({ label: 'State' });
    await page.getByLabel('Criterion Comparison Selection').selectOption({ label: 'is' });
    await page.getByLabel('Condition Name Input').first().fill('OFF');
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await linkParameterToObject(page, stateGenerator.name, displayLayout.name);

    //Add a box to the display layout
    await page.goto(displayLayout.url, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Edit Object').click();

    //Add a box to the display layout and move it to the right
    //TEMP: Click the layout such that the state generator is deselected
    await page.getByLabel('Test Display Layout Layout Grid').locator('div').nth(1).click();
    await page.getByLabel('Add Drawing Object').click();
    await page.getByText('Box').click();
    await page.getByLabel('X:').click();
    await page.getByLabel('X:').fill('10');
    await page.getByLabel('X:').press('Enter');

    // set up conditional styling such that the box is red when the state generator condition is 'OFF'
    await page.getByRole('tab', { name: 'Styles' }).click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    await page.getByLabel('Modal Overlay').getByLabel('Expand My Items folder').click();
    await page.getByLabel('Modal Overlay').getByLabel(`Preview ${conditionSet.name}`).click();
    await page.getByText('Ok').click();
    await page.getByLabel('Set background color').first().click();
    await page.getByLabel('#ff0000').click();
    await page.getByLabel('Save', { exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await setRealTimeMode(page);

    //Pause at a time when the state generator is 'OFF' which is 20 minutes in the future
    await page.clock.pauseAt(new Date(MISSION_TIME + 1200000));

    const redBG = 'background-color: rgb(255, 0, 0);';
    const defaultBG = 'background-color: rgb(102, 102, 102);';
    const textElement = page.getByLabel('Alpha-numeric telemetry value').locator('div:first-child');
    const styledElement = page.getByLabel('Box', { exact: true });

    await page.clock.resume();

    // Check if the style is red when text is 'OFF'
    await expect(textElement).toHaveText('OFF');
    await waitForStyleChange(styledElement, redBG);

    // Fast forward to the next state change
    await page.clock.fastForward(STATE_CHANGE_INTERVAL * 1000);

    // Check if the style is not red when text is 'ON'
    await expect(textElement).toHaveText('ON');
    await waitForStyleChange(styledElement, defaultBG);
  });
});

/**
 * Wait for the style of an element to change to the expected style.
 * @param {import('@playwright/test').Locator} element - The element to check.
 * @param {string} expectedStyle - The expected style to wait for.
 * @param {number} timeout - The timeout in milliseconds.
 */
async function waitForStyleChange(element, expectedStyle, timeout = 0) {
  await expect(async () => {
    const style = await element.getAttribute('style');

    // eslint-disable-next-line playwright/prefer-web-first-assertions
    expect(style).toBe(expectedStyle);
  }).toPass({ timeout: 1000 }); // timeout allows for the style to be applied
}
