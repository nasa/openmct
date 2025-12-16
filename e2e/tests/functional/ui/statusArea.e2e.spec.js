/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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
import { expect, test } from '../../../baseFixtures.js';

test.describe('Status Area', () => {
  let expandButton;
  let collapseButton;
  let singleLineButton;
  let multiLineButton;
  let indicatorsContainer;
  let firstIndicator;

  test.beforeEach(async ({ page }) => {
    expandButton = page.getByLabel('Show icon and name');
    collapseButton = page.getByLabel('Show icon only');
    singleLineButton = page.getByLabel('Display as single line');
    multiLineButton = page.getByLabel('Display as multiple lines');
    indicatorsContainer = page.getByLabel('Status Indicators');
    firstIndicator = indicatorsContainer.getByRole('status').first();

    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('allows for condensed or expanded indicators mode', async ({ page }) => {
    await expect(collapseButton).toBeVisible();
    await expect(expandButton).toBeHidden();

    const initialExpandedPosition = (await firstIndicator.boundingBox()).x;

    await collapseButton.click();
    const collapsedPosition = (await firstIndicator.boundingBox()).x;

    // expect first indicator to move right as status indicators are collapsed
    await expect(initialExpandedPosition).toBeLessThan(collapsedPosition);
    await expect(collapseButton).toBeHidden();
    await expect(expandButton).toBeVisible();

    await expandButton.click();
    const finalExpandedPosition = (await firstIndicator.boundingBox()).x;

    await expect(finalExpandedPosition).toBeLessThan(collapsedPosition);
    // this assertion may not always be true for dynamic indicators
    await expect(finalExpandedPosition).toBe(initialExpandedPosition);
    await expect(collapseButton).toBeVisible();
    await expect(expandButton).toBeHidden();
  });

  test.describe('in single line mode', () => {
    test('restricts to one line', async ({ page }) => {
      const {
        x: indicatorsContainerLeftPosition,
        width: indicatorsContainerwidth,
        height: indicatorsContainerHeight
      } = await indicatorsContainer.boundingBox();
      const indicatorsContainerRightPosition =
        indicatorsContainerLeftPosition + indicatorsContainerwidth;
      const firstIndicatorPosition = (await firstIndicator.boundingBox()).x;
      const indicatorsWidth = indicatorsContainerRightPosition - firstIndicatorPosition;
      const { height, width } = page.viewportSize();

      await singleLineButton.click();

      // resize viewport so that half of the indicators would overflow
      await page.setViewportSize({
        width: Math.round(width - indicatorsContainerwidth + indicatorsWidth / 2),
        height
      });

      const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox()).height;
      expect(indicatorsContainerHeightAfterResize).toBe(indicatorsContainerHeight);
    });
    test('provides overflow indication by highlighting single/multi line toggle', async ({
      page
    }) => {});
    test('reacts properly to expanded or condensed indicators mode', async ({ page }) => {});
  });

  test.describe('in multi line mode', () => {
    test('allows wrapping to span multiple lines', async ({ page }) => {});
    test('reacts properly to expanded or condensed indicators mode', async ({ page }) => {});
  });
});
