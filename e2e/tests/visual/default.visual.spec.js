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
Collection of Visual Tests set to run in a default context. The tests within this suite
are only meant to run against openmct's app.js started by `npm run start` within the
`./e2e/playwright-visual.config.js` file.

These should only use functional expect statements to verify assumptions about the state
in a test and not for functional verification of correctness. Visual tests are not supposed
to "fail" on assertions. Instead, they should be used to detect changes between builds or branches.

Note: Larger testsuite sizes are OK due to the setup time associated with these tests.
*/

const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');
const path = require('path');
const sinon = require('sinon');

const VISUAL_GRACE_PERIOD = 5 * 1000; //Lets the application "simmer" before the snapshot is taken

// Snippet from https://github.com/microsoft/playwright/issues/6347#issuecomment-965887758
// Will replace with cy.clock() equivalent
test.beforeEach(async ({ context }) => {
    await context.addInitScript({
        // eslint-disable-next-line no-undef
        path: path.join(__dirname, '../../..', './node_modules/sinon/pkg/sinon.js')
    });
    await context.addInitScript(() => {
        window.__clock = sinon.useFakeTimers({
            now: 0,
            shouldAdvanceTime: true
        }); //Set browser clock to UNIX Epoch
    });
});

test('Visual - Root and About', async ({ page }) => {
    // Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify that Create button is actionable
    await expect(page.locator('button:has-text("Create")')).toBeEnabled();

    // Take a snapshot of the Dashboard
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Root');

    // Click About button
    await page.click('.l-shell__app-logo');

    // Modify the Build information in 'about' to be consistent run-over-run
    const versionInformationLocator = page.locator('ul.t-info.l-info.s-info');
    await expect(versionInformationLocator).toBeEnabled();
    await versionInformationLocator.evaluate(node => node.innerHTML = '<li>Version: visual-snapshot</li> <li>Build Date: Mon Nov 15 2021 08:07:51 GMT-0800 (Pacific Standard Time)</li> <li>Revision: 93049cdbc6c047697ca204893db9603b864b8c9f</li> <li>Branch: master</li>');

    // Take a snapshot of the About modal
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'About');
});

test('Visual - Default Condition Set', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Condition Set
    await page.click('text=Condition Set');

    // Click text=OK
    await page.click('text=OK');

    // Take a snapshot of the newly created Condition Set object
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Condition Set');
});

test('Visual - Default Condition Widget', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Condition Widget
    await page.click('text=Condition Widget');

    // Click text=OK
    await page.click('text=OK');

    // Take a snapshot of the newly created Condition Widget object
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Condition Widget');
});

test('Visual - Time Conductor start time is less than end time', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });
    const year = new Date().getFullYear();

    let startDate = 'xxxx-01-01 01:00:00.000Z';
    startDate = year + startDate.substring(4);

    let endDate = 'xxxx-01-01 02:00:00.000Z';
    endDate = year + endDate.substring(4);

    await page.locator('input[type="text"]').nth(1).fill(endDate.toString());
    await page.locator('input[type="text"]').first().fill(startDate.toString());

    //  verify no error msg
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Time conductor');

    startDate = (year + 1) + startDate.substring(4);
    await page.locator('input[type="text"]').first().fill(startDate.toString());
    await page.locator('input[type="text"]').nth(1).click();

    //  verify error msg for start time (unable to capture snapshot of popup)
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Start time error');

    startDate = (year - 1) + startDate.substring(4);
    await page.locator('input[type="text"]').first().fill(startDate.toString());

    endDate = (year - 2) + endDate.substring(4);
    await page.locator('input[type="text"]').nth(1).fill(endDate.toString());

    await page.locator('input[type="text"]').first().click();

    //  verify error msg for end time (unable to capture snapshot of popup)
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'End time error');
});

test('Visual - Sine Wave Generator Form', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Sine Wave Generator
    await page.click('text=Sine Wave Generator');

    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Sine Wave Generator Form');

    await page.locator('.field.control.l-input-sm input').first().click();
    await page.locator('.field.control.l-input-sm input').first().fill('');

    // Validate red x mark
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'removed amplitude property value');
});

test('Visual - Save Successful Banner', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    //NOTE Something other than example imagery
    await page.click('text=Timer');

    // Click text=OK
    await page.click('text=OK');
    await page.locator('.c-message-banner__message').hover({ trial: true });
    await percySnapshot(page, 'Banner message shown');

    //Wait until Save Banner is gone
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
    await percySnapshot(page, 'Banner message gone');
});

test('Visual - Display Layout Icon is correct', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    //Hover on Display Layout option.
    await page.locator('text=Display Layout').hover();
    await percySnapshot(page, 'Display Layout Create Menu');

});
