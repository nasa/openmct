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
This test suite is dedicated to tests which verify the basic operations surrounding imagery,
but only assume that example imagery is present.
*/

import {
  createDomainObjectWithDefaults,
  navigateToObjectWithRealTime,
  setRealTimeMode
} from '../../../../appActions.js';
import { MISSION_TIME } from '../../../../constants.js';
import { expect, test } from '../../../../pluginFixtures.js';
const panHotkey = process.platform === 'linux' ? ['Shift', 'Alt'] : ['Alt'];
const tagHotkey = ['Shift', 'Alt'];
const expectedAltText = process.platform === 'linux' ? 'Shift+Alt drag to pan' : 'Alt drag to pan';
const thumbnailUrlParamsRegexp = /\?w=100&h=100/;
const IMAGE_LOAD_DELAY = 5 * 1000;
const MOUSE_WHEEL_DELTA_Y = 120;
const FIVE_MINUTES = 1000 * 60 * 5;
const THIRTY_SECONDS = 1000 * 30;

//The following block of tests verifies the basic functionality of example imagery and serves as a template for Imagery objects embedded in other objects.
test.describe('Example Imagery Object', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a default 'Example Imagery' object
    const exampleImagery = await createDomainObjectWithDefaults(page, { type: 'Example Imagery' });

    // Verify that the created object is focused
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(exampleImagery.name);
    await page.getByLabel('Focused Image Element').hover({ trial: true });

    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });

  test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
    // Zoom in x2 and assert
    await mouseZoomOnImageAndAssert(page, 2);

    // Zoom out x2 and assert
    await mouseZoomOnImageAndAssert(page, -2);
  });

  test('Compass HUD should be hidden by default', async ({ page }) => {
    await expect(page.locator('.c-hud')).toBeHidden();
  });

  test('Can right click on image and open it in a new tab @2p', async ({ page, context }) => {
    // try to right click on image
    const backgroundImage = page.getByLabel('Focused Image Element');
    await backgroundImage.click({
      button: 'right',
      // Need force option here due to annotation overlay which blocks playwright's click
      // eslint-disable-next-line playwright/no-force-option
      force: true
    });
    // expect context menu to appear
    await expect(page.getByText('Save Image As')).toBeVisible();
    await expect(page.getByText('Open Image in New Tab')).toBeVisible();

    // click on open image in new tab
    const pagePromise = context.waitForEvent('page');
    await page.getByText('Open Image in New Tab').click();
    // expect new tab to be in browser
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    // expect new tab url to have jpg in it
    expect(newPage.url()).toContain('.jpg');
  });

  // this requires CORS to be enabled in some fashion
  test.fixme('Can right click on image and save it as a file', async ({ page }) => {});

  test('Can adjust image brightness/contrast by dragging the sliders', async ({
    page,
    browserName
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(browserName === 'firefox', 'This test needs to be updated to work with firefox');
    // Open the image filter menu
    await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

    // Drag the brightness and contrast sliders around and assert filter values
    await dragBrightnessSliderAndAssertFilterValues(page);
    await dragContrastSliderAndAssertFilterValues(page);
  });

  test('Can use independent time conductor to change time', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6821'
    });

    // Test independent fixed time with global fixed time
    // flip on independent time conductor
    await page.getByLabel('Enable Independent Time Conductor').click();

    await expect(page.locator('#independentTCToggle')).toBeChecked();
    await expect(page.locator('.c-compact-tc').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Independent Time Conductor Settings' })
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Independent Time Conductor Settings' }).click();
    await expect(page.getByLabel('Time Conductor Options')).toBeVisible();
    await page.getByLabel('Time Conductor Options').hover({ trial: true });

    await page.getByRole('textbox', { name: 'Start date' }).hover({ trial: true });
    await page.getByRole('textbox', { name: 'Start date' }).fill('2021-12-30');
    await page.keyboard.press('Tab');
    await page.getByRole('textbox', { name: 'Start time' }).hover({ trial: true });
    await page.getByRole('textbox', { name: 'Start time' }).fill('01:01:00');
    await page.keyboard.press('Tab');
    await page.getByRole('textbox', { name: 'End date' }).hover({ trial: true });
    await page.getByRole('textbox', { name: 'End date' }).fill('2021-12-30');
    await page.keyboard.press('Tab');
    await page.getByRole('textbox', { name: 'End time' }).hover({ trial: true });
    await page.getByRole('textbox', { name: 'End time' }).fill('01:11:00');
    await page.getByRole('textbox', { name: 'End time' }).fill('01:11:00');
    await page.getByLabel('Submit time bounds').click();

    // wait for image thumbnails to stabilize
    await page.getByLabel('Image Thumbnails', { exact: true }).hover({ trial: true });
    await expect(page.getByText('2021-12-30 01:01:00.000Z').first()).toBeVisible();

    // flip it off
    await page.getByRole('switch', { name: 'Disable Independent Time Conductor' }).click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();

    // Test independent fixed time with global realtime
    await setRealTimeMode(page);
    await expect(
      page.getByRole('switch', { name: 'Enable Independent Time Conductor' })
    ).toBeEnabled();
    await page.getByRole('switch', { name: 'Enable Independent Time Conductor' }).click();
    // check image date to be in the past
    await expect(page.getByText('2021-12-30 01:01:00.000Z').first()).toBeVisible();
    // flip it off
    await page.getByRole('switch', { name: 'Disable Independent Time Conductor' }).click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();

    // Test independent realtime with global realtime
    await page.getByRole('switch', { name: 'Enable Independent Time Conductor' }).click();
    // check image date
    await expect(page.getByText('2021-12-30 01:11:00.000Z').first()).toBeVisible();
    // change independent time to realtime
    await page.getByRole('button', { name: 'Independent Time Conductor Settings' }).click();
    await page.getByRole('button', { name: 'Independent Time Conductor Mode Menu' }).click();
    await page.getByRole('menuitem', { name: /Real-Time/ }).click();
    // timestamp shouldn't be in the past anymore
    await expect(page.getByText('2021-12-30 01:11:00.000Z')).toBeHidden();
    // back to the past
    await page.getByRole('button', { name: 'Independent Time Conductor Mode Menu' }).click();
    await page.getByRole('menuitem', { name: /Real-Time/ }).click();
    await page.getByRole('button', { name: 'Independent Time Conductor Mode Menu' }).click();
    await page.getByRole('menuitem', { name: /Fixed Timespan/ }).click();
    // check image date to be in the past
    await expect(page.getByText('2021-12-30 01:11:00.000Z').first()).toBeVisible();
  });

  test('Can use alt+drag to move around image once zoomed in', async ({ page }) => {
    await page.locator('.c-imagery__main-image__bg').hover({ trial: true });

    // zoom in
    await page.mouse.wheel(0, MOUSE_WHEEL_DELTA_Y * 2);
    const zoomedBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;
    // move to the right

    // center the mouse pointer
    await page.mouse.move(imageCenterX, imageCenterY);

    //Get Diagnostic info about process environment
    console.log('process.platform is ' + process.platform);
    const getUA = await page.evaluate(() => navigator.userAgent);
    console.log('navigator.userAgent ' + getUA);
    // Pan Imagery Hints
    const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
    expect(expectedAltText).toEqual(imageryHintsText);

    // pan right
    await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
    const afterRightPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

    // pan left
    await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
    const afterLeftPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

    // pan up
    await page.mouse.move(imageCenterX, imageCenterY);
    await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
    const afterUpPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

    // pan down
    await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
    const afterDownPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(afterDownPanBoundingBox.y).toBeLessThan(afterUpPanBoundingBox.y);
  });

  test('Can use alt+shift+drag to create a tag and ensure toolbars disappear', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.hover({ trial: true });

    const canvasBoundingBox = await canvas.boundingBox();
    const canvasCenterX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
    const canvasCenterY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
    await Promise.all(tagHotkey.map((x) => page.keyboard.down(x)));
    await page.mouse.down();
    // steps not working for me here
    await page.mouse.move(canvasCenterX - 20, canvasCenterY - 20);
    await page.mouse.move(canvasCenterX - 100, canvasCenterY - 100);
    // toolbar should hide when we're creating annotations with a drag
    await expect(page.locator('[role="toolbar"][aria-label="Image controls"]')).toBeHidden();
    await page.mouse.up();
    // toolbar should reappear when we're done creating annotations
    await expect(page.locator('[role="toolbar"][aria-label="Image controls"]')).toBeVisible();
    await Promise.all(tagHotkey.map((x) => page.keyboard.up(x)));

    // Wait for canvas to stabilize.
    await canvas.hover({ trial: true });

    // add some tags
    await page.getByText('Annotations').click();
    await page.getByRole('button', { name: /Add Tag/ }).click();
    await page.getByPlaceholder('Type to select tag').click();
    await page.getByText('Driving').click();

    await page.getByRole('button', { name: /Add Tag/ }).click();
    await page.getByPlaceholder('Type to select tag').click();
    await page.getByText('Science').click();

    // click on a separate part of the canvas to ensure no tags appear
    await page.mouse.click(canvasCenterX + 10, canvasCenterY + 10);
    await expect(page.getByText('Driving')).toBeHidden();
    await expect(page.getByText('Science')).toBeHidden();

    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/7083'
    });
    // click on annotation again and expect tags to appear
    await page.mouse.click(canvasCenterX - 50, canvasCenterY - 50);
    await expect(page.getByText('Driving')).toBeVisible();
    await expect(page.getByText('Science')).toBeVisible();

    // add another tag and expect it to appear without changing selection
    await page.getByRole('button', { name: /Add Tag/ }).click();
    await page.getByPlaceholder('Type to select tag').click();
    await page.getByText('Drilling').click();
    await expect(page.getByText('Driving')).toBeVisible();
    await expect(page.getByText('Science')).toBeVisible();
    await expect(page.getByText('Drilling')).toBeVisible();
  });

  test('Can use + - buttons to zoom on the image', async ({ page }) => {
    await buttonZoomOnImageAndAssert(page);
  });

  test('Can use the reset button to reset the image', async ({ page }) => {
    await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
      'style.transform',
      'scale(1) translate(0px, 0px)'
    );

    // Get initial image dimensions
    const initialBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();

    // Zoom in twice via button
    await zoomIntoImageryByButton(page);
    await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
      'style.transform',
      'scale(2) translate(0px, 0px)'
    );
    await zoomIntoImageryByButton(page);
    await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
      'style.transform',
      'scale(3) translate(0px, 0px)'
    );

    // Get and assert zoomed in image dimensions
    const zoomedInBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
    expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

    // Reset pan and zoom and assert against initial image dimensions
    await resetImageryPanAndZoom(page);
    await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
      'style.transform',
      'scale(1) translate(0px, 0px)'
    );
    const finalBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
    expect(finalBoundingBox).toEqual(initialBoundingBox);
  });

  test('Using the zoom features does not pause telemetry', async ({ page }) => {
    const pausePlayButton = page.locator('.c-button.pause-play');

    // switch to realtime
    await setRealTimeMode(page);

    await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);

    // Zoom in via button
    await zoomIntoImageryByButton(page);
    await expect(pausePlayButton).not.toHaveClass(/is-paused/);
  });

  test('Uses low fetch priority', async ({ page }) => {
    const priority = page.locator('.js-imageryView-image');
    await expect(priority).toHaveAttribute('fetchpriority', 'low');
  });
});

