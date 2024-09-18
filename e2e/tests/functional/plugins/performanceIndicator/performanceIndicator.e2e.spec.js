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
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('The performance indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      openmct.install(openmct.plugins.PerformanceIndicator());
    });
  });

  test('can be installed', async ({ page }) => {
    const performanceIndicator = await page.getByLabel('Performance Indicator');
    expect(performanceIndicator).toBeDefined();
  });

  test('Shows a numerical FPS value', async ({ page }) => {
    //We need to wait at least 1s to establish an average fps
    await page.waitForTimeout(1000);
    const performanceIndicator = await page.getByLabel('Performance Indicator');
    expect(performanceIndicator).toHaveText(/\d\d? fps/);
  });

  test('Supports showing optional extended performance information in an overlay for debugging', async ({ page }) => {
    const performanceMeasurementLabel = 'Some measurement';
    const performanceMeasurementValue = 'Some value';

    await page.evaluate(({performanceMeasurementLabel, performanceMeasurementValue}) => {
      openmct.performance.measurements.set(
        performanceMeasurementLabel,
        performanceMeasurementValue
      );
    }, {performanceMeasurementLabel, performanceMeasurementValue});
    const performanceIndicator = await page.getByLabel("Performance Indicator");
    await performanceIndicator.click();
    //Performance overlay is a crude debugging tool, it's evaluated once per second.
    await page.waitForTimeout(1000);
    const performanceOverlay = await page.getByLabel("Performance Overlay");
    console.log(performanceOverlay.textContent());
    expect(performanceOverlay).toHaveText(new RegExp(`${performanceMeasurementLabel}.*`));
    expect(performanceOverlay).toHaveText(new RegExp(`.*${performanceMeasurementValue}`));
  });
});
