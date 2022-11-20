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
This test suite is dedicated to tests which verify branding related components.
*/

const { test, expect } = require('../../baseFixtures.js');

test.describe('Branding tests', () => {
    test('About Modal launches with basic branding properties', async ({ page }) => {
        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Click About button
        await page.click('.l-shell__app-logo');

        // Verify that the NASA Logo Appears
        await expect(page.locator('.c-about__image')).toBeVisible();

        // Modify the Build information in 'about' Modal
        const versionInformationLocator = page.locator('ul.t-info.l-info.s-info').first();
        await expect(versionInformationLocator).toBeEnabled();
        await expect.soft(versionInformationLocator).toContainText(/Version: \d/);
        await expect.soft(versionInformationLocator).toContainText(/Build Date: ((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))/);
        await expect.soft(versionInformationLocator).toContainText(/Revision: \b[0-9a-f]{5,40}\b/);
        await expect.soft(versionInformationLocator).toContainText(/Branch: ./);
    });
    test('Verify the Link to Licenses in About Modal @2p', async ({ page }) => {
        // Go to baseURL
        await page.goto('./', { waitUntil: 'networkidle' });

        // Click About button
        await page.click('.l-shell__app-logo');

        // Verify that clicking on the third party licenses information opens up another tab on licenses url
        const [page2] = await Promise.all([
            page.waitForEvent('popup'),
            page.locator('text=click here for third party licensing information').click()
        ]);
        await page2.waitForLoadState('networkidle'); //Avoids timing issues with juggler/firefox
        expect(page2.waitForURL('**/licenses**')).toBeTruthy();
    });
    test('Verify the Link to User\'s Guide in About Modal - Non-headless chrome version @unstable @2p',
        async ({context, page, browserName, headless}) => {
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip(
                (browserName === 'chromium' && headless === true)
                || browserName === 'firefox'
                || browserName === 'webkit',
                'This test cannot be executed with headless chrome, firefox, and webkit');

            // Go to baseURL
            await page.goto('./', {waitUntil: 'networkidle'});

            // Click About button
            await page.click('.l-shell__app-logo');

            // Clicking the download button opens a new page
            const [page2] = await Promise.all([
                context.waitForEvent('page'),
                page.waitForEvent('popup'),
                page.locator('text=Click here for the Open MCT User\'s Guide in PDF format.').click()
            ]);

            // Subscribe to 'response' events of the new page
            page2.on('requestfinished', response => {
                expect(page2.waitForURL('**/Open_MCT_Users_Guide.pdf')).toBeTruthy();
            });

            await page2.reload();

            // await context.close();
        });
    test('Verify the Link to User\'s Guide in About Modal - Headless chrome, firefox, webkit version @unstable @2p',
        async ({context, page, browserName, headless}) => {
            // eslint-disable-next-line playwright/no-skipped-test
            test.skip(
                browserName === 'chromium' && headless === false,
                'This test cannot be executed with headed chrome');
            // Chromium handles pdf downloads differently in headless mode,
            // see: https://github.com/microsoft/playwright/issues/6342

            // Go to baseURL
            await page.goto('./', {waitUntil: 'networkidle'});

            // Click About button
            await page.click('.l-shell__app-logo');

            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.waitForEvent('popup'),
                page.locator('text=Click here for the Open MCT User\'s Guide in PDF format.').click()
            ]);

            await page.waitForLoadState('networkidle'); //Avoids timing issues with juggler/firefox

            // const download = await page.waitForEvent('download');
            const endsWithPdf = download.suggestedFilename().endsWith('Open_MCT_Users_Guide.pdf');
            expect(endsWithPdf).toBeTruthy();

            await context.close();
        });
});
