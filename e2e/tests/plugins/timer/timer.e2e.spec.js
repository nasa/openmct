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

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Timer', () => {

    test.beforeEach(async ({ page }) => {
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click 'Timer'
        await page.click('text=Timer');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK')
        ]);

        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Timer');
    });

    test('Can start, pause, restart, and stop timer within context menu and 3dot menu', async ({ page }) => {
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/4313'
        });

        await test.step("Use Timer actions from the tree context menu", async () => {
            await triggerTimerContextMenuAction(page, 'Start');
            await triggerTimerContextMenuAction(page, 'Pause');
            await triggerTimerContextMenuAction(page, 'Restart at 0');
            await triggerTimerContextMenuAction(page, 'Stop');
        });

        await test.step("Use Timer actions from the 3dot menu", async () => {
            await triggerTimer3dotMenuAction(page, 'Start');
            await triggerTimer3dotMenuAction(page, 'Pause');
            await triggerTimer3dotMenuAction(page, 'Restart at 0');
            await triggerTimer3dotMenuAction(page, 'Stop');
        });
    });
});

/**
 * Open the timer context menu from the object tree
 * @param {import('@playwright/test').Page} page
 */
async function openTimerContextMenu(page) {
    const myItemsFolder = page.locator('text=Open MCT My Items >> span').nth(3);
    const className = await myItemsFolder.getAttribute('class');
    if (!className.includes('c-disclosure-triangle--expanded')) {
        await myItemsFolder.click();
    }

    await page.locator(`a:has-text("Unnamed Timer")`).click({
        button: 'right'
    });
}

/**
 * Trigger a timer action from the tree context menu
 * @param {import('@playwright/test').Page} page
 * @param {'Start' | 'Stop' | 'Pause' | 'Restart at 0'} action
 */
async function triggerTimerContextMenuAction(page, action) {
    await openTimerContextMenu(page);
    let menuOptions = page.locator('.c-menu ul');
    await expect.soft(menuOptions).toContainText(action);
    await page.locator(`.c-menu ul li:has-text("${action}")`).click();
    await openTimerContextMenu(page);
    menuOptions = page.locator('.c-menu ul');
    await assertAvailableActions(menuOptions, action);
}

/**
 * Trigger a timer action from the 3dot menu
 * @param {import('@playwright/test').Page} page
 * @param {'Start' | 'Stop' | 'Pause' | 'Restart at 0'} action
 */
async function triggerTimer3dotMenuAction(page, action) {
    const threeDotMenuButton = 'button[title="More options"]';
    await page.click(threeDotMenuButton);
    await page.locator(`.c-menu ul li:has-text("${action}")`).click();

    // FIXME: Figure out a way to not need an explicit wait here.
    // Need to wait for 3dot menu options to update via event.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);

    await page.click(threeDotMenuButton);
    const menuOptions = page.locator('.c-menu ul');
    await assertAvailableActions(menuOptions, action);

    // Dismiss 3dot menu (click outside of it)
    await page.click('.c-object-view');
}

/**
 * Assert the available actions in the menu after performing the given action
 * @param {import('@playwright/test').Locator} menuLocator
 * @param {'Start' | 'Stop' | 'Pause' | 'Restart at 0'} action
 */
async function assertAvailableActions(menuLocator, action) {
    switch (action) {
    case 'Start':
        await expect.soft(menuLocator).not.toContainText('Start');
        await expect.soft(menuLocator).toContainText('Stop');
        await expect.soft(menuLocator).toContainText('Pause');
        await expect.soft(menuLocator).toContainText('Restart at 0');
        break;
    case 'Stop':
        await expect.soft(menuLocator).toContainText('Start');
        await expect.soft(menuLocator).not.toContainText('Stop');
        await expect.soft(menuLocator).not.toContainText('Pause');
        await expect.soft(menuLocator).not.toContainText('Restart at 0');
        break;
    case 'Pause':
        await expect.soft(menuLocator).toContainText('Start');
        await expect.soft(menuLocator).toContainText('Stop');
        await expect.soft(menuLocator).not.toContainText('Pause');
        await expect.soft(menuLocator).toContainText('Restart at 0');
        break;
    case 'Restart at 0':
        await expect.soft(menuLocator).not.toContainText('Start');
        await expect.soft(menuLocator).toContainText('Stop');
        await expect.soft(menuLocator).toContainText('Pause');
        await expect.soft(menuLocator).toContainText('Restart at 0');
        break;
    }
}
