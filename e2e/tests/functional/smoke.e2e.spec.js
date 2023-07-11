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

/*
This test suite is dedicated to tests which can quickly verify that any openmct installation is
operable and that any type of testing can proceed.

Ideally, smoke tests should make zero assumptions about how and where they are run. This makes them
more resilient to change and therefor a better indicator of failure. Smoke tests will also run quickly
as they cover a very "thin surface" of functionality.

When deciding between authoring new smoke tests or functional tests, ask yourself "would I feel
comfortable running this test during a live mission?" Avoid creating or deleting Domain Objects.
Make no assumptions about the order that elements appear in the DOM.
*/

const { test, expect } = require('../../pluginFixtures');

test('Verify that the create button appears and that the Folder Domain Object is available for selection', async ({
  page
}) => {
  //Go to baseURL
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  //Click the Create button
  await page.click('button:has-text("Create")');

  // Verify that Create Folder appears in the dropdown
  await expect(page.locator(':nth-match(:text("Folder"), 2)')).toBeEnabled();
});

test('Verify that My Items Tree appears @ipad', async ({ page, openmctConfig }) => {
  const { myItemsFolderName } = openmctConfig;
  //Test.slow annotation is currently broken. Needs to be fixed in https://github.com/nasa/openmct/issues/5374
  test.slow();
  //Go to baseURL
  await page.goto('./');

  //My Items to be visible
  await expect(page.locator(`a:has-text("${myItemsFolderName}")`)).toBeEnabled();
});
