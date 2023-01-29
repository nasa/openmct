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
Tests to verify log plot functionality. Note this test suite if very much under active development and should not
necessarily be used for reference when writing new tests in this area.
*/

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Stacked Plot', () => {

    test('Using the remove action removes the correct plot', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const overlayPlot = await createDomainObjectWithDefaults(page, {
            type: "Overlay Plot"
        });

        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg a',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg b',
            parent: overlayPlot.uuid
        });
        await createDomainObjectWithDefaults(page, {
            type: "Sine Wave Generator",
            name: 'swg c',
            parent: overlayPlot.uuid
        });
        await page.goto(overlayPlot.url);
        await page.click('button[title="Edit"]');

        // Expand the elements pool vertically
        await page.locator('.l-pane__handle').nth(2).hover({ trial: true });
        await page.mouse.down();
        await page.mouse.move(0, 100);
        await page.mouse.up();

        await page.locator('.js-elements-pool__tree >> text=swg b').click({ button: 'right' });
        await page.locator('.c-overlay .c-button >> text=OK').click();

        // Wait until the number of elements in the elements pool has changed, and then confirm that the correct children were retained
        await page.waitForFunction(() => {
            return Array.from(document.querySelectorAll('.js-elements-pool__tree .js-elements-pool__item')).length === 2;
        });

        expect(page.locator('.js-elements-pool__tree >> text=swg a')).toBeTruthy();
        expect(page.locator('.js-elements-pool__tree >> text=swg b')).toBeFalsy();
        expect(page.locator('.js-elements-pool__tree >> text=swg c')).toBeTruthy();
    });
});