test.describe('Example Imagery in Display Layout @clock', () => {
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

    await page.goto(displayLayout.url);
  });

  test('View Large action pauses imagery when in realtime and returns to realtime', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/3647'
    });

    // set realtime mode
    await setRealTimeMode(page);

    // pause/play button
    const pausePlayButton = page.locator('.c-button.pause-play');

    await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);

    // Open context menu and click view large menu item
    await page.locator('button[title="View menu items"]').click();
    await page.locator('li[title="View Large"]').click();
    await expect(pausePlayButton).toHaveClass(/is-paused/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);
  });

  test('View Large action leaves keeps realtime mode paused', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/3647'
    });

    // set realtime mode
    await setRealTimeMode(page);

    // pause/play button
    const pausePlayButton = page.locator('.c-button.pause-play');
    await pausePlayButton.click();
    await expect.soft(pausePlayButton).toHaveClass(/is-paused/);

    // Open context menu and click view large menu item
    await page.locator('button[title="View menu items"]').click();
    await page.locator('li[title="View Large"]').click();
    await expect(pausePlayButton).toHaveClass(/is-paused/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect.soft(pausePlayButton).toHaveClass(/is-paused/);
  });

  test('Imagery View operations @clock', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5265'
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

    await performImageryViewOperationsAndAssert(page, displayLayout);
  });

  test('Resizing the layout changes thumbnail visibility and size', async ({ page }) => {
    const thumbsWrapperLocator = page.locator('.c-imagery__thumbs-wrapper');
    // Edit mode
    await page.getByLabel('Edit Object').click();

    // Click on example imagery to expose toolbar
    await page.locator('.c-so-view__header').click();

    // expect thumbnails not be visible when first added
    expect.soft(thumbsWrapperLocator.isHidden()).toBeTruthy();

    // Resize the example imagery vertically to change the thumbnail visibility
    /*
        The following arbitrary values are added to observe the separate visual
        conditions of the thumbnails (hidden, small thumbnails, regular thumbnails).
        Specifically, height is set to 50px for small thumbs and 100px for regular
        */
    await page.locator('div[title="Resize object height"] > input').click();
    await page.locator('div[title="Resize object height"] > input').fill('50');

    expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
    await expect(thumbsWrapperLocator).toHaveClass(/is-small-thumbs/);

    // Resize the example imagery vertically to change the thumbnail visibility
    await page.locator('div[title="Resize object height"] > input').click();
    await page.locator('div[title="Resize object height"] > input').fill('100');

    await expect(thumbsWrapperLocator).toBeVisible();
    await expect(thumbsWrapperLocator).not.toHaveClass(/is-small-thumbs/);
  });

  /**
   * Toggle layer visibility checkbox by clicking on checkbox label
   * - should toggle checkbox and layer visibility for that image view
   * - should NOT toggle checkbox and layer visibility for the first image view in display
   */
  test('Toggle layer visibility by clicking on label', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/6709'
    });
    await createImageryViewWithShortDelay(page, {
      name: 'Unnamed Example Imagery',
      parent: displayLayout.uuid
    });
    await page.goto(displayLayout.url);

    const imageElements = page.locator('.c-imagery__main-image-wrapper');

    await expect(imageElements).toHaveCount(2);

    const imageOne = page.locator('.c-imagery__main-image-wrapper').nth(0);
    const imageTwo = page.locator('.c-imagery__main-image-wrapper').nth(1);
    const imageOneWrapper = imageOne.locator('.image-wrapper');
    const imageTwoWrapper = imageTwo.locator('.image-wrapper');

    await imageTwo.hover();

    await imageTwo.locator('button[title="Layers"]').click();

    const imageTwoLayersMenuContent = imageTwo.locator('button[title="Layers"] + div');
    const imageTwoLayersToggleLabel = imageTwoLayersMenuContent.locator('label').last();

    await imageTwoLayersToggleLabel.click();

    const imageOneLayers = imageOneWrapper.locator('.layer-image');
    const imageTwoLayers = imageTwoWrapper.locator('.layer-image');

    await expect(imageOneLayers).toHaveCount(0);
    await expect(imageTwoLayers).toHaveCount(1);
  });
});

