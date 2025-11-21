/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import { expect, test } from '../../pluginFixtures.js';

test.describe('Bootstrapping Open MCT', () => {
  test('Open MCT can be bootstrapped into a specified div container using a selector string', async ({
    page
  }) => {
    const openmctLocation = '/openmct.js';
    await page.goto('./test-data/blank.html');
    await page.setContent(`
      <!doctype html>
      <html>
      <head>
        <script src="${openmctLocation}"></script>
        <script>
          openmct.install(openmct.plugins.LocalStorage());
          openmct.install(openmct.plugins.Espresso());
          openmct.install(openmct.plugins.UTCTimeSystem());
          openmct.install(openmct.plugins.MyItems());
          openmct.start('#test-container');
        </script>
      </head>
      <body>
        <div id="test-container"></div>
      </body>
    </html>`);
    //First, confirm initial test assumptions
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#openmct-app')).toBeVisible();
  });

  test('Open MCT can be bootstrapped into a specified div container using a dom element', async ({
    page
  }) => {
    const openmctLocation = '/openmct.js';
    await page.goto('./test-data/blank.html');
    await page.setContent(`
      <!doctype html>
      <html>
      <head>
        <script src="${openmctLocation}"></script>
        <script>
          openmct.install(openmct.plugins.LocalStorage());
          openmct.install(openmct.plugins.Espresso());
          openmct.install(openmct.plugins.UTCTimeSystem());
          openmct.install(openmct.plugins.MyItems());
          document.addEventListener('DOMContentLoaded', () => {
            const testContainer = document.getElementById('test-container');
            openmct.start(testContainer);
          });
        </script>
      </head>
      <body>
        <div id="test-container"></div>
      </body>
    </html>`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#openmct-app')).toBeVisible();
  });

  test('If no container is specified, Open MCT will bootstrap into the first child of the body element', async ({
    page
  }) => {
    const openmctLocation = '/openmct.js';
    await page.goto('./test-data/blank.html');
    await page.setContent(`
      <!doctype html>
      <html>
      <head>
        <script src="${openmctLocation}"></script>
        <script>
          openmct.install(openmct.plugins.LocalStorage());
          openmct.install(openmct.plugins.Espresso());
          openmct.install(openmct.plugins.UTCTimeSystem());
          openmct.install(openmct.plugins.MyItems());
          document.addEventListener('DOMContentLoaded', () => {
            const testContainer = document.getElementById('test-container');
            openmct.start(testContainer);
          });
        </script>
      </head>
      <body>
        <div id="test-container"></div>
      </body>
    </html>`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#openmct-app')).toBeVisible();
  });

  test('If no container is specified and the body has no child element, Open MCT will create a div and bootstrap into it', async ({
    page
  }) => {
    const openmctLocation = '/openmct.js';
    await page.goto('./test-data/blank.html');
    await page.setContent(`
      <!doctype html>
      <html>
      <head>
        <script src="${openmctLocation}"></script>
        <script>
          openmct.install(openmct.plugins.LocalStorage());
          openmct.install(openmct.plugins.Espresso());
          openmct.install(openmct.plugins.UTCTimeSystem());
          openmct.install(openmct.plugins.MyItems());
          openmct.start();
        </script>
      </head>
      <body>
      </body>
    </html>`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#openmct-app')).toBeVisible();
  });
});
