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
import {
  createDomainObjectWithDefaults,
  expandEntireTree,
  setRealTimeMode
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Reload action', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const displayLayout = await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });

    const alphaTable = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      name: 'Alpha Table'
    });

    const betaTable = await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      name: 'Beta Table'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: alphaTable.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.001'
      }
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: betaTable.uuid,
      customParameters: {
        '[aria-label="Data Rate (hz)"]': '0.001'
      }
    });

    await page.goto(displayLayout.url);

    // Expand all folders
    await expandEntireTree(page);

    await page.locator('[title="Edit"]').click();

    await page.dragAndDrop(`text='Alpha Table'`, '.l-layout__grid-holder', {
      targetPosition: { x: 0, y: 0 }
    });

    await page.dragAndDrop(`text='Beta Table'`, '.l-layout__grid-holder', {
      targetPosition: { x: 0, y: 250 }
    });

    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
  });

  test('can reload display layout and its children', async ({ page }) => {
    const beforeReloadAlphaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .first()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');
    const beforeReloadBetaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .last()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');
    // reload alpha
    await page.getByTitle('View menu items').first().click();
    await page.getByRole('menuitem', { name: /Reload/ }).click();

    const afterReloadAlphaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .first()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');
    const afterReloadBetaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .last()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');

    expect(beforeReloadAlphaTelemetryValue).not.toEqual(afterReloadAlphaTelemetryValue);
    expect(beforeReloadBetaTelemetryValue).toEqual(afterReloadBetaTelemetryValue);

    // now reload parent
    await page.getByTitle('More actions').click();
    await page.getByRole('menuitem', { name: /Reload/ }).click();

    const fullReloadAlphaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .first()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');
    const fullReloadBetaTelemetryValue = await page
      .locator('table.c-telemetry-table__body > tbody')
      .last()
      .locator('tr')
      .first()
      .locator('td')
      .nth(3)
      .getAttribute('title');

    expect(fullReloadAlphaTelemetryValue).not.toEqual(afterReloadAlphaTelemetryValue);
    expect(fullReloadBetaTelemetryValue).not.toEqual(afterReloadBetaTelemetryValue);
  });
});