test.describe('Example Imagery in Flexible layout @clock', () => {
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

    // Navigate back to Flexible Layout
    await page.goto(flexibleLayout.url);
    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });

  test('Can double-click on the image to view large image', async ({ page }) => {
    // Double-click on the image to open large view
    const imageElement = page.getByRole('button', { name: 'Image Wrapper' });
    await imageElement.dblclick();

    // Check if the large view is visible
    page.getByRole('button', { name: 'Focused Image Element', state: 'visible' });

    // Close the large view
    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('Imagery View operations @clock', async ({ page, browserName }) => {
    test.fixme(browserName === 'firefox', 'This test needs to be updated to work with firefox');
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5326'
    });

    await performImageryViewOperationsAndAssert(page, flexibleLayout);
  });
});

test.describe('Example Imagery in Tabs View @clock', () => {
  let tabsView;
  test.beforeEach(async ({ page }) => {
    // We mock the clock so that we don't need to wait for time driven events
    // to verify functionality.
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    tabsView = await createDomainObjectWithDefaults(page, { type: 'Tabs View' });
    await page.goto(tabsView.url);

    /* Create Sine Wave Generator with minimum Image Load Delay */
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

    await page.goto(tabsView.url);
    // Wait for image thumbnail auto-scroll to complete
    await expect(page.getByLabel('Image Thumbnail from').last()).toBeInViewport();
  });
  test('Imagery View operations @clock', async ({ page }) => {
    await performImageryViewOperationsAndAssert(page, tabsView);
  });
});

