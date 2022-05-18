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

const { test } = require('../../../fixtures.js');
const { expect } = require('@playwright/test');

test.describe('Example Imagery', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(msg.text()));
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Click on My Items in Tree. Workaround for https://github.com/nasa/openmct/issues/5184
        await page.click('form[name="mctForm"] a:has-text("My Items")');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle'}),
            page.click('text=OK'),
            //Wait for Save Banner to appear
            page.waitForSelector('.c-message-banner__message')
        ]);
        //Wait until Save Banner is gone
        await page.waitForSelector('.c-message-banner__message', { state: 'detached'});
        await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
    });

    const backgroundImageSelector = '.c-imagery__main-image__background-image';
    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        const deltaYStep = 100; //equivalent to 1x zoom
        await bgImageLocator.hover();
        const originalImageDimensions = await page.locator(backgroundImageSelector).boundingBox();
        // zoom in
        await bgImageLocator.hover();
        await page.mouse.wheel(0, deltaYStep * 2);
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const imageMouseZoomedIn = await page.locator(backgroundImageSelector).boundingBox();
        // zoom out
        await bgImageLocator.hover();
        await page.mouse.wheel(0, -deltaYStep);
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const imageMouseZoomedOut = await page.locator(backgroundImageSelector).boundingBox();

        expect(imageMouseZoomedIn.height).toBeGreaterThan(originalImageDimensions.height);
        expect(imageMouseZoomedIn.width).toBeGreaterThan(originalImageDimensions.width);
        expect(imageMouseZoomedOut.height).toBeLessThan(imageMouseZoomedIn.height);
        expect(imageMouseZoomedOut.width).toBeLessThan(imageMouseZoomedIn.width);

    });

    test('Can use alt+drag to move around image once zoomed in', async ({ page }) => {
        const deltaYStep = 100; //equivalent to 1x zoom
        const panHotkey = process.platform === 'linux' ? ['Control', 'Alt'] : ['Alt'];

        const bgImageLocator = await page.locator(backgroundImageSelector);
        await bgImageLocator.hover();

        // zoom in
        await page.mouse.wheel(0, deltaYStep * 2);
        await bgImageLocator.hover();
        const zoomedBoundingBox = await bgImageLocator.boundingBox();
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
        const expectedAltText = process.platform === 'linux' ? 'Ctrl+Alt drag to pan' : 'Alt drag to pan';
        const imageryHintsText = await page.locator('.c-imagery__hints').innerText();
        expect(expectedAltText).toEqual(imageryHintsText);

        // pan right
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterRightPanBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

        // pan left
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterLeftPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

        // pan up
        await page.mouse.move(imageCenterX, imageCenterY);
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterUpPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

        // pan down
        await Promise.all(panHotkey.map(x => page.keyboard.down(x)));
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
        await page.mouse.up();
        await Promise.all(panHotkey.map(x => page.keyboard.up(x)));
        const afterDownPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterDownPanBoundingBox.y).toBeLessThan(afterUpPanBoundingBox.y);

    });

    test('Can use + - buttons to zoom on the image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        await bgImageLocator.hover();
        const zoomInBtn = await page.locator('.t-btn-zoom-in');
        const zoomOutBtn = await page.locator('.t-btn-zoom-out');
        const initialBoundingBox = await bgImageLocator.boundingBox();

        await zoomInBtn.click();
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const zoomedInBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        await zoomOutBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const zoomedOutBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedOutBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect(zoomedOutBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

    });

    test('Can use the reset button to reset the image', async ({ page }) => {
        const bgImageLocator = await page.locator(backgroundImageSelector);
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const zoomInBtn = await page.locator('.t-btn-zoom-in');
        const zoomResetBtn = await page.locator('.t-btn-zoom-reset');
        const initialBoundingBox = await bgImageLocator.boundingBox();

        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const zoomedInBoundingBox = await bgImageLocator.boundingBox();
        expect.soft(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect.soft(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        await zoomResetBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        const resetBoundingBox = await bgImageLocator.boundingBox();
        expect.soft(resetBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect.soft(resetBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

        expect.soft(resetBoundingBox.height).toEqual(initialBoundingBox.height);
        expect(resetBoundingBox.width).toEqual(initialBoundingBox.width);
    });

    test('Using the zoom features does not pause telemetry', async ({ page }) => {
        const bgImageLocator = page.locator(backgroundImageSelector);
        const pausePlayButton = page.locator('.c-button.pause-play');
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        // open the time conductor drop down
        await page.locator('.c-conductor__controls button.c-mode-button').click();
        // Click local clock
        await page.locator('.icon-clock >> text=Local Clock').click();

        await expect.soft(pausePlayButton).not.toHaveClass(/is-paused/);
        const zoomInBtn = page.locator('.t-btn-zoom-in');
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();

        return expect(pausePlayButton).not.toHaveClass(/is-paused/);
    });

    //test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    //test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    //test.fixme('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    //test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    //test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    //test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Display layout', () => {
    test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    test.fixme('Can use alt+drag to move around image once zoomed in');
    test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Flexible layout', () => {
    test.fixme('Can use Mouse Wheel to zoom in and out of previous image');
    test.fixme('Can use alt+drag to move around image once zoomed in');
    test.fixme('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.fixme('Clicking on the left arrow should pause the imagery and go to previous image');
    test.fixme('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.fixme('If the imagery view is not in pause mode, it should be updated when new images come in');
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
