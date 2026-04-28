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
This test suite is dedicated to testing how imagery functions over time.
It only assumes that example imagery is present.
It uses https://playwright.dev/docs/clock to have control over time
*/

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithRealTime,
  setRealTimeMode,
  setStartOffset
} from '../../../../appActions.js';
import { MISSION_TIME } from '../../../../constants.js';
import {
  createImageryViewWithShortDelay,
  FIVE_MINUTES,
  IMAGE_LOAD_DELAY,
  THIRTY_SECONDS
} from '../../../../helper/imageryUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Example Imagery Object with Controlled Clock @clock', () => {
  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a default 'Example Imagery' object
    // Click the Create button
    await page.getByRole('button', { name: 'Create' }).click();

    // Click text=Example Imagery
    await page.getByRole('menuitem', { name: 'Example Imagery' }).click();

    // Clear and set Image load delay to minimum value
    await page.locator('input[type="number"]').clear();
    await page.locator('input[type="number"]').fill(`${IMAGE_LOAD_DELAY}`);

    await page.getByLabel('Save').click();

    // Verify that the created object is focused
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(
      'Unnamed Example Imagery'
    );
    await page.getByLabel('Focused Image Element').hover({ trial: true });

    // set realtime mode
    await setRealTimeMode(page);
    await setStartOffset(page, { startMins: '05' });
  });

  test('Imagery Time Bounding', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5265'
    });
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7825'
    });

    // verify that old images are discarded
    const lastImageInBounds = page.getByLabel('Image thumbnail from').first();
    const lastImageTimestamp = await lastImageInBounds.getAttribute('title');
    expect(lastImageTimestamp).not.toBeNull();

    // go forward in time to ensure old images are discarded
    await page.clock.fastForward(IMAGE_LOAD_DELAY);
    await page.clock.resume();
    await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

    // go way forward in time to ensure multiple images are discarded
    const IMAGES_TO_DISCARD_COUNT = 5;

    const lastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT - 1);
    const lastImageToDiscardTimestamp = await lastImageToDiscard.getAttribute('title');
    expect(lastImageToDiscardTimestamp).not.toBeNull();

    const imageAfterLastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT);
    const imageAfterLastImageToDiscardTimestamp =
      await imageAfterLastImageToDiscard.getAttribute('title');
    expect(imageAfterLastImageToDiscardTimestamp).not.toBeNull();

    await page.clock.fastForward(IMAGE_LOAD_DELAY * IMAGES_TO_DISCARD_COUNT);
    await page.clock.resume();

    await expect(page.getByLabel(lastImageToDiscardTimestamp)).toBeHidden();
    await expect(page.getByLabel(imageAfterLastImageToDiscardTimestamp)).toBeVisible();
  });

  test('Get background-image url from background-image css prop', async ({ page }) => {
    await assertBackgroundImageUrlFromBackgroundCss(page);
  });
});

test.describe('Example Imagery in Display Layout with Controlled Clock @clock', () => {
  let displayLayout;

  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    // Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    displayLayout = await createDomainObjectWithDefaults(page, { type: 'Display Layout' });

    // Create Example Imagery inside Display Layout
    await createImageryViewWithShortDelay(page, {
      name: 'Unnamed Example Imagery',
      parent: displayLayout.uuid
    });

    // set realtime mode
    await navigateToObjectWithRealTime(
      page,
      displayLayout.url,
      `${FIVE_MINUTES}`,
      `${THIRTY_SECONDS}`
    );
  });

  test('Imagery Time Bounding', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5265'
    });
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7825'
    });

    // Edit mode
    await page.getByLabel('Edit Object').click();

    // Click on example imagery to expose toolbar
    await page.locator('.c-so-view__header').click();

    // Adjust object height
    await page.locator('div[title="Resize object height"] > input').click();
    await page.locator('div[title="Resize object height"] > input').fill('50');

    // Adjust object width
    await page.locator('div[title="Resize object width"] > input').click();
    await page.locator('div[title="Resize object width"] > input').fill('50');

    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();

    // verify that old images are discarded
    const lastImageInBounds = page.getByLabel('Image thumbnail from').first();
    const lastImageTimestamp = await lastImageInBounds.getAttribute('title');
    expect(lastImageTimestamp).not.toBeNull();

    // go forward in time to ensure old images are discarded
    await page.clock.fastForward(IMAGE_LOAD_DELAY);
    await page.clock.resume();
    await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

    // go way forward in time to ensure multiple images are discarded
    const IMAGES_TO_DISCARD_COUNT = 5;

    const lastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT - 1);
    const lastImageToDiscardTimestamp = await lastImageToDiscard.getAttribute('title');
    expect(lastImageToDiscardTimestamp).not.toBeNull();

    const imageAfterLastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT);
    const imageAfterLastImageToDiscardTimestamp =
      await imageAfterLastImageToDiscard.getAttribute('title');
    expect(imageAfterLastImageToDiscardTimestamp).not.toBeNull();

    await page.clock.fastForward(IMAGE_LOAD_DELAY * IMAGES_TO_DISCARD_COUNT);
    await page.clock.resume();

    await expect(page.getByLabel(lastImageToDiscardTimestamp)).toBeHidden();
    await expect(page.getByLabel(imageAfterLastImageToDiscardTimestamp)).toBeVisible();
  });

  test('Get background-image url from background-image css prop @clock', async ({ page }) => {
    await assertBackgroundImageUrlFromBackgroundCss(page);
  });
});

