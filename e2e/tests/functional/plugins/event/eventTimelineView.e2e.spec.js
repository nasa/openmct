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

import { createDomainObjectWithDefaults, setTimeConductorBounds } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Event Timeline View', () => {
  let eventTimelineView;
  let eventGenerator1;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    eventTimelineView = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: eventTimelineView.uuid
    });

    eventGenerator1 = await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: eventTimelineView.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator with Acknowledge',
      parent: eventTimelineView.uuid
    });

    await setTimeConductorBounds(page, {
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      startTime: '01:01:00',
      endTime: '01:04:00'
    });
  });

  test('Ensure we can build a Time Strip with event', async ({ page }) => {
    await page.goto(eventTimelineView.url);

    // click on an event
    await page
      .getByLabel(eventTimelineView.name)
      .getByLabel(/PROGRAM ALARM/)
      .click();

    // click on the event inspector tab
    await page.getByRole('tab', { name: 'Event' }).click();

    // ensure the event inspector has the the same event
    await expect(page.getByText(/PROGRAM ALARM/)).toBeVisible();

    // count the event lines
    const eventWrappersContainer = page.locator('.c-events-tsv__container');
    const eventWrappers = eventWrappersContainer.locator('.c-events-tsv__event-wrapper');
    const expectedEventWrappersCount = 25;
    await expect(eventWrappers).toHaveCount(expectedEventWrappersCount);

    // click on another event
    await page
      .getByLabel(eventTimelineView.name)
      .getByLabel(/pegged/)
      .click();

    // ensure the tooltip shows up
    await expect(
      page.getByRole('tooltip').getByText(/pegged on horizontal velocity/)
    ).toBeVisible();

    // and that event appears in the inspector
    await expect(
      page.getByLabel('Inspector Views').getByText(/pegged on horizontal velocity/)
    ).toBeVisible();

    // turn on extended lines
    await page
      .getByLabel(eventTimelineView.name)
      .getByRole('button', {
        name: `Toggle extended event lines overlay for ${eventGenerator1.name}`
      })
      .click();

    // count the extended lines
    const overlayLinesContainer = page.locator('.c-timeline__overlay-lines');
    const extendedLines = overlayLinesContainer.locator('.c-timeline__extended-line');
    const expectedCount = 25;
    await expect(extendedLines).toHaveCount(expectedCount);
  });
});