test.describe('Example Imagery in Time Strip', () => {
  let timeStripObject;
  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    timeStripObject = await createDomainObjectWithDefaults(page, {
      type: 'Time Strip'
    });

    await createDomainObjectWithDefaults(page, {
      type: 'Example Imagery',
      parent: timeStripObject.uuid
    });
    // Navigate to timestrip
    await page.goto(timeStripObject.url);
  });

  test('Clicking a thumbnail loads the image in large view', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5632'
    });

    // Hover over the timestrip to reveal a thumbnail image
    await page.locator('.c-imagery-tsv-container').hover();

    // Get the img src of the hovered image thumbnail
    const hoveredThumbnailImg = page.locator(
      '.c-imagery-tsv div.c-imagery-tsv__image-wrapper:hover img'
    );
    const hoveredThumbnailImgSrc = await hoveredThumbnailImg.getAttribute('src');

    // Verify that imagery timestrip view uses the thumbnailUrl as img src for thumbnails
    expect(hoveredThumbnailImgSrc).toBeTruthy();
    expect(hoveredThumbnailImgSrc).toMatch(thumbnailUrlParamsRegexp);

    // Click on the hovered thumbnail to open "View Large" view
    await page.locator('.c-imagery-tsv-container').click();

    // Get the img src of the large view image
    const viewLargeImg = page.locator('img.c-imagery__main-image__image');
    const viewLargeImgSrc = await viewLargeImg.getAttribute('src');
    expect(viewLargeImgSrc).toBeTruthy();

    // Verify that the image in the large view is the same as the hovered thumbnail
    expect(viewLargeImgSrc).toEqual(hoveredThumbnailImgSrc.split('?')[0]);
  });
});

