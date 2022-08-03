/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
/* globals process */

const { waitForAnimations } = require('../../../../baseFixtures');
const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const backgroundImageSelector = '.c-imagery__main-image__background-image';
const panHotkey = process.platform === 'linux' ? ['Control', 'Alt'] : ['Alt'];
const expectedAltText = process.platform === 'linux' ? 'Ctrl+Alt drag to pan' : 'Alt drag to pan';

//The following block of tests verifies the basic functionality of example imagery and serves as a template for Imagery objects embedded in other objects.
test.describe('Example Imagery Object', () => {

    test.beforeEach(async ({ page }) => {
        //Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create a default 'Example Imagery' object
        createDomainObjectWithDefaults(page, 'Example Imagery');

        await Promise.all([
            page.waitForNavigation(),
            page.locator(backgroundImageSelector).hover({trial: true}),
            // eslint-disable-next-line playwright/missing-playwright-await
            expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery')
        ]);

        // Verify that the created object is focused
    });

    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
        const deltaYStep = 100; //equivalent to 1x zoom
        await page.locator(backgroundImageSelector).hover({trial: true});
        const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
        // zoom in
        await page.locator(backgroundImageSelector).hover({trial: true});
        await page.mouse.wheel(0, deltaYStep * 2);
        // wait for zoom animation to finish
        await page.locator(backgroundImageSelector).hover({trial: true});
        const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
        // zoom out
        await page.locator(backgroundImageSelector).hover({trial: true});
        await page.mouse.wheel(0, -deltaYStep);
        // wait for zoom animation to finish
        await page.locator(backgroundImageSelector).hover({trial: true});
        const imageMouseZoomedOut = await page.locator(backgroundImageSelector).boundingBox();

        expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
        expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);
        expect(imageMouseZoomedOut.height).toBeLessThan(imageMouseZoomedIn.height);
        expect(imageMouseZoomedOut.width).toBeLessThan(imageMouseZoomedIn.width);
    });

    test('Can adjust image brightness/contrast by dragging the sliders', async ({ page, browserName }) => {
        test.fixme(browserName === 'firefox', 'This test needs to be updated to work with firefox');
        // Open the image filter menu
        await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

        // Drag the brightness and contrast sliders around and assert filter values
        await dragBrightnessSliderAndAssertFilterValues(page);
        await dragContrastSliderAndAssertFilterValues(page);
    });

    test('Can use alt+drag to move around image once zoomed in', async ({ page }) => {
        const deltaYStep = 100; //equivalent to 1x zoom

        await page.locator(backgroundImageSelector).hover({trial: true});

        // zoom in
        await page.mouse.wheel(0, deltaYStep * 2);
        await page.locator(backgroundImageSelector).hover({trial: true});
        const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
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
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterRightPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

        // pan left
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterLeftPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

        // pan up
        await page.mouse.move(imageCenterX, imageCenterY);
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterUpPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

        // pan down
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterDownPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(afterDownPanBoundingBox.y).toBeLessThan(afterUpPanBoundingBox.y);

    });

    test('Can use + - buttons to zoom on the image @unstable', async ({ page }) => {
        // Get initial image dimensions
        const initialBoundingBox = await page.locator(backgroundImageSelector).boundingBox();

        // Zoom in twice via button
        await zoomIntoImageryByButton(page);
        await zoomIntoImageryByButton(page);

        // Get and assert zoomed in image dimensions
        const zoomedInBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        // Zoom out once via button
        await zoomOutOfImageryByButton(page);

        // Get and assert zoomed out image dimensions
        const zoomedOutBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(zoomedOutBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect(zoomedOutBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

        // Zoom out again via button, assert against the initial image dimensions
        await zoomOutOfImageryByButton(page);
        const finalBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(finalBoundingBox).toEqual(initialBoundingBox);
    });

    test('Can use the reset button to reset the image @unstable', async ({ page }, testInfo) => {
        test.slow(testInfo.project === 'chrome-beta', "This test is slow in chrome-beta");
        // Get initial image dimensions
        const initialBoundingBox = await page.locator(backgroundImageSelector).boundingBox();

        // Zoom in twice via button
        await zoomIntoImageryByButton(page);
        await zoomIntoImageryByButton(page);

        // Get and assert zoomed in image dimensions
        const zoomedInBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect.soft(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect.soft(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        // Reset pan and zoom and assert against initial image dimensions
        await resetImageryPanAndZoom(page);
        const finalBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        expect(finalBoundingBox).toEqual(initialBoundingBox);
    });

    test('Using the zoom features does not pause telemetry', async ({ page }) => {
        const pausePlayButton = page.locator('.c-button.pause-play');

        // open the time conductor drop down
        await page.locator('.c-mode-button').click();

        // Click local clock
        await page.locator('[data-testid="conductor-modeOption-realtime"]').click();
        await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);

        // Zoom in via button
        await zoomIntoImageryByButton(page);
        await expect(pausePlayButton).not.toHaveClass(/is-paused/);
    });

});

// The following test case will cover these scenarios
// ('Can use Mouse Wheel to zoom in and out of previous image');
// ('Can use alt+drag to move around image once zoomed in');
// ('Clicking on the left arrow should pause the imagery and go to previous image');
// ('If the imagery view is in pause mode, it should not be updated when new images come in');
// ('If the imagery view is not in pause mode, it should be updated when new images come in');
test('Example Imagery in Display layout @unstable', async ({ page }) => {
    test.info().annotations.push({
        type: 'issue',
        description: 'https://github.com/nasa/openmct/issues/5265'
    });

    // Go to baseURL
    await page.goto('./', { waitUntil: 'networkidle' });

    // Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Example Imagery
    await page.click('text=Example Imagery');

    // Clear and set Image load delay to minimum value
    await page.locator('input[type="number"]').fill('');
    await page.locator('input[type="number"]').fill('5000');

    // Click text=OK
    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle'}),
        page.click('text=OK'),
        //Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // Wait until Save Banner is gone
    await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
    await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
    await page.locator(backgroundImageSelector).hover({trial: true});

    // Click previous image button
    const previousImageButton = page.locator('.c-nav--prev');
    await previousImageButton.click();

    // Verify previous image
    const selectedImage = page.locator('.selected');
    await expect(selectedImage).toBeVisible();

    // Zoom in
    const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
    await page.locator(backgroundImageSelector).hover({trial: true});
    const deltaYStep = 100; // equivalent to 1x zoom
    await page.mouse.wheel(0, deltaYStep * 2);
    const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // Wait for zoom animation to finish
    await page.locator(backgroundImageSelector).hover({trial: true});
    const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
    expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);

    // Center the mouse pointer
    await page.mouse.move(imageCenterX, imageCenterY);

    // Pan Imagery Hints
    const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
    expect(expectedAltText).toEqual(imageryHintsText);

    // Click next image button
    const nextImageButton = page.locator('.c-nav--next');
    await nextImageButton.click();

    // Click time conductor mode button
    await page.locator('.c-mode-button').click();

    // Select local clock mode
    await page.locator('[data-testid=conductor-modeOption-realtime]').click();

    // Zoom in on next image
    await page.locator(backgroundImageSelector).hover({trial: true});
    await page.mouse.wheel(0, deltaYStep * 2);

    // Wait for zoom animation to finish
    await page.locator(backgroundImageSelector).hover({trial: true});
    const imageNextMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
    expect(imageNextMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageNextMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);

    // Click previous image button
    await previousImageButton.click();

    // Verify previous image
    await expect(selectedImage).toBeVisible();

    const imageCount = await page.locator('.c-imagery__thumb').count();
    await expect.poll(async () => {
        const newImageCount = await page.locator('.c-imagery__thumb').count();

        return newImageCount;
    }, {
        message: "verify that old images are discarded",
        timeout: 6 * 1000
    }).toBe(imageCount);

    // Verify selected image is still displayed
    await expect(selectedImage).toBeVisible();

    // Unpause imagery
    await page.locator('.pause-play').click();

    //Get background-image url from background-image css prop
    await assertBackgroundImageUrlFromBackgroundCss(page);

    // Open the image filter menu
    await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

    // Drag the brightness and contrast sliders around and assert filter values
    await dragBrightnessSliderAndAssertFilterValues(page);
    await dragContrastSliderAndAssertFilterValues(page);
});

