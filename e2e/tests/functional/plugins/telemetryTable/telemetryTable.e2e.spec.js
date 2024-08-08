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

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithRealTime,
  setTimeConductorBounds
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Telemetry Table', () => {
  let table;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    table = await createDomainObjectWithDefaults(page, { type: 'Telemetry Table' });
  });

  test('Limits to 50 rows by default', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: table.uuid
    });
    await navigateToObjectWithRealTime(page, table.url);
    const rows = page.getByLabel('table content').getByLabel('Table Row');
    await expect(rows).toHaveCount(50);
  });

  test('on load, auto scrolls to top for descending, and to bottom for ascending', async ({
    page
  }) => {
    const sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: table.uuid
    });

    // verify in telemetry table object view
    await navigateToObjectWithRealTime(page, table.url);

    expect(await getScrollPosition(page)).toBe(0);

    // verify in telemetry table view
    await page.goto(sineWaveGenerator.url);
    await page.getByLabel('Open the View Switcher Menu').click();
    await page.getByText('Telemetry Table', { exact: true }).click();

    expect(await getScrollPosition(page)).toBe(0);

    // navigate back to table
    await page.goto(table.url);

    // go into edit mode
    await page.getByLabel('Edit Object').click();

    // change sort direction
    await page.locator('thead div').filter({ hasText: 'Time' }).click();

    // save view
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // navigate away and back
    await page.goto(sineWaveGenerator.url);
    await page.goto(table.url);

    // verify scroll position
    expect(await getScrollPosition(page, false)).toBeLessThan(1);
  });

  test('unpauses and filters data when paused by button and user changes bounds', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5113'
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    page.goto(table.url);

    // Click pause button
    const pauseButton = page.locator('button.c-button.icon-pause');
    await pauseButton.click();

    const tableWrapper = page.locator('div.c-table-wrapper');
    await expect(tableWrapper).toHaveClass(/is-paused/);

    // Subtract 5 minutes from the current end bound datetime and set it
    // Bring up the time conductor popup
    let endTimeStamp = await page.getByLabel('End bounds').textContent();
    endTimeStamp = new Date(endTimeStamp);

    endTimeStamp.setUTCMinutes(endTimeStamp.getUTCMinutes() - 5);
    const endDate = endTimeStamp.toISOString().split('T')[0];
    const endTime = endTimeStamp.toISOString().split('T')[1];

    await setTimeConductorBounds(page, { endDate, endTime });

    await expect(tableWrapper).not.toHaveClass(/is-paused/);

    // Get the most recent telemetry date
    const latestTelemetryDate = await page
      .getByLabel('table content')
      .getByLabel('utc table cell')
      .last()
      .getAttribute('title');

    // Verify that it is <= our new end bound
    const latestMilliseconds = Date.parse(latestTelemetryDate);
    const endBoundMilliseconds = Date.parse(endTimeStamp);
    expect(latestMilliseconds).toBeLessThanOrEqual(endBoundMilliseconds);
  });

  test('Supports filtering telemetry by regular text search', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    await page.goto(table.url);

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('Roger');

    let cells = await page.getByRole('cell').getByText(/Roger/).all();
    // ensure we've got more than one cell
    expect(cells.length).toBeGreaterThan(1);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      await expect(cell).toHaveText(/Roger/);
    }

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('Dodger');

    cells = await page
      .getByRole('cell')
      .getByText(/Dodger/)
      .all();
    // ensure we've got more than one cell
    expect(cells).toHaveLength(0);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      await expect(cell).not.toHaveText(/Dodger/);
    }

    // Click pause button
    await page.getByLabel('Pause').click();
  });

  test('Supports filtering using Regex', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    page.goto(table.url);
    await page.getByRole('searchbox', { name: 'message filter input' }).hover();
    await page
      .getByLabel('Message filter header')
      .getByLabel('Click to enable regex: enter a string with slashes, like this: /regex_exp/')
      .click();
    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('/[Rr]oger/');

    let cells = await page.getByRole('cell').getByText(/Roger/).all();
    // ensure we've got more than one cell
    expect(cells.length).toBeGreaterThan(1);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      await expect(cell).toHaveText(/Roger/);
    }

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('/[Dd]oger/');

    cells = await page
      .getByRole('cell')
      .getByText(/Dodger/)
      .all();
    // ensure we've got more than one cell
    expect(cells).toHaveLength(0);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      await expect(cell).not.toHaveText(/Dodger/);
    }

    // Click pause button
    await page.getByLabel('Pause').click();
  });
});

async function getScrollPosition(page, top = true) {
  const tableBody = page.locator('.c-table__body-w');

  // Wait for the scrollbar to appear
  await tableBody.evaluate((node) => {
    return new Promise((resolve) => {
      function checkScroll() {
        if (node.scrollHeight > node.clientHeight) {
          resolve();
        } else {
          setTimeout(checkScroll, 100);
        }
      }
      checkScroll();
    });
  });

  // make sure there are rows
  const rows = page.getByLabel('table content').getByLabel('Table Row');
  await rows.first().waitFor();

  // Using this to allow for rows to come and go, so we can truly test the scroll position
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(1000);

  const { scrollTop, clientHeight, scrollHeight } = await tableBody.evaluate((node) => ({
    scrollTop: node.scrollTop,
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight
  }));

  if (top) {
    return scrollTop;
  } else {
    return Math.abs(scrollHeight - (scrollTop + clientHeight));
  }
}
