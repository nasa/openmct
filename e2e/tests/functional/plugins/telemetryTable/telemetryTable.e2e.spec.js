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

test.describe('Telemetry Table', () => {
  test('unpauses and filters data when paused by button and user changes bounds', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5113'
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const table = await createDomainObjectWithDefaults(page, { type: 'Telemetry Table' });
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
    let endDate = await page.locator('[aria-label="End bounds"]').textContent();
    endDate = new Date(endDate);

    endDate.setUTCMinutes(endDate.getUTCMinutes() - 5);
    endDate = endDate.toISOString().replace(/T/, ' ');

    await setTimeConductorBounds(page, undefined, endDate);

    await expect(tableWrapper).not.toHaveClass(/is-paused/);

    // Get the most recent telemetry date
    const latestTelemetryDate = await page
      .locator('table.c-telemetry-table__body > tbody > tr')
      .last()
      .locator('td')
      .nth(1)
      .getAttribute('title');

    // Verify that it is <= our new end bound
    const latestMilliseconds = Date.parse(latestTelemetryDate);
    const endBoundMilliseconds = Date.parse(endDate);
    expect(latestMilliseconds).toBeLessThanOrEqual(endBoundMilliseconds);
  });

  test('Supports filtering telemetry by regular text search', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const table = await createDomainObjectWithDefaults(page, { type: 'Telemetry Table' });
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    await page.goto(table.url);

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('Roger');

    let cells = await page.getByRole('cell', { name: /Roger/ }).all();
    // ensure we've got more than one cell
    expect(cells.length).toBeGreaterThan(1);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      const text = await cell.textContent();
      expect(text).toContain('Roger');
    }

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('Dodger');

    cells = await page.getByRole('cell', { name: /Dodger/ }).all();
    // ensure we've got more than one cell
    expect(cells.length).toBe(0);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      const text = await cell.textContent();
      expect(text).not.toContain('Dodger');
    }

    // Click pause button
    await page.click('button[title="Pause"]');
  });

  test('Supports filtering using Regex', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const table = await createDomainObjectWithDefaults(page, { type: 'Telemetry Table' });
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: table.uuid
    });

    // focus the Telemetry Table
    page.goto(table.url);
    await page.getByRole('searchbox', { name: 'message filter input' }).hover();
    await page.getByLabel('Message filter header').getByRole('button', { name: '/R/' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('/[Rr]oger/');

    let cells = await page.getByRole('cell', { name: /Roger/ }).all();
    // ensure we've got more than one cell
    expect(cells.length).toBeGreaterThan(1);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      const text = await cell.textContent();
      expect(text).toContain('Roger');
    }

    await page.getByRole('searchbox', { name: 'message filter input' }).click();
    await page.getByRole('searchbox', { name: 'message filter input' }).fill('/[Dd]oger/');

    cells = await page.getByRole('cell', { name: /Dodger/ }).all();
    // ensure we've got more than one cell
    expect(cells.length).toBe(0);
    // ensure the text content of each cell contains the search term
    for (const cell of cells) {
      const text = await cell.textContent();
      expect(text).not.toContain('Dodger');
    }

    // Click pause button
    await page.click('button[title="Pause"]');
  });
});
