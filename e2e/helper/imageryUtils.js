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
import { createDomainObjectWithDefaults } from '../appActions.js';
import { expect } from '../pluginFixtures.js';

const IMAGE_LOAD_DELAY = 5 * 1000;
const FIVE_MINUTES = 1000 * 60 * 5;
const THIRTY_SECONDS = 1000 * 30;
const MOUSE_WHEEL_DELTA_Y = 120;

/**
 * @param {import('@playwright/test').Page} page
 */
async function createImageryViewWithShortDelay(page, { name, parent }) {
  await createDomainObjectWithDefaults(page, {
    name,
    type: 'Example Imagery',
    parent
  });

  await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
  await page.getByLabel('More actions').click();
  await page.getByLabel('Edit Properties').click();
  // Clear and set Image load delay to minimum value
  await page.locator('input[type="number"]').fill(`${IMAGE_LOAD_DELAY}`);
  await page.getByLabel('Save').click();
}

export {
  createImageryViewWithShortDelay,
  FIVE_MINUTES,
  IMAGE_LOAD_DELAY,
  MOUSE_WHEEL_DELTA_Y,
  THIRTY_SECONDS
};
