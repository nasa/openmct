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
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Event Timeline View', () => {
  let eventTimelineView;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    eventTimelineView = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: eventTimelineView.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: eventTimelineView.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator with Acknowledge',
      parent: eventTimelineView.uuid
    });
  });

  test('Ensure we can build a Time Strip', async ({ page }) => {
    await page.goto(eventTimelineView.url);
    await page
      .getByLabel(eventTimelineView.name)
      .getByLabel(/PROGRAM ALARM/)
      .click();

    await page.getByText('Event', { exact: true }).click({ force: true });
    await expect(page.getByText('LMP: 350 feet, down at 4. - [')).toBeVisible();
  });
});
