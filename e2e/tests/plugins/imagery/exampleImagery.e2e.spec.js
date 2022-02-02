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
This test suite is dedicated to tests which verify the basic operations surrounding imagery.
*/

const { test, expect } = require('@playwright/test');

test.describe('Example Imagery', () => {
    test('Can use Mouse Wheel to zoom in and out of latest image', async ({ page }) => {
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

        await page.locator('.c-imagery_main-image_background-image').boundingBox();

        // Click .c-imagery_main-image_background-image
        await page.click('.c-imagery_main-image_background-image');

        await page.mouse.wheel(0, 10);

    });
    test.skip('Can use Mouse Wheel to zoom in and out of previous image');
    test.skip('Can use alt+drag to move around image once zoomed in');
    test.skip('Can zoom into the latest image and the real-time/fixed-time imagery will pause');
    test.skip('Can zoom into a previous image from thumbstrip in real-time or fixed-time');
    test.skip('Clicking on the left arrow should pause the imagery and go to previous image');
    test.skip('If the imagery view is in pause mode, it should not be updated when new images come in');
    test.skip('If the imagery view is not in pause mode, it should be updated when new images come in');
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
