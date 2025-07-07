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

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import { MISSION_TIME } from '../../../../constants.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Timer', () => {
  let timer;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    timer = await createDomainObjectWithDefaults(page, { type: 'timer' });
  });

  test('Can perform actions on the Timer', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/4313'
    });

    await test.step('From the tree context menu', async () => {
      await triggerTimerContextMenuAction(page, timer.url, 'Start');
      await triggerTimerContextMenuAction(page, timer.url, 'Pause');
      await triggerTimerContextMenuAction(page, timer.url, 'Restart at 0');
      await triggerTimerContextMenuAction(page, timer.url, 'Stop');
    });

    await test.step('From the 3dot menu', async () => {
      await triggerTimer3dotMenuAction(page, 'Start');
      await triggerTimer3dotMenuAction(page, 'Pause');
      await triggerTimer3dotMenuAction(page, 'Restart at 0');
      await triggerTimer3dotMenuAction(page, 'Stop');
    });

    await test.step('From the object view', async () => {
      await triggerTimerViewAction(page, 'Start');
      await triggerTimerViewAction(page, 'Pause');
      await triggerTimerViewAction(page, 'Restart at 0');
    });
  });
});

test.describe('Timer with target date @clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await createDomainObjectWithDefaults(page, { type: 'timer' });
  });

  test('Can count down to a target date', async ({ page }) => {
    // Set the target date to 2024-11-24 03:30:00
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: /Edit Properties.../ }).click();

    await page.getByPlaceholder('YYYY-MM-DD').fill('2024-11-24');
    await page.locator('input[name="hour"]').fill('3');
    await page.locator('input[name="min"]').fill('30');
    await page.locator('input[name="sec"]').fill('00');
    await page.getByLabel('Save').click();

    // Get the current timer seconds value
    const timerSecValue = (await page.locator('.c-timer__value').innerText()).split(':').at(-1);
    await expect(page.locator('.c-timer__direction')).toHaveClass(/icon-minus/);

    // Wait for the timer to count down and assert
    await expect
      .poll(async () => {
        const newTimerValue = (await page.locator('.c-timer__value').innerText()).split(':').at(-1);
        return Number(newTimerValue);
      })
      .toBeLessThan(Number(timerSecValue));
  });

  test('Can count up from a target date', async ({ page }) => {
    // Set the target date to 2020-11-23 03:30:00
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: /Edit Properties.../ }).click();
    await page.getByPlaceholder('YYYY-MM-DD').fill('2020-11-23');
    await page.locator('input[name="hour"]').fill('3');
    await page.locator('input[name="min"]').fill('30');
    await page.locator('input[name="sec"]').fill('00');
    await page.getByLabel('Save').click();

    // Get the current timer seconds value
    const timerSecValue = (await page.locator('.c-timer__value').innerText()).split(':').at(-1);
    await expect(page.locator('.c-timer__direction')).toHaveClass(/icon-plus/);

    // Wait for the timer to count up and assert
    await expect
      .poll(async () => {
        const newTimerValue = (await page.locator('.c-timer__value').innerText()).split(':').at(-1);
        return Number(newTimerValue);
      })
      .toBeGreaterThan(Number(timerSecValue));
  });
});

/**
 * Actions that can be performed on a timer from context menus.
 * @typedef {'Start' | 'Stop' | 'Pause' | 'Restart at 0'} TimerAction
 */

/**
 * Actions that can be performed on a timer from the object view.
 * @typedef {'Start' | 'Pause' | 'Restart at 0'} TimerViewAction
 */

/**
 * Trigger a timer action from the tree context menu
 * @param {import('@playwright/test').Page} page
 * @param {TimerAction} action
 */
async function triggerTimerContextMenuAction(page, timerUrl, action) {
  const menuAction = `.c-menu ul li >> text="${action}"`;
  await openObjectTreeContextMenu(page, timerUrl);
  await page.locator(menuAction).click();
  assertTimerStateAfterAction(page, action);
}

/**
 * Trigger a timer action from the 3dot menu
 * @param {import('@playwright/test').Page} page
 * @param {TimerAction} action
 */
async function triggerTimer3dotMenuAction(page, action) {
  const menuAction = `.c-menu ul li >> text="${action}"`;
  let isActionAvailable = false;
  let iterations = 0;
  // Dismiss/open the 3dot menu until the action is available
  // or a maximum number of iterations is reached
  while (!isActionAvailable && iterations <= 20) {
    await page.getByLabel('Object View').click();
    await page.getByLabel('More actions').click();
    isActionAvailable = await page.locator(menuAction).isVisible();
    iterations++;
  }

  await page.locator(menuAction).click();
  assertTimerStateAfterAction(page, action);
}

/**
 * Trigger a timer action from the object view
 * @param {import('@playwright/test').Page} page
 * @param {TimerViewAction} action
 */
async function triggerTimerViewAction(page, action) {
  await page.locator('.c-timer').hover({ trial: true });
  const buttonTitle = buttonTitleFromAction(action);
  await page.getByLabel(buttonTitle, { exact: true }).click();
  assertTimerStateAfterAction(page, action);
}

/**
 * Takes in a TimerViewAction and returns the button title
 * @param {TimerViewAction} action
 */
function buttonTitleFromAction(action) {
  switch (action) {
    case 'Start':
      return 'Start';
    case 'Pause':
      return 'Pause';
    case 'Restart at 0':
      return 'Reset';
  }
}

/**
 * Verify the timer state after a timer action has been performed.
 * @param {import('@playwright/test').Page} page
 * @param {TimerAction} action
 */
async function assertTimerStateAfterAction(page, action) {
  const timerValue = page.locator('.c-timer__value');
  let timerStateClass;
  switch (action) {
    case 'Start':
    case 'Restart at 0':
      timerStateClass = 'is-started';
      await expect(timerValue).toHaveText('0D 00:00:00');
      break;
    case 'Stop':
      timerStateClass = 'is-stopped';
      await expect(timerValue).toHaveText('--:--:--');
      break;
    case 'Pause':
      timerStateClass = 'is-paused';
      break;
  }

  await expect.soft(page.locator('.c-timer')).toHaveClass(new RegExp(timerStateClass));
}

/**
 * Open the given `domainObject`'s context menu from the object tree.
 * Expands the path to the object and scrolls to it if necessary.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url the url to the object
 */
async function openObjectTreeContextMenu(page, url) {
  await page.goto(url);
  await page.getByLabel('Show selected item in tree').click();
  await page.locator('.is-navigated-object').click({
    button: 'right'
  });
}
