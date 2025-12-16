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
  let viewportHeight;
  let viewportWidth;
  let expandButton;
  let collapseButton;
  let singleLineButton;
  let multiLineButton;
  let indicatorsContainer;
  let firstIndicator;
  let indicatorsContainerLeftPosition;
  let indicatorsContainerWidth;
  let indicatorsContainerHeight;
  let indicatorsContainerRightPosition;
  let firstIndicatorPosition;
  let indicatorsWidth;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const viewportSize = page.viewportSize();
    viewportHeight = viewportSize.height;
    viewportWidth = viewportSize.width;
    expandButton = page.getByLabel('Show icon and name');
    collapseButton = page.getByLabel('Show icon only');
    singleLineButton = page.getByLabel('Display as single line');
    multiLineButton = page.getByLabel('Display as multiple lines');
    indicatorsContainer = page.getByLabel('Status Indicators');
    const indicatorsContainerBoundingBox = await indicatorsContainer.boundingBox();
    indicatorsContainerLeftPosition = indicatorsContainerBoundingBox.x;
    indicatorsContainerWidth = indicatorsContainerBoundingBox.width;
    indicatorsContainerHeight = indicatorsContainerBoundingBox.height;
    indicatorsContainerRightPosition = indicatorsContainerLeftPosition + indicatorsContainerWidth;
    firstIndicator = indicatorsContainer.getByRole('status').first();
    firstIndicatorPosition = (await firstIndicator.boundingBox()).x;
    indicatorsWidth = indicatorsContainerRightPosition - firstIndicatorPosition;
  });

  test.describe('in single line mode', () => {
    test('restricts to one line', async ({ page }) => {
      await test.step('toggle from allow wrap multi line indicators to restrict to single line', async () => {
        await singleLineButton.click();
      });

      await test.step('resize viewport so that half of the indicators would overflow', async () => {
        await page.setViewportSize({
          width: Math.round(viewportWidth - indicatorsContainerWidth + indicatorsWidth / 2),
          height: viewportHeight
        });
      });

      await test.step('verify indicators restricted to one line even with overflow', async () => {
        const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox())
          .height;
        expect(indicatorsContainerHeightAfterResize).toBe(indicatorsContainerHeight);
      });
    });

    test('provides overflow indication by highlighting single/multi line toggle', async ({
      page
    }) => {
      await test.step('toggle from allow wrap multi line indicators to restrict to single line', async () => {
        await singleLineButton.click();
      });

      await test.step('verify toggle button does not indicate overflow', async () => {
        await expect(multiLineButton).toBeVisible();
        await expect(multiLineButton).not.toHaveClass(/c-button--major/);
      });

      await test.step('resize viewport so that half of the indicators would overflow', async () => {
        await page.setViewportSize({
          width: Math.round(viewportWidth - indicatorsContainerWidth + indicatorsWidth / 2),
          height: viewportHeight
        });
      });

      await test.step('verify toggle button does indicate overflow', async () => {
        await expect(multiLineButton).toHaveClass(/c-button--major/);
      });
    });
  });

  test.describe('in multi line mode', () => {
    test('allows wrapping to span multiple lines', async ({ page }) => {
      await test.step('resize viewport so that half of the indicators would overflow', async () => {
        await page.setViewportSize({
          width: Math.round(viewportWidth - indicatorsContainerWidth + indicatorsWidth / 2),
          height: viewportHeight
        });
      });

      await test.step('verify indicators wrap to multiple lines', async () => {
        const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox())
          .height;
        expect(indicatorsContainerHeightAfterResize).toBeGreaterThan(indicatorsContainerHeight);
      });
    });
  });

  test('allows for collapsed or expanded indicators mode', async ({ page }) => {
    const initialExpandedPosition = (await firstIndicator.boundingBox()).x;

    await test.step('verify button indicates action to collapse', async () => {
      await expect(collapseButton).toBeVisible();
      await expect(expandButton).toBeHidden();
    });

    await test.step('toggle indicators to collapsed mode', async () => {
      await collapseButton.click();
    });

    const collapsedPosition = (await firstIndicator.boundingBox()).x;

    await test.step('verify indicators in collapsed mode', async () => {
      await expect(initialExpandedPosition).toBeLessThan(collapsedPosition);
      await expect(collapseButton).toBeHidden();
      await expect(expandButton).toBeVisible();
    });

    await test.step('verify button indicates action to expand', async () => {
      await expect(expandButton).toBeVisible();
      await expect(collapseButton).toBeHidden();
    });

    await test.step('toggle indicators to expanded mode', async () => {
      await expandButton.click();
    });

    const finalExpandedPosition = (await firstIndicator.boundingBox()).x;

    await test.step('verify indicators in expanded mode', async () => {
      await expect(finalExpandedPosition).toBeLessThan(collapsedPosition);
    });

    await test.step('verify indicators size return to initial conditions', async () => {
      // this assertion may not always be true for indicators with dynamic width (text)
      await expect(finalExpandedPosition).toBe(initialExpandedPosition);
    });

    await test.step('verify button indicates action to collapse', async () => {
      await expect(collapseButton).toBeVisible();
      await expect(expandButton).toBeHidden();
    });
  });

  test('collapse/expand toggle and single/multi line toggle work in conjunction', async ({
    page
  }) => {
    await test.step('toggle indicators to collapsed mode', async () => {
      await collapseButton.click();
    });

    await test.step('resize viewport so that indicators just do not overflow in collapsed mode', async () => {
      const delta = (await firstIndicator.boundingBox()).x - firstIndicatorPosition;
      console.log(delta);
      await page.setViewportSize({
        width: Math.round(viewportWidth - indicatorsContainerWidth + indicatorsWidth - delta / 2),
        height: viewportHeight
      });
    });

    await test.step('verify indicators are on a single line', async () => {
      const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox()).height;
      expect(indicatorsContainerHeightAfterResize).toBe(indicatorsContainerHeight);
    });

    await test.step('toggle indicators to expanded mode', async () => {
      await expandButton.click();
    });

    await test.step('verify indicators wrap to multiple lines', async () => {
      const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox()).height;
      expect(indicatorsContainerHeightAfterResize).toBeGreaterThan(indicatorsContainerHeight);
    });

    await test.step('toggle to single line', async () => {
      await singleLineButton.click();
    });

    await test.step('verify indicators are on a single line', async () => {
      const indicatorsContainerHeightAfterResize = (await indicatorsContainer.boundingBox()).height;
      expect(indicatorsContainerHeightAfterResize).toBe(indicatorsContainerHeight);
    });

    await test.step('verify indicators overflow', async () => {
      await expect(multiLineButton).toHaveClass(/c-button--major/);
    });
  });
});
