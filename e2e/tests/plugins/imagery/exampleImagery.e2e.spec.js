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

const { test, expect } = require('@playwright/test');

test.describe('Example Imagery', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(msg.text()))
        //Go to baseURL
        await page.goto('/', { waitUntil: 'networkidle' });

        //Click the Create button
        await page.click('button:has-text("Create")');

        // Click text=Example Imagery
        await page.click('text=Example Imagery');

        // Click text=OK
        await Promise.all([
            page.waitForNavigation(/*{ url: 'http://localhost:8080/#/browse/mine/dab945d4-5a84-480e-8180-222b4aa730fa?tc.mode=fixed&tc.startBound=1639696164435&tc.endBound=1639697964435&tc.timeSystem=utc&view=conditionSet.view' }*/),
            page.click('text=OK')
        ]);

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

        // pan right
        await page.keyboard.down('Alt');
        await page.mouse.down();
        await page.mouse.move(imageCenterX - 200, imageCenterY, 10);
        await page.mouse.up();
        await page.keyboard.up('Alt');
        const afterRightPanBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedBoundingBox.x).toBeGreaterThan(afterRightPanBoundingBox.x);

        // pan left
        await page.keyboard.down('Alt');
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY, 10);
        await page.mouse.up();
        await page.keyboard.up('Alt');
        const afterLeftPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterRightPanBoundingBox.x).toBeLessThan(afterLeftPanBoundingBox.x);

        // pan up
        await page.mouse.move(imageCenterX, imageCenterY);
        await page.keyboard.down('Alt');
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY + 200, 10);
        await page.mouse.up();
        await page.keyboard.up('Alt');
        const afterUpPanBoundingBox = await bgImageLocator.boundingBox();
        expect(afterUpPanBoundingBox.y).toBeGreaterThan(afterLeftPanBoundingBox.y);

        // pan down
        await page.keyboard.down('Alt');
        await page.mouse.down();
        await page.mouse.move(imageCenterX, imageCenterY - 200, 10);
        await page.mouse.up();
        await page.keyboard.up('Alt');
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
        await bgImageLocator.hover();
        const zoomInBtn = await page.locator('.t-btn-zoom-in');
        const zoomResetBtn = await page.locator('.t-btn-zoom-reset');
        const initialBoundingBox = await bgImageLocator.boundingBox();

        await zoomInBtn.click();
        await zoomInBtn.click();
        // wait for zoom animation to finish
        await bgImageLocator.hover();
        const zoomedInBoundingBox = await bgImageLocator.boundingBox();
        expect(zoomedInBoundingBox.height).toBeGreaterThan(initialBoundingBox.height);
        expect(zoomedInBoundingBox.width).toBeGreaterThan(initialBoundingBox.width);

        await zoomResetBtn.click();
        await bgImageLocator.hover();

        const resetBoundingBox = await bgImageLocator.boundingBox();
        expect(resetBoundingBox.height).toBeLessThan(zoomedInBoundingBox.height);
        expect(resetBoundingBox.width).toBeLessThan(zoomedInBoundingBox.width);

        expect(resetBoundingBox.height).toEqual(initialBoundingBox.height);
        expect(resetBoundingBox.width).toEqual(initialBoundingBox.width);
    });

    //test('Can use Mouse Wheel to zoom in and out of previous image');
    //test('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    //test.skip('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    //test.skip('Clicking on the left arrow should pause the imagery and go to previous image');
    //test.skip('If the imagery view is in pause mode, it should not be updated when new images come in');
    //test.skip('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Display layout', () => {
    test.skip('Can use Mouse Wheel to zoom in and out of previous image');
    test.skip('Can use alt+drag to move around image once zoomed in');
    test.skip('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.skip('Clicking on the left arrow should pause the imagery and go to previous image');
    test.skip('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.skip('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Flexible layout', () => {
    test.skip('Can use Mouse Wheel to zoom in and out of previous image');
    test.skip('Can use alt+drag to move around image once zoomed in');
    test.skip('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.skip('Clicking on the left arrow should pause the imagery and go to previous image');
    test.skip('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.skip('If the imagery view is not in pause mode, it should be updated when new images come in');
});

test.describe('Example Imagery in Tabs view', () => {
    test.skip('Can use Mouse Wheel to zoom in and out of previous image');
    test.skip('Can use alt+drag to move around image once zoomed in');
    test.skip('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.skip('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    test.skip('Clicking on the left arrow should pause the imagery and go to previous image');
    test.skip('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.skip('If the imagery view is not in pause mode, it should be updated when new images come in');
});
