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

const { test, expect } = require('../../baseFixtures.js');
const { createDomainObjectWithDefaults } = require('../../appActions.js');

test.describe('AppActions', () => {
    test('createDomainObjectsWithDefaults', async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        const e2eFolder = await createDomainObjectWithDefaults(page, {
            type: 'Folder',
            name: 'e2e folder'
        });

        await test.step('Create multiple flat objects in a row', async () => {
            const timer1 = await createDomainObjectWithDefaults(page, {
                type: 'Timer',
                name: 'Timer Foo',
                parent: e2eFolder.uuid
            });
            const timer2 = await createDomainObjectWithDefaults(page, {
                type: 'Timer',
                name: 'Timer Bar',
                parent: e2eFolder.uuid
            });
            const timer3 = await createDomainObjectWithDefaults(page, {
                type: 'Timer',
                name: 'Timer Baz',
                parent: e2eFolder.uuid
            });

            await page.goto(timer1.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Timer Foo');
            await page.goto(timer2.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Timer Bar');
            await page.goto(timer3.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Timer Baz');
        });

        await test.step('Create multiple nested objects in a row', async () => {
            const folder1 = await createDomainObjectWithDefaults(page, {
                type: 'Folder',
                name: 'Folder Foo',
                parent: e2eFolder.uuid
            });
            const folder2 = await createDomainObjectWithDefaults(page, {
                type: 'Folder',
                name: 'Folder Bar',
                parent: folder1.uuid
            });
            const folder3 = await createDomainObjectWithDefaults(page, {
                type: 'Folder',
                name: 'Folder Baz',
                parent: folder2.uuid
            });
            await page.goto(folder1.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Folder Foo');
            await page.goto(folder2.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Folder Bar');
            await page.goto(folder3.url, { waitUntil: 'networkidle' });
            await expect(page.locator('.l-browse-bar__object-name')).toHaveText('Folder Baz');

            expect(folder1.url).toBe(`${e2eFolder.url}/${folder1.uuid}`);
            expect(folder2.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}`);
            expect(folder3.url).toBe(`${e2eFolder.url}/${folder1.uuid}/${folder2.uuid}/${folder3.uuid}`);
        });
    });
});
