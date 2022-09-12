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

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');

test.describe('Testing Flexible Layout @unstable', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        // Create Sine Wave Generator
        await createDomainObjectWithDefaults(page, {
            type: 'Sine Wave Generator',
            name: "Test Sine Wave Generator"
        });

        // Create Clock Object
        await createDomainObjectWithDefaults(page, {
            type: 'Clock',
            name: "Test Clock"
        });
    });
    test('panes have the appropriate draggable attribute while in Edit and Browse modes', async ({ page }) => {
        // Create a Flexible Layout
        await createDomainObjectWithDefaults(page, {
            type: 'Flexible Layout',
            name: "Test Flexible Layout"
        });
        // Edit Flexible Layout
        await page.locator('[title="Edit"]').click();

        // Expand the 'My Items' folder in the left tree
        await page.locator('.c-tree__item__view-control.c-disclosure-triangle').first().click();
        // Add the Sine Wave Generator and Clock to the Flexible Layout
        await page.dragAndDrop('text=Test Sine Wave Generator', '.c-fl__container.is-empty');
        await page.dragAndDrop('text=Test Clock', '.c-fl__container.is-empty');
        // Check that panes can be dragged while Flexible Layout is in Edit mode
        let dragWrapper = await page.locator('.c-fl-container__frames-holder .c-fl-frame__drag-wrapper').first();
        await expect(dragWrapper).toHaveAttribute('draggable', 'true');
        // Save Flexible Layout
        await page.locator('button[title="Save"]').click();
        await page.locator('text=Save and Finish Editing').click();
        // Check that panes are not draggable while Flexible Layout is in Browse mode
        dragWrapper = await page.locator('.c-fl-container__frames-holder .c-fl-frame__drag-wrapper').first();
        await expect(dragWrapper).toHaveAttribute('draggable', 'false');
    });
});
