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
This test suite is dedicated to tests which verify Open MCT's Notification functionality
*/

const { createDomainObjectWithDefaults, createNotification } = require('../../appActions');
const { test, expect } = require('../../pluginFixtures');

test.describe('Notifications List', () => {
  test('Notifications can be dismissed individually', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6122'
    });

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create an error notification with the message "Error message"
    await createNotification(page, {
      severity: 'error',
      message: 'Error message'
    });

    // Create an alert notification with the message "Alert message"
    await createNotification(page, {
      severity: 'alert',
      message: 'Alert message'
    });

    // Verify that there is a button with aria-label "Review 2 Notifications"
    expect(await page.locator('button[aria-label="Review 2 Notifications"]').count()).toBe(1);

    // Click on button with aria-label "Review 2 Notifications"
    await page.click('button[aria-label="Review 2 Notifications"]');

    // Click on button with aria-label="Dismiss notification of Error message"
    await page.click('button[aria-label="Dismiss notification of Error message"]');

    // Verify there is no a notification (listitem) with the text "Error message" since it was dismissed
    expect(await page.locator('div[role="dialog"] div[role="listitem"]').innerText()).not.toContain(
      'Error message'
    );

    // Verify there is still a notification (listitem) with the text "Alert message"
    expect(await page.locator('div[role="dialog"] div[role="listitem"]').innerText()).toContain(
      'Alert message'
    );

    // Click on button with aria-label="Dismiss notification of Alert message"
    await page.click('button[aria-label="Dismiss notification of Alert message"]');

    // Verify that there is no dialog since the notification overlay was closed automatically after all notifications were dismissed
    expect(await page.locator('div[role="dialog"]').count()).toBe(0);
  });
});

test.describe('Notification Overlay', () => {
  test('Closing notification list after notification banner disappeared does not cause it to open automatically', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6130'
    });

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a new Display Layout object
    await createDomainObjectWithDefaults(page, { type: 'Display Layout' });

    // Click on the button "Review 1 Notification"
    await page.click('button[aria-label="Review 1 Notification"]');

    // Verify that Notification List is open
    expect(await page.locator('div[role="dialog"]').isVisible()).toBe(true);

    // Wait until there is no Notification Banner
    await page.waitForSelector('div[role="alert"]', { state: 'detached' });

    // Click on the "Close" button of the Notification List
    await page.click('button[aria-label="Close"]');

    // On the Display Layout object, click on the "Edit" button
    await page.click('button[title="Edit"]');

    // Click on the "Save" button
    await page.click('button[title="Save"]');

    // Click on the "Save and Finish Editing" option
    await page.click('li[title="Save and Finish Editing"]');

    // Verify that Notification List is NOT open
    expect(await page.locator('div[role="dialog"]').isVisible()).toBe(false);
  });
});
