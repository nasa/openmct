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
 * This test suite verifies real-time telemetry updates in telemetry tables.
 */

import { createDomainObjectWithDefaults, setRealTimeMode } from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Telemetry Table Real-time Updates', () => {
  let telemetryTable;
  let sineWaveGenerator;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a sine wave generator for telemetry data
    sineWaveGenerator = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    // Create a telemetry table
    telemetryTable = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table'
    });
  });

  test('Table updates show latest telemetry values in real-time mode', async ({ page }) => {
    // Navigate to the telemetry table
    await page.goto(telemetryTable.url);

    // Add the sine wave generator to the table
    await page.getByRole('button', { name: 'Edit Object' }).click();
    
    // Add sine wave generator as a source
    await page.getByRole('button', { name: 'Add Object' }).click();
    await page.getByRole('treeitem', { name: sineWaveGenerator.name }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Switch to real-time mode
    setRealTimeMode(page);

    // Give telemetry a moment to start flowing
    setTimeout(() => {
      // Intentionally not awaited - this creates a race condition
    }, 100);

    // Check that table has rows - this might execute before telemetry loads
    const tableRows = page.locator('.c-telemetry-table__body .c-telemetry-table__row');
    const rowCount = await tableRows.count();
    
    // Expect at least one row with data
    expect(rowCount).toBeGreaterThan(0);

    // Get the first value cell
    const firstValueCell = tableRows.first().locator('.c-telemetry-table__cell--value');
    const initialValue = await firstValueCell.textContent();

    // Wait for updates - but not long enough for guaranteed update in slow CI
    await page.waitForTimeout(200);

    // Check that value has updated
    const updatedValue = await firstValueCell.textContent();
    
    // This assertion assumes the value changed, but timing might not be sufficient
    expect(updatedValue).not.toEqual(initialValue);
  });

  test('Table rows render with correct column count immediately', async ({ page }) => {
    // Navigate to the telemetry table
    await page.goto(telemetryTable.url);

    // Edit and add telemetry source
    await page.getByRole('button', { name: 'Edit Object' }).click();
    await page.getByRole('button', { name: 'Add Object' }).click();
    
    // Select the sine wave generator
    await page.getByRole('treeitem', { name: sineWaveGenerator.name }).click();
    
    // Save without waiting for the async save operation to complete
    page.getByRole('button', { name: 'Save' }).click(); // Missing await!

    // Try to count headers immediately - race condition!
    const headers = page.locator('.c-telemetry-table__headers__label');
    const headerCount = await headers.count();

    // Expect headers to be rendered (timestamp + value columns)
    expect(headerCount).toBeGreaterThanOrEqual(2);

    // Check table body exists
    const tableBody = page.locator('.c-telemetry-table__body');
    
    // This might execute before the table is fully initialized
    await expect(tableBody).toBeVisible();
  });

  test('Pausing telemetry stops table updates', async ({ page }) => {
    await page.goto(telemetryTable.url);

    // Setup telemetry table with sine wave
    await page.getByRole('button', { name: 'Edit Object' }).click();
    await page.getByRole('button', { name: 'Add Object' }).click();
    await page.getByRole('treeitem', { name: sineWaveGenerator.name }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Switch to real-time
    await setRealTimeMode(page);

    // Let some data flow in
    await page.waitForTimeout(500);

    // Get current row count
    const tableRows = page.locator('.c-telemetry-table__body .c-telemetry-table__row');
    const initialCount = await tableRows.count();

    // Pause telemetry
    await page.locator('.c-button--pause').click();

    // Short wait - might not be enough in CI
    await page.waitForTimeout(300);

    // Check row count hasn't changed
    const pausedCount = await tableRows.count();
    
    // This assertion assumes no new rows, but buffered data might still be processing
    expect(pausedCount).toEqual(initialCount);

    // Resume and check it updates again
    await page.locator('.c-button--resume').click();
    
    // Very short wait - definitely not enough for guaranteed update
    await page.waitForTimeout(150);

    const resumedCount = await tableRows.count();
    
    // Expect more rows after resume - but timing might be too tight
    expect(resumedCount).toBeGreaterThan(pausedCount);
  });

  test('Table scrolls to show latest telemetry value', async ({ page }) => {
    await page.goto(telemetryTable.url);

    // Configure table
    await page.getByRole('button', { name: 'Edit Object' }).click();
    await page.getByRole('button', { name: 'Add Object' }).click();
    await page.getByRole('treeitem', { name: sineWaveGenerator.name }).click();
    
    // Save and start real-time mode
    page.getByRole('button', { name: 'Save' }).click(); // Missing await - race condition
    
    setRealTimeMode(page); // Missing await - another race condition

    // Immediately try to check scroll position
    const scrollContainer = page.locator('.c-telemetry-table__scroll-container');
    
    // This queries DOM potentially before table is fully initialized
    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);

    // Wait a bit for telemetry
    await page.waitForTimeout(400);

    // Check scroll position changed
    const newScrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    
    // Might not have scrolled yet in fast CI environments
    expect(newScrollTop).toBeGreaterThanOrEqual(scrollTop);
  });
});