/**
 * Perform the common actions and assertions for the Imagery View.
 * This function verifies the following in order:
 * 1. Can zoom in/out using the zoom buttons
 * 2. Can zoom in/out using the mouse wheel
 * 3. Can pan the image using the pan hotkey + mouse drag
 * 4. Clicking on the left arrow button pauses imagery and moves to the previous image
 * 5. Imagery is updated as new images stream in, regardless of pause status
 * 6. Old images are discarded when new images stream in
 * 7. Image brightness/contrast can be adjusted by dragging the sliders
 * @param {import('@playwright/test').Page} page
 */
async function performImageryViewOperationsAndAssert(page, layoutObject) {
  // Verify that imagery thumbnails use a thumbnail url
  const thumbnailImages = page.getByLabel('Image thumbnail from').locator('.c-thumb__image');
  const mainImage = page.locator('.c-imagery__main-image__image');
  await expect(thumbnailImages.first()).toHaveAttribute('src', thumbnailUrlParamsRegexp);
  await expect(mainImage).not.toHaveAttribute('src', thumbnailUrlParamsRegexp);
  // Click previous image button
  const previousImageButton = page.getByLabel('Previous image');
  await expect(previousImageButton).toBeVisible();
  await page.getByLabel('Image Wrapper').hover({ trial: true });

  // Need to force click as the annotation canvas lies on top of the image
  // and fails the accessibility checks
  // eslint-disable-next-line playwright/no-force-option
  await previousImageButton.click({ force: true });

  // Use the zoom buttons to zoom in and out
  await buttonZoomOnImageAndAssert(page);

  // Use Mouse Wheel to zoom in to previous image
  await mouseZoomOnImageAndAssert(page, 2);

  // Use alt+drag to move around image once zoomed in
  await panZoomAndAssertImageProperties(page);

  // Use Mouse Wheel to zoom out of previous image
  await mouseZoomOnImageAndAssert(page, -2);

  // Click next image button
  const nextImageButton = page.getByLabel('Next image');
  await expect(nextImageButton).toBeVisible();
  await page.getByLabel('Image Wrapper').hover({ trial: true });
  // eslint-disable-next-line playwright/no-force-option
  await nextImageButton.click({ force: true });
  // set realtime mode
  await navigateToObjectWithRealTime(
    page,
    layoutObject.url,
    `${FIVE_MINUTES}`,
    `${THIRTY_SECONDS}`
  );
  // Verify previous image
  await expect(previousImageButton).toBeVisible();
  await page.getByLabel('Image Wrapper').hover({ trial: true });
  // eslint-disable-next-line playwright/no-force-option
  await previousImageButton.click({ force: true });
  await page.locator('.active').click();
  const selectedImage = page.locator('.selected');
  await expect(selectedImage).toBeVisible();

  // Zoom in on next image
  await mouseZoomOnImageAndAssert(page, 2);

  // Clicking on the left arrow should pause the imagery and go to previous image
  await previousImageButton.click();
  await expect(page.getByLabel('Pause automatic scrolling of image thumbnails')).toBeVisible();
  await expect(selectedImage).toBeVisible();

  // Verify selected image is still displayed
  await expect(selectedImage).toBeVisible();

  // Unpause imagery
  await page.locator('.pause-play').click();

  // verify that old images are discarded
  const lastImageInBounds = page.getByLabel('Image thumbnail from').first();
  const lastImageTimestamp = await lastImageInBounds.getAttribute('title');
  expect(lastImageTimestamp).not.toBeNull();

  // go forward in time to ensure old images are discarded
  await page.clock.fastForward(IMAGE_LOAD_DELAY);
  await page.clock.resume();
  await expect(page.getByLabel(lastImageTimestamp)).toBeHidden();

  //Get background-image url from background-image css prop
  await assertBackgroundImageUrlFromBackgroundCss(page);

  // Open the image filter menu
  await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

  // Drag the brightness and contrast sliders around and assert filter values
  await dragBrightnessSliderAndAssertFilterValues(page);
  await dragContrastSliderAndAssertFilterValues(page);
}

