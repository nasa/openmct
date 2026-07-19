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

test.describe('LAD Table Sets', () => {
  test('Ensure we have numbers in cells', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const ladTableSet = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table Set'
    });

    const firstLadTable = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      parent: ladTableSet.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: firstLadTable.uuid
    });

    const secondLadTable = await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      parent: ladTableSet.uuid
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: secondLadTable.uuid
    });

    await page.goto(ladTableSet.url);

    // Wait for the initial value to show after mount
    await expect(page.getByLabel('lad value').first()).not.toContainText('---');

    const valueFromFirstSineWave = await page.getByLabel('lad value').first().innerText();
    const firstSineWaveNumber = parseFloat(valueFromFirstSineWave);
    // ensure we have a float value in the cell and it's finite
    expect(Number.isFinite(firstSineWaveNumber)).toBeTruthy();

    const valueFromSecondSineWave = await page.getByLabel('lad value').last().innerText();
    const secondSineWaveNumber = parseFloat(valueFromSecondSineWave);
    // ensure we have a float value in the cell and it's finite
    expect(Number.isFinite(secondSineWaveNumber)).toBeTruthy();
  });
});
