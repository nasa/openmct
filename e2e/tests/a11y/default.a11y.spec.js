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

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults, expandTreePaneItemByName } = require('../../appActions');
const { injectAxe, checkA11y, getViolations, reportViolations } = require('axe-playwright');
const { createHtmlReport } = require('axe-html-reporter');
const AxeBuilder = require('@axe-core/playwright').default; // 1

test.describe('Visual - Default', () => {
    test.beforeEach(async ({ page }) => {
        //Go to baseURL and Hide Tree
        await page.goto('./#/browse/mine?hideTree=true', { waitUntil: 'networkidle' });
        await injectAxe(page);
    });

    test.only('axe-playwright - basic reporting', async ({ page, theme }) => {
        // Verify that Create button is actionable
        await expect(page.locator('button:has-text("Create")')).toBeEnabled();

        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true }
        });
    });

    test('axe-playwright - notebook', async ({ page, theme, openmctConfig }) => {
        const { myItemsFolderName } = openmctConfig;

        // Create Notebook
        const notebook = await createDomainObjectWithDefaults(page, {
            type: 'Notebook',
            name: "Embed Test Notebook"
        });
        // Create Overlay Plot
        await createDomainObjectWithDefaults(page, {
            type: 'Overlay Plot',
            name: "Dropped Overlay Plot"
        });

        await expandTreePaneItemByName(page, myItemsFolderName);

        await page.goto(notebook.url);
        await page.dragAndDrop('role=treeitem[name=/Dropped Overlay Plot/]', '.c-notebook__drag-area');

        await percySnapshot(page, `Notebook w/ dropped embed (theme: ${theme})`);

        await checkA11y(page, null, {
            detailedReport: true,
            detailedReportOptions: { html: true }
        });
    });

    test('axe-playwright - html reporting with wcag2aa rules 2', async ({ page, theme }) => {
        // Verify that Create button is actionable
        await expect(page.locator('button:has-text("Create")')).toBeEnabled();

        await checkA11y(page, null,
            {
                axeOptions: {
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2aa']
                    }
                }
            },
            true, 'default',
            {
                outputDirPath: './results',
                outputDir: 'accessibility',
                reportFileName: 'accessibility-audit.html'
            }
        );
    });

    test('axe-playwright - html reporting with wcag2aa rules', async ({ page, theme }) => {
        // Verify that Create button is actionable
        await expect(page.locator('button:has-text("Create")')).toBeEnabled();

        await checkA11y(page, null,
            {
                axeOptions: {
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2aa']
                    }
                }
            },
            true, 'default',
            { reporter: 'html' }
        );
        await createHtmlReport(
            { results: { violations: args.violations } }
        );

    });

    test('axeBuilder - should not have any automatically detectable accessibility issues', async ({ page }, testInfo) => {

        const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze(); // 4

        await testInfo.attach('accessibility-scan-results', {
            body: JSON.stringify(accessibilityScanResults, null, 2),
            contentType: 'application/json'
        });

        expect(accessibilityScanResults.violations).toEqual([]); // 5
    });

});