/**
 * Drag the brightness slider to max, min, and midpoint and assert the filter values
 * @param {import('@playwright/test').Page} page
 */
async function dragBrightnessSliderAndAssertFilterValues(page) {
  const brightnessSlider = 'div.c-image-controls__slider-wrapper.icon-brightness > input';
  const brightnessBoundingBox = await page.locator(brightnessSlider).boundingBox();
  const brightnessMidX = brightnessBoundingBox.x + brightnessBoundingBox.width / 2;
  const brightnessMidY = brightnessBoundingBox.y + brightnessBoundingBox.height / 2;

  await page.locator(brightnessSlider).hover({ trial: true });
  await page.mouse.down();
  await page.mouse.move(brightnessBoundingBox.x + brightnessBoundingBox.width, brightnessMidY);
  await assertBackgroundImageBrightness(page, '500');
  await page.mouse.move(brightnessBoundingBox.x, brightnessMidY);
  await assertBackgroundImageBrightness(page, '0');
  await page.mouse.move(brightnessMidX, brightnessMidY);
  await assertBackgroundImageBrightness(page, '250');
  await page.mouse.up();
}

/**
 * Drag the contrast slider to max, min, and midpoint and assert the filter values
 * @param {import('@playwright/test').Page} page
 */
async function dragContrastSliderAndAssertFilterValues(page) {
  const contrastSlider = 'div.c-image-controls__slider-wrapper.icon-contrast > input';
  const contrastBoundingBox = await page.locator(contrastSlider).boundingBox();
  const contrastMidX = contrastBoundingBox.x + contrastBoundingBox.width / 2;
  const contrastMidY = contrastBoundingBox.y + contrastBoundingBox.height / 2;

  await page.locator(contrastSlider).hover({ trial: true });
  await page.mouse.down();
  await page.mouse.move(contrastBoundingBox.x + contrastBoundingBox.width, contrastMidY);
  await assertBackgroundImageContrast(page, '500');
  await page.mouse.move(contrastBoundingBox.x, contrastMidY);
  await assertBackgroundImageContrast(page, '0');
  await page.mouse.move(contrastMidX, contrastMidY);
  await assertBackgroundImageContrast(page, '250');
  await page.mouse.up();
}