test.describe('Example imagery thumbnails resize in display layouts', () => {
    test('Resizing the layout changes thumbnail visibility and size', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        const thumbsWrapperLocator = page.locator('.c-imagery__thumbs-wrapper');
        // Click button:has-text("Create")
        await page.locator('button:has-text("Create")').click();

        // Click li:has-text("Display Layout")
        await page.locator('li:has-text("Display Layout")').click();
        const displayLayoutTitleField = page.locator('text=Properties Title Notes Horizontal grid (px) Vertical grid (px) Horizontal size ( >> input[type="text"]');
        await displayLayoutTitleField.click();

        await displayLayoutTitleField.fill('Thumbnail Display Layout');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click()
        ]);

        // Click text=Snapshot Save and Finish Editing Save and Continue Editing >> button >> nth=1
        await page.locator('text=Snapshot Save and Finish Editing Save and Continue Editing >> button').nth(1).click();

        // Click text=Save and Finish Editing
        await page.locator('text=Save and Finish Editing').click();

        // Click button:has-text("Create")
        await page.locator('button:has-text("Create")').click();

        // Click li:has-text("Example Imagery")
        await page.locator('li:has-text("Example Imagery")').click();

        const imageryTitleField = page.locator('text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]');
        // Click text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]
        await imageryTitleField.click();

        // Fill text=Properties Title Notes Images url list (comma separated) Image load delay (milli >> input[type="text"]
        await imageryTitleField.fill('Thumbnail Example Imagery');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=OK').click()
        ]);

        // Click text=Thumbnail Example Imagery Imagery Layout Snapshot >> button >> nth=0
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Thumbnail Example Imagery Imagery Layout Snapshot >> button').first().click()
        ]);

        // Edit mode
        await page.locator('text=Thumbnail Display Layout Snapshot >> button').nth(3).click();

        // Click on example imagery to expose toolbar
        await page.locator('text=Thumbnail Example Imagery Snapshot Large View').click();

        // expect thumbnails not be visible when first added
        expect.soft(thumbsWrapperLocator.isHidden()).toBeTruthy();

        // Resize the example imagery vertically to change the thumbnail visibility
        /*
        The following arbitrary values are added to observe the separate visual
        conditions of the thumbnails (hidden, small thumbnails, regular thumbnails).
        Specifically, height is set to 50px for small thumbs and 100px for regular
        */
        // Click #mct-input-id-103
        await page.locator('#mct-input-id-103').click();

        // Fill #mct-input-id-103
        await page.locator('#mct-input-id-103').fill('50');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).toHaveClass(/is-small-thumbs/);

        // Resize the example imagery vertically to change the thumbnail visibility
        // Click #mct-input-id-103
        await page.locator('#mct-input-id-103').click();

        // Fill #mct-input-id-103
        await page.locator('#mct-input-id-103').fill('100');

        expect(thumbsWrapperLocator.isVisible()).toBeTruthy();
        await expect(thumbsWrapperLocator).not.toHaveClass(/is-small-thumbs/);
    });
});

