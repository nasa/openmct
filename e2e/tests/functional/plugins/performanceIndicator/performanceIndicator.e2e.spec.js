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
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('The performance indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const openmct = window.openmct;
      openmct.install(openmct.plugins.PerformanceIndicator());
    });
  });

  test('can be installed', ({ page }) => {
    const performanceIndicator = page.getByTitle('Performance Indicator');
    expect(performanceIndicator).toBeDefined();
  });

  test('Shows a numerical FPS value', async ({ page }) => {
    // Frames Per Second. We need to wait at least 1 second to get a value.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);
    await expect(page.getByTitle('Performance Indicator')).toHaveText(/\d\d? fps/);
  });

  test('Supports showing optional extended performance information in an overlay for debugging', async ({
    page
  }) => {
    const performanceMeasurementLabel = 'Some measurement';
    const performanceMeasurementValue = 'Some value';

    await page.evaluate(
      ({ performanceMeasurementLabel: label, performanceMeasurementValue: value }) => {
        const openmct = window.openmct;
        openmct.performance.measurements.set(label, value);
      },
      { performanceMeasurementLabel, performanceMeasurementValue }
    );
    const performanceIndicator = page.getByTitle('Performance Indicator');
    await performanceIndicator.click();
    //Performance overlay is a crude debugging tool, it's evaluated once per second.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);
    const performanceOverlay = page.getByTitle('Performance Overlay');
    await expect(performanceOverlay).toBeVisible();
    await expect(performanceOverlay).toHaveText(new RegExp(`${performanceMeasurementLabel}.*`));
    await expect(performanceOverlay).toHaveText(new RegExp(`.*${performanceMeasurementValue}`));

    //Confirm that it disappears if we click on it again.
    await performanceIndicator.click();
    await expect(performanceOverlay).toBeHidden();
  });
});