/**
 * Gets the filter:brightness value of the current background-image and
 * asserts against an expected value
 * @param {import('@playwright/test').Page} page
 * @param {string} expected The expected brightness value
 */
async function assertBackgroundImageBrightness(page, expected) {
  const backgroundImage = page.locator('.c-imagery__main-image__background-image');

  // Get the brightness filter value (i.e: filter: brightness(500%) => "500")
  const actual = await backgroundImage.evaluate((el) => {
    return el.style.filter.match(/brightness\((\d{1,3})%\)/)[1];
  });
  expect(actual).toBe(expected);
}

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

/**
 * @param {import('@playwright/test').Page} page
 */
async function panZoomAndAssertImageProperties(page) {
  await expect(page.locator('.c-imagery__hints')).toContainText(expectedAltText);
  const zoomedBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
  const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

  // Pan right
  await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
  await page.mouse.down();
  await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
  await page.mouse.up();
  await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
  const afterRightPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

  // Pan left
  await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
  await page.mouse.down();
  await page.mouse.move(imageCenterX, imageCenterY, 10);
  await page.mouse.up();
  await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
  const afterLeftPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

  // Pan up
  await page.mouse.move(imageCenterX, imageCenterY);
  await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
  await page.mouse.down();
  await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
  await page.mouse.up();
  await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
  const afterUpPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(afterUpPanBoundingBox.y).toBeGreaterThanOrEqual(afterLeftPanBoundingBox.y);

  // Pan down
  await Promise.all(panHotkey.map((x) => page.keyboard.down(x)));
  await page.mouse.down();
  await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
  await page.mouse.up();
  await Promise.all(panHotkey.map((x) => page.keyboard.up(x)));
  const afterDownPanBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(afterDownPanBoundingBox.y).toBeLessThanOrEqual(afterUpPanBoundingBox.y);
}

/**
 * Use the mouse wheel to zoom in or out of an image and assert that the image
 * has successfully zoomed in or out.
 * @param {import('@playwright/test').Page} page
 * @param {number} [factor = 2] The zoom factor. Positive for zoom in, negative for zoom out.
 */
async function mouseZoomOnImageAndAssert(page, factor = 2) {
  // Zoom in
  await page.getByLabel('Focused Image Element').hover({ trial: true });
  const originalImageDimensions = await page.getByLabel('Focused Image Element').boundingBox();
  await page.mouse.wheel(0, MOUSE_WHEEL_DELTA_Y * factor);
  await waitForZoomAndPanTransitions(page);

  const zoomedBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
  const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

  // center the mouse pointer
  await page.mouse.move(imageCenterX, imageCenterY);

  // Wait for zoom animation to finish and get the new image dimensions
  const imageMouseZoomed = await page.getByLabel('Focused Image Element').boundingBox();

  if (factor > 0) {
    expect(imageMouseZoomed.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageMouseZoomed.width).toBeGreaterThan(originalImageDimensions.width);
  } else {
    expect(imageMouseZoomed.height).toBeLessThan(originalImageDimensions.height);
    expect(imageMouseZoomed.width).toBeLessThan(originalImageDimensions.width);
  }
}

/**
 * Zoom in and out of the image using the buttons, and assert that the image has
 * been successfully zoomed in or out.
 * @param {import('@playwright/test').Page} page
 */