// test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
// test.fixme('Can use alt+drag to move around image once zoomed in');
// test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
// test.fixme('If the imagery view is in pause mode, images still come in');
// test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
test.describe('Example Imagery in Flexible layout', () => {
    test('Example Imagery in Flexible layout @unstable', async ({ page, browserName, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        test.fixme(browserName === 'firefox', 'This test needs to be updated to work with firefox');
        test.info().annotations.push({
            type: 'issue',
            description: 'https://github.com/nasa/openmct/issues/5326'
        });

        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Clear and set Image load delay (milliseconds)
        await page.click('input[type="number"]', {clickCount: 3});
        await page.type('input[type="number"]', "20");

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);
        // Wait until Save Banner is gone
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
        await page.locator(backgroundImageSelector).hover({trial: true});

        // Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Flexible Layout
        await page.click('text=Flexible Layout');

        // Assert Flexible layout
        await expect(page.locator('.js-form-title')).toHaveText('Create a New Flexible Layout');

        await page.locator(`form[name="mctForm"] >> text=${myItemsFolderName}`).click();

        // Click My Items
        await Promise.all([
            page.locator('text=OK').click(),
            page.waitForNavigation({waitUntil: 'networkidle'})
        ]);

        // Click My Items
        await page.locator('.c-disclosure-triangle').click();

        // Right click example imagery
        await page.click(('text=Unnamed Example Imagery'), { button: 'right' });

        // Click move
        await page.locator('.icon-move').click();

        // Click triangle to open sub menu
        await page.locator('.c-form__section .c-disclosure-triangle').click();

        // Click Flexable Layout
        await page.click('.c-overlay__outer >> text=Unnamed Flexible Layout');

        // Click text=OK
        await page.locator('text=OK').click();

        // Save template
        await saveTemplate(page);

        // Zoom in
        await mouseZoomIn(page);

        // Center the mouse pointer
        const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
        const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
        const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;
        await page.mouse.move(imageCenterX, imageCenterY);

        // Pan zoom
        await panZoomAndAssertImageProperties(page);

        // Click previous image button
        const previousImageButton = page.locator('.c-nav--prev');
        await previousImageButton.click();

        // Verify previous image
        const selectedImage = page.locator('.selected');
        await expect(selectedImage).toBeVisible();

        // Click time conductor mode button
        await page.locator('.c-mode-button').click();

        // Select local clock mode
        await page.locator('[data-testid=conductor-modeOption-realtime]').nth(0).click();

        // Zoom in on next image
        await mouseZoomIn(page);

        // Click previous image button
        await previousImageButton.click();

        // Verify previous image
        await expect(selectedImage).toBeVisible();

        const imageCount = await page.locator('.c-imagery__thumb').count();
        await expect.poll(async () => {
            const newImageCount = await page.locator('.c-imagery__thumb').count();

            return newImageCount;
        }, {
            message: "verify that old images are discarded",
            timeout: 6 * 1000
        }).toBe(imageCount);

        // Verify selected image is still displayed
        await expect(selectedImage).toBeVisible();

        // Unpause imagery
        await page.locator('.pause-play').click();

        //Get background-image url from background-image css prop
        await assertBackgroundImageUrlFromBackgroundCss(page);

        // Open the image filter menu
        await page.locator('[role=toolbar] button[title="Brightness and contrast"]').click();

        // Drag the brightness and contrast sliders around and assert filter values
        await dragBrightnessSliderAndAssertFilterValues(page);
        await dragContrastSliderAndAssertFilterValues(page);
    });
});