test.describe('Example Imagery in Flexible layout with Controlled Clock @clock', () => {
  let flexibleLayout;

  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    flexibleLayout = await createDomainObjectWithDefaults(page, { type: 'Flexible Layout' });

    // Create Example Imagery inside the Flexible Layout
    await createImageryViewWithShortDelay(page, {
      name: 'Unnamed Example Imagery',
      parent: flexibleLayout.uuid
    });

    // set realtime mode
    await navigateToObjectWithRealTime(
      page,
      flexibleLayout.url,
      `${FIVE_MINUTES}`,
      `${THIRTY_SECONDS}`
    );

    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });

  test('Imagery Time Bounding @clock', async ({ page, browserName }) => {
    test.fixme(browserName === 'firefox', 'This test needs to be updated to work with firefox');
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5326'
    });
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7825'
    });

    // verify that old images are discarded
    const lastImageInBounds = page.getByLabel('Image thumbnail from').first();
    const lastImageTimestamp = await lastImageInBounds.getAttribute('title');
    expect(lastImageTimestamp).not.toBeNull();

    // go forward in time to ensure old images are discarded
    await page.clock.fastForward(IMAGE_LOAD_DELAY);
    await page.clock.resume();
    await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

    // go way forward in time to ensure multiple images are discarded
    const IMAGES_TO_DISCARD_COUNT = 5;

    const lastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT - 1);
    const lastImageToDiscardTimestamp = await lastImageToDiscard.getAttribute('title');
    expect(lastImageToDiscardTimestamp).not.toBeNull();

    const imageAfterLastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT);
    const imageAfterLastImageToDiscardTimestamp =
      await imageAfterLastImageToDiscard.getAttribute('title');
    expect(imageAfterLastImageToDiscardTimestamp).not.toBeNull();

    await page.clock.fastForward(IMAGE_LOAD_DELAY * IMAGES_TO_DISCARD_COUNT);
    await page.clock.resume();

    await expect(page.getByLabel(lastImageToDiscardTimestamp)).toBeHidden();
    await expect(page.getByLabel(imageAfterLastImageToDiscardTimestamp)).toBeVisible();
  });

  test('Get background-image url from background-image css prop @clock', async ({ page }) => {
    await assertBackgroundImageUrlFromBackgroundCss(page);
  });
});

test.describe('Example Imagery in Tabs View with Controlled Clock @clock', () => {
  let timeStripObject;

  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    timeStripObject = await createDomainObjectWithDefaults(page, { type: 'Tabs View' });
    await page.goto(timeStripObject.url);

    /* Create Example Imagery with minimum Image Load Delay */
    // Click the Create button
    await page.getByRole('button', { name: 'Create' }).click();

    // Click text=Example Imagery
    await page.getByRole('menuitem', { name: 'Example Imagery' }).click();

    // Clear and set Image load delay to minimum value
    await page.locator('input[type="number"]').clear();
    await page.locator('input[type="number"]').fill(`${IMAGE_LOAD_DELAY}`);

    await page.getByLabel('Save').click();

    await expect(page.locator('.l-browse-bar__object-name')).toContainText(
      'Unnamed Example Imagery'
    );

    // set realtime mode
    await navigateToObjectWithRealTime(
      page,
      timeStripObject.url,
      `${FIVE_MINUTES}`,
      `${THIRTY_SECONDS}`
    );

    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });

  test('Imagery Time Bounding @clock', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5265'
    });
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7825'
    });

    // verify that old images are discarded
    const lastImageInBounds = page.getByLabel('Image thumbnail from').first();
    const lastImageTimestamp = await lastImageInBounds.getAttribute('title');
    expect(lastImageTimestamp).not.toBeNull();

    // go forward in time to ensure old images are discarded
    await page.clock.fastForward(IMAGE_LOAD_DELAY);
    await page.clock.resume();
    await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

    // go way forward in time to ensure multiple images are discarded
    const IMAGES_TO_DISCARD_COUNT = 5;

    const lastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT - 1);
    const lastImageToDiscardTimestamp = await lastImageToDiscard.getAttribute('title');
    expect(lastImageToDiscardTimestamp).not.toBeNull();

    const imageAfterLastImageToDiscard = page
      .getByLabel('Image thumbnail from')
      .nth(IMAGES_TO_DISCARD_COUNT);
    const imageAfterLastImageToDiscardTimestamp =
      await imageAfterLastImageToDiscard.getAttribute('title');
    expect(imageAfterLastImageToDiscardTimestamp).not.toBeNull();

    await page.clock.fastForward(IMAGE_LOAD_DELAY * IMAGES_TO_DISCARD_COUNT);
    await page.clock.resume();

    await expect(page.getByLabel(lastImageToDiscardTimestamp)).toBeHidden();
    await expect(page.getByLabel(imageAfterLastImageToDiscardTimestamp)).toBeVisible();
  });

  test('Get background-image url from background-image css prop @clock', async ({ page }) => {
    await assertBackgroundImageUrlFromBackgroundCss(page);
  });
});