async function buttonZoomOnImageAndAssert(page) {
  // Lock the zoom and pan so it doesn't reset if a new image comes in
  await page.getByLabel('Focused Image Element').hover({ trial: true });
  const lockButton = page.getByRole('button', {
    name: 'Lock current zoom and pan across all images'
  });
  if (!(await lockButton.isVisible())) {
    await page.getByLabel('Focused Image Element').hover({ trial: true });
  }
  await lockButton.click();

  await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
    'style.transform',
    'scale(1) translate(0px, 0px)'
  );

  // Get initial image dimensions
  const initialBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();

  // Zoom in twice via button
  await zoomIntoImageryByButton(page);
  await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
    'style.transform',
    'scale(2) translate(0px, 0px)'
  );
  await zoomIntoImageryByButton(page);
  await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
    'style.transform',
    'scale(3) translate(0px, 0px)'
  );

  // Get and assert zoomed in image dimensions
  const zoomedInBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
  expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

  // Zoom out once via button
  await zoomOutOfImageryByButton(page);
  await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
    'style.transform',
    'scale(2) translate(0px, 0px)'
  );

  // Get and assert zoomed out image dimensions
  const zoomedOutBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(zoomedOutBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
  expect(zoomedOutBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

  // Zoom out again via button, assert against the initial image dimensions
  await zoomOutOfImageryByButton(page);
  await expect(page.getByLabel('Focused Image Element')).toHaveJSProperty(
    'style.transform',
    'scale(1) translate(0px, 0px)'
  );

  const finalBoundingBox = await page.getByLabel('Focused Image Element').boundingBox();
  expect(finalBoundingBox).toEqual(initialBoundingBox);
}

/**
 * Gets the filter:contrast value of the current background-image and
 * asserts against an expected value
 * @param {import('@playwright/test').Page} page
 * @param {string} expected The expected contrast value
 */
async function assertBackgroundImageContrast(page, expected) {
  const backgroundImage = page.locator('.c-imagery__main-image__background-image');

  // Get the contrast filter value (i.e: filter: contrast(500%) => "500")
  const actual = await backgroundImage.evaluate((el) => {
    return el.style.filter.match(/contrast\((\d{1,3})%\)/)[1];
  });
  expect(actual).toBe(expected);
}

/**
 * Use the '+' button to zoom in. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function zoomIntoImageryByButton(page) {
  // FIXME: There should only be one set of imagery buttons, but there are two?
  const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
  const backgroundImage = page.getByLabel('Focused Image Element');
  await backgroundImage.hover({ trial: true });
  await zoomInBtn.click();
  await waitForZoomAndPanTransitions(page);
}

/**
 * Use the '-' button to zoom out. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function zoomOutOfImageryByButton(page) {
  const zoomOutBtn = page.getByRole('button', { name: 'Zoom out' });
  const backgroundImage = page.getByLabel('Focused Image Element');
  await backgroundImage.hover({ trial: true });
  await zoomOutBtn.click();
  await waitForZoomAndPanTransitions(page);
}

/**
 * Use the reset button to reset image pan and zoom. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function resetImageryPanAndZoom(page) {
  const panZoomResetBtn = page.getByRole('button', { name: 'Remove zoom and pan' });
  await expect(panZoomResetBtn).toBeVisible();
  await panZoomResetBtn.hover({ trial: true });
  await panZoomResetBtn.click();

  await waitForZoomAndPanTransitions(page);
  await expect(page.getByText('Alt drag to pan')).toBeHidden();
  await expect(page.locator('.c-thumb__viewable-area')).toBeHidden();
}

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

/**
 * @param {import('@playwright/test').Page} page
 */
async function waitForZoomAndPanTransitions(page) {
  // Wait for image to stabilize
  await page.getByLabel('Focused Image Element').hover({ trial: true });
  // Wait for zoom to end
  await expect(page.getByLabel('Focused Image Element')).not.toHaveClass(/is-zooming|is-panning/);
  // Wait for image to stabilize
  await page.getByLabel('Focused Image Element').hover({ trial: true });
}
