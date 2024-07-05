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
/**
 * @param {import('@playwright/test').Page} page
 */
async function turnOffAutoscale(page) {
  // uncheck autoscale
  await page.getByRole('checkbox', { name: 'Auto scale' }).uncheck();
}

async function turnOffAlarmMarkers(page) {
  // uncheck alarm markers
  await page
    .getByRole('list', { name: 'Plot Series Properties' })
    .locator('[title="Alarm Markers"] input')
    .uncheck();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} min
 * @param {string} max
 */
async function setUserDefinedMinAndMax(page, min, max) {
  // set minimum value
  await page.getByRole('spinbutton').first().fill(min);
  // set maximum value
  await page.getByRole('spinbutton').nth(1).fill(max);
}

export { setUserDefinedMinAndMax, turnOffAlarmMarkers, turnOffAutoscale };