test.describe('Example Imagery in Time Strip with Controlled Clock @clock', () => {
  let timeStripObject;

  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    timeStripObject = await createDomainObjectWithDefaults(page, { type: 'Time Strip' });
    await page.goto(timeStripObject.url);

    /* Create Example Imagery with minimum Image Load Delay */
    // Click the Create button
    await page.getByRole('button', { name: 'Create' }).click();

    // Click text=Example Imagery
    await page.getByRole('menuitem', { name: 'Example Imagery' }).click();

    // Clear and set Image load delay to minimum value
    await page.locator('input[type="number"]').clear();
    await page.locator('input[type="number"]').fill(`${IMAGE_LOAD_DELAY}`);

    await page.getByLabel('Save').click();

    await expect(page.locator('.l-browse-bar__object-name')).toContainText(
      'Unnamed Example Imagery'
    );

    // set realtime mode
    await navigateToObjectWithRealTime(
      page,
      timeStripObject.url,
      `${FIVE_MINUTES}`,
      `${THIRTY_SECONDS}`
    );

    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('wrapper-').last()).toBeInViewport();
  });

  test('Imagery Time Bounding @clock', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5265'
    });
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7825'
    });

    // verify that old images are discarded
    const lastImageInBounds = page.getByLabel('wrapper-').first();
    const lastImageTimestamp = await lastImageInBounds.getAttribute('aria-label');
    expect(lastImageTimestamp).not.toBeNull();

    // go forward in time to ensure old images are discarded
    await page.clock.fastForward(IMAGE_LOAD_DELAY);
    await page.clock.resume();
    await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

    // go way forward in time to ensure multiple images are discarded
    const IMAGES_TO_DISCARD_COUNT = 5;

    const lastImageToDiscard = page.getByLabel('wrapper-').nth(IMAGES_TO_DISCARD_COUNT - 1);
    const lastImageToDiscardTimestamp = await lastImageToDiscard.getAttribute('aria-label');
    expect(lastImageToDiscardTimestamp).not.toBeNull();

    const imageAfterLastImageToDiscard = page.getByLabel('wrapper-').nth(IMAGES_TO_DISCARD_COUNT);
    const imageAfterLastImageToDiscardTimestamp =
      await imageAfterLastImageToDiscard.getAttribute('aria-label');
    expect(imageAfterLastImageToDiscardTimestamp).not.toBeNull();

    await page.clock.fastForward(IMAGE_LOAD_DELAY * IMAGES_TO_DISCARD_COUNT);
    await page.clock.resume();

    await expect(page.getByLabel(lastImageToDiscardTimestamp)).toBeHidden();
    await expect(page.getByLabel(imageAfterLastImageToDiscardTimestamp)).toBeVisible();
  });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function assertBackgroundImageUrlFromBackgroundCss(page) {
  const backgroundImage = page.getByLabel('Focused Image Element');
  const backgroundImageUrl = await backgroundImage.evaluate((el) => {
    return window
      .getComputedStyle(el)
      .getPropertyValue('background-image')
      .match(/url\(([^)]+)\)/)[1];
  });

  // go forward in time to ensure old images are discarded
  await page.clock.fastForward(IMAGE_LOAD_DELAY);
  await page.clock.resume();
  await expect(backgroundImage).not.toHaveJSProperty('background-image', backgroundImageUrl);
}
