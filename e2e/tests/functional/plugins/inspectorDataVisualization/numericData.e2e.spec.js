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
/* global __dirname */

const { test, expect } = require('../../../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../../../appActions');
const path = require('path');

test.describe.only('Testing numeric data with inspector data visualization (i.e., data pivoting)', () => {
  test.beforeEach(async ({ page }) => {
    // eslint-disable-next-line no-undef
    await page.addInitScript({
      path: path.join(__dirname, '../../../../helper/', 'addInitNotebookWithUrls.js')
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });

  test('Creates an example data visualization source and clicks on items', async ({ page }) => {
    const exampleDataVisualizationSource = await createDomainObjectWithDefaults(page, {
      type: 'Example Data Visualization Source'
    });
    const sineWaveObject1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: exampleDataVisualizationSource.uuid
    });
    const sineWaveObject2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      parent: exampleDataVisualizationSource.uuid
    });

    // click on first item in example data visualization source
    await page.pause();
  });
});