test.describe('Example Imagery in Tabs view', () => {
    test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    test.fixme('Can use alt+drag to move around image once zoomed in');
    test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.fixme('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function saveTemplate(page) {
    await page.locator('.c-button--menu.c-button--major.icon-save').click();
    await page.locator('text=Save and Finish Editing').click();
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

    await page.locator(brightnessSlider).hover({trial: true});
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

    await page.locator(contrastSlider).hover({trial: true});
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
 * @param {String} expected The expected brightness value
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
    const backgroundImage = page.locator('.c-imagery__main-image__background-image');
    let backgroundImageUrl = await backgroundImage.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
    });
    let backgroundImageUrl1 = backgroundImageUrl.slice(1, -1); //forgive me, padre
    console.log('backgroundImageUrl1 ' + backgroundImageUrl1);

    let backgroundImageUrl2;
    await expect.poll(async () => {
        // Verify next image has updated
        let backgroundImageUrlNext = await backgroundImage.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('background-image').match(/url\(([^)]+)\)/)[1];
        });
        backgroundImageUrl2 = backgroundImageUrlNext.slice(1, -1); //forgive me, padre

        return backgroundImageUrl2;
    }, {
        message: "verify next image has updated",
        timeout: 6 * 1000
    }).not.toBe(backgroundImageUrl1);
    console.log('backgroundImageUrl2 ' + backgroundImageUrl2);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function panZoomAndAssertImageProperties(page) {
    const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
    expect(expectedAltText).toEqual(imageryHintsText);
    const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // Pan right
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterRightPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

    // Pan left
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterLeftPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

    // Pan up
    await page.mouse.move(imageCenterX, imageCenterY);
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterUpPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterUpPanBoundingBox.y).toBeGreaterThanOrEqual(afterLeftPanBoundingBox.y);

    // Pan down
    await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
    await page.mouse.down();
    await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
    await page.mouse.up();
    await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
    const afterDownPanBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    expect(afterDownPanBoundingBox.y).toBeLessThanOrEqual(afterUpPanBoundingBox.y);
}

/**
 * @param {import('@playwright/test').Page} page
*/
async function mouseZoomIn(page) {
    // Zoom in
    const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
    await page.locator(backgroundImageSelector).hover({trial: true});
    const deltaYStep = 100; // equivalent to 1x zoom
    await page.mouse.wheel(0, deltaYStep * 2);
    const zoomedBoundingBox = await page.locator(backgroundImageSelector).boundingBox();
    const imageCenterX = zoomedBoundingBox.x + zoomedBoundingBox.width / 2;
    const imageCenterY = zoomedBoundingBox.y + zoomedBoundingBox.height / 2;

    // center the mouse pointer
    await page.mouse.move(imageCenterX, imageCenterY);

    // Wait for zoom animation to finish
    await page.locator(backgroundImageSelector).hover({trial: true});
    const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
    expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
    expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);
}

/**
 * Gets the filter:contrast value of the current background-image and
 * asserts against an expected value
 * @param {import('@playwright/test').Page} page
 * @param {String} expected The expected contrast value
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
    const zoomInBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-in").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await zoomInBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await zoomInBtn.click();
    await waitForAnimations(backgroundImage);
}

/**
 * Use the '-' button to zoom out. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function zoomOutOfImageryByButton(page) {
    // FIXME: There should only be one set of imagery buttons, but there are two?
    const zoomOutBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-out").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await zoomOutBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await zoomOutBtn.click();
    await waitForAnimations(backgroundImage);
}

/**
 * Use the reset button to reset image pan and zoom. Hovers first if the toolbar is not visible
 * and waits for the zoom animation to finish afterwards.
 * @param {import('@playwright/test').Page} page
 */
async function resetImageryPanAndZoom(page) {
    // FIXME: There should only be one set of imagery buttons, but there are two?
    const panZoomResetBtn = page.locator("[role='toolbar'][aria-label='Image controls'] .t-btn-zoom-reset").nth(0);
    const backgroundImage = page.locator(backgroundImageSelector);
    if (!(await panZoomResetBtn.isVisible())) {
        await backgroundImage.hover({trial: true});
    }

    await panZoomResetBtn.click();
    await waitForAnimations(backgroundImage);
}
