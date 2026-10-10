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
  setEndOffset,
  setRealTimeMode,
  setStartOffset
} from '../../../../appActions.js';
import { MISSION_TIME } from '../../../../constants.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Conditionally Styling, using a Condition Set', () => {
  let conditionSet;
  let displayLayout;
  let textElement;
  let styledElement;

  const onBG = 'background-color: rgb(0, 255, 0);';
  const offBG = 'background-color: rgb(255, 0, 0);';
  const defaultBG = 'background-color: rgb(0, 0, 255);';

  test.beforeEach(async ({ page }) => {
    // Install the clock and set the time to the mission time such that the state generator will be controllable
    await page.clock.install({ time: MISSION_TIME });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    textElement = page.getByLabel('Alpha-numeric telemetry value').locator('div:first-child');
    styledElement = page.getByLabel('Box', { exact: true });

    // Create Condition Set and Display Layout
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });

    displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
  });

  test('Conditional styling, using a Condition Set, will style correctly based on the output @clock', async ({
    page
  }) => {
    const STATE_CHANGE_INTERVAL = '1';
    const stateGenerator = await createDomainObjectWithDefaults(page, {
      type: 'State Generator',
      name: 'One Second State Generator'
    });

    await page.clock.resume();

    // edit the state generator to have a 1 second update rate
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByLabel('State Duration (seconds)', { exact: true }).fill(STATE_CHANGE_INTERVAL);
    await page.getByLabel('Save').click();

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

    // Add a condition named 'OFF' when the state generator is off
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('OFF');
    await page.getByLabel('Criterion Telemetry Selection').selectOption({ value: 'all' });
    await page.getByLabel('Criterion Metadata Selection').selectOption({ label: 'State' });
    await page.getByLabel('Criterion Comparison Selection').selectOption({ label: 'is' });
    await page.getByLabel('Criterion Else Selection').selectOption({ label: 'OFF' });

    // Add a condition named 'ON' when the state generator is on
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('ON');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'true' });
    await page.getByLabel('Criterion Telemetry Selection').first().selectOption({ value: 'all' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ label: 'State' });
    await page.getByLabel('Criterion Comparison Selection').first().selectOption({ label: 'is' });
    await page.getByLabel('Criterion Else Selection').first().selectOption({ label: 'ON' });

    // Save the condition set
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await linkParameterToObject(page, stateGenerator.name, displayLayout.name);

    // Add a box to the display layout
    await page.goto(displayLayout.url, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Edit Object').click();

    // Add a box to the display layout and move it to the right
    // TEMP: Click the layout such that the state generator is deselected
    await page.getByLabel('Test Display Layout Layout Grid').locator('div').nth(1).click();
    await page.getByLabel('Add Drawing Object').click();
    await page.getByText('Box').click();
    await page.getByLabel('X:').click();
    await page.getByLabel('X:').fill('10');
    await page.getByLabel('X:').press('Enter');

    // set up conditional styling
    await page.getByRole('tab', { name: 'Styles' }).click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    await page.getByLabel('Modal Overlay').getByLabel('Expand My Items folder').click();
    await page.getByLabel('Modal Overlay').getByLabel(`Preview ${conditionSet.name}`).click();
    await page.getByText('Ok').click();

    // style box green when the state generator condition is 'ON'
    page
      .locator('.c-inspect-styles__condition')
      .filter({ hasText: 'ON Match' })
      .getByLabel('Set background color')
      .click();
    await page.getByLabel('#00ff00').click();

    // style box red when the state generator condition is 'OFF'
    page
      .locator('.c-inspect-styles__condition')
      .filter({ hasText: 'OFF Match' })
      .getByLabel('Set background color')
      .click();
    await page.getByLabel('#ff0000').click();

    // save the display layout
    await page.getByLabel('Save', { exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await setRealTimeMode(page);

    // Pause at a time when the state generator is 'OFF' which is 20 minutes in the future
    await page.clock.pauseAt(new Date(MISSION_TIME + 1200000));

    await page.clock.resume();

    // Check if the style is red when text is 'OFF'
    await expect(textElement).toHaveText('OFF');
    await waitForStyleChange(styledElement, offBG);

    // Fast forward to the next state change
    await page.clock.fastForward(STATE_CHANGE_INTERVAL * 1000);

    // Check if the style is not red when text is 'ON'
    await expect(textElement).toHaveText('ON');
    await waitForStyleChange(styledElement, onBG);
  });

  test('Conditional styling, using a Condition Set, will be the default style if no conditions match, including if no telemetry has been received @clock', async ({
    page
  }) => {
    const LOADING_DELAY = 5000;
    const sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Sine Wave Generator'
    });

    await setRealTimeMode(page);
    await setStartOffset(page, {
      submitChanges: true,
      startHours: '00',
      startMins: '00',
      startSecs: '02'
    });
    await setEndOffset(page, {
      submitChanges: true,
      endHours: '00',
      endMins: '00',
      endSecs: '01'
    });

    // edit the sine wave generator to have a 5 second loading delay
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: 'Edit Properties...' }).click();
    await page.getByLabel('Loading Delay (ms)', { exact: true }).fill(`${LOADING_DELAY}`);
    await page.getByLabel('Save').click();

    // set up the condition set to use the state generator
    await page.goto(conditionSet.url, { waitUntil: 'domcontentloaded' });

    // Add the Sine Wave Generator to the Condition Set by dragging from the main tree
    await page.getByLabel('Show selected item in tree').click();
    await page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: sineWaveGenerator.name
      })
      .dragTo(page.locator('#conditionCollection'));

    // Add a condition named 'ON' when the since wave generator has data
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('ON');
    await page.getByLabel('Criterion Telemetry Selection').selectOption({ value: 'all' });
    await page.getByLabel('Criterion Metadata Selection').selectOption({ label: 'Sine' });
    await page.getByLabel('Criterion Comparison Selection').selectOption({ label: 'is defined' });

    // Save the condition set
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await linkParameterToObject(page, sineWaveGenerator.name, displayLayout.name);

    // Add a box to the display layout
    await page.goto(displayLayout.url, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Edit Object').click();

    // Add a box to the display layout and move it to the right
    // TEMP: Click the layout such that the sine wave generator is deselected
    await page.getByLabel('Test Display Layout Layout Grid').locator('div').nth(1).click();
    await page.getByLabel('Add Drawing Object').click();
    await page.getByText('Box').click();
    await page.getByLabel('X:').click();
    await page.getByLabel('X:').fill('10');
    await page.getByLabel('X:').press('Enter');

    // set up conditional styling
    await page.getByRole('tab', { name: 'Styles' }).click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    await page.getByLabel('Modal Overlay').getByLabel('Expand My Items folder').click();
    await page.getByLabel('Modal Overlay').getByLabel(`Preview ${conditionSet.name}`).click();
    await page.getByText('Ok').click();

    // style box green when the sine wave generator condition is 'ON'
    page
      .locator('.c-inspect-styles__condition')
      .filter({ hasText: 'ON Match' })
      .getByLabel('Set background color')
      .click();
    await page.getByLabel('#00ff00').click();

    // style box blue when the state generator condition is 'Default'
    page
      .locator('.c-inspect-styles__condition')
      .filter({ hasText: 'Default Match' })
      .getByLabel('Set background color')
      .click();
    await page.getByLabel('#0000ff').click();

    // save the display layout
    await page.getByLabel('Save', { exact: true }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Check before telemetry is received the style is 'Default'
    // and the condition output is '---'
    await expect(textElement).toHaveText('---');
    await waitForStyleChange(styledElement, defaultBG);

    await page.clock.resume();

    // Fast forward to the next state change
    await page.clock.fastForward(LOADING_DELAY);

    // Check after telemetry is received the style is 'ON'
    // and the condition output is not '---'
    await expect(textElement).not.toHaveText('---');
    await waitForStyleChange(styledElement, onBG);
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
