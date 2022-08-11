/* eslint-disable no-undef */
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

/**
 * The file contains custom fixtures which extend the base functionality of the Playwright fixtures
 * and appActions. These fixtures should be generalized across all plugins.
 */

const { test, expect } = require('./baseFixtures');
const path = require('path');

/**
 * The default theme for VIPER and Open MCT is the 'espresso' theme. Overriding this value with 'snow' in our playwright config.js
 * will override the default theme by injecting the 'snow' theme on launch.
 *
 * ### Example:
 * ```js
 * projects: [
 * {
 *     name: 'chrome-snow-theme',
 *     use: {
 *         browserName: 'chromium',
 *         theme: 'snow'
 * ```
 * @type {'snow' | 'espresso'}
 */
const theme = 'espresso';

/**
 * The name of the "My Items" folder in the domain object tree.
 *
 * Default: `"My Items"`
 *
 * @type {string}
 */
const myItemsFolderName = "My Items";

exports.test = test.extend({
    // This should follow in the Project's configuration. Can be set to 'snow' in playwright config.js
    theme: [theme, { option: true }],
    // eslint-disable-next-line no-shadow
    page: async ({ page, theme }, use, testInfo) => {
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (theme === 'snow') {
            //inject snow theme
            await page.addInitScript({ path: path.join(__dirname, './helper', './useSnowTheme.js') });
        }

        // Attach info about the currently running test and its project.
        // This will be used by appActions to fill in the created
        // domain object's notes.
        page.testNotes = [
            `${testInfo.titlePath.join('\n')}`,
            `${testInfo.project.name}`
        ].join('\n');

        await use(page);
    },
    myItemsFolderName: [myItemsFolderName, { option: true }],
    // eslint-disable-next-line no-shadow
    openmctConfig: async ({ myItemsFolderName }, use) => {
        await use({ myItemsFolderName });
    }
});
exports.expect = expect;
