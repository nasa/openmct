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

/*
This suite is dedicated to tests which verify that tooltips are displayed correctly.
*/

import { createDomainObjectWithDefaults, expandEntireTree } from '../../appActions.js';
import { MISSION_TIME } from '../../constants.js';
import { expect, test } from '../../pluginFixtures.js';

test.describe('Verify tooltips', () => {
  let folder1;
  let folder2;
  let folder3;
  let sineWaveObject1;
  let sineWaveObject2;
  let sineWaveObject3;

  const swg1Path = 'My Items / Folder Foo / SWG 1';
  const swg2Path = 'My Items / Folder Foo / Folder Bar / SWG 2';
  const swg3Path = 'My Items / Folder Foo / Folder Bar / Folder Baz / SWG 3';

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    folder1 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Folder Foo'
    });
    folder2 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Folder Bar',
      parent: folder1.uuid
    });
    folder3 = await createDomainObjectWithDefaults(page, {
      type: 'Folder',
      name: 'Folder Baz',
      parent: folder2.uuid
    });
    // Create Sine Wave Generator
    sineWaveObject1 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG 1',
      parent: folder1.uuid
    });
    sineWaveObject1.path = swg1Path;
    sineWaveObject2 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG 2',
      parent: folder2.uuid
    });
    sineWaveObject2.path = swg2Path;
    sineWaveObject3 = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'SWG 3',
      parent: folder3.uuid
    });
    sineWaveObject3.path = swg3Path;

    // Expand all folders
    await expandEntireTree(page);
  });

  test('display correct paths for LAD tables', async ({ page }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.getByLabel('Edit Object').click();

    // Add the Sine Wave Generator to the LAD table and save changes.
    //TODO Follow up with https://github.com/nasa/openmct/issues/7773
    await page.getByLabel(`Preview ${sineWaveObject1.name}`).dragTo(page.getByLabel('Object View'));
    await page.getByLabel(`Preview ${sineWaveObject2.name}`).dragTo(page.getByLabel('Object View'));
    await page.getByLabel(`Preview ${sineWaveObject3.name}`).dragTo(page.getByLabel('Object View'));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    //Hover on something else
    await page.getByRole('button', { name: 'Create' }).hover();
    //Hover over the first
    await page.getByLabel('lad name').getByText(sineWaveObject1.name).hover();
    await expect(page.getByRole('tooltip', { name: sineWaveObject1.path })).toBeVisible();

    //Hover on something else
    await page.getByRole('button', { name: 'Create' }).hover();
    //Hover over second object
    await page.getByLabel('lad name').getByText(sineWaveObject2.name).hover();
    await expect(page.getByRole('tooltip', { name: sineWaveObject2.path })).toBeVisible();

    //Hover on something else
    await page.getByRole('button', { name: 'Create' }).hover();
    //Hover over third object
    await page.getByLabel('lad name').getByText(sineWaveObject3.name).hover();
    await expect(page.getByRole('tooltip', { name: sineWaveObject3.path })).toBeVisible();
  });

  test('display correct paths for expanded and collapsed plot legend items', async ({ page }) => {
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Test Overlay Plots'
    });
    // Edit Overlay Plot
    await page.getByLabel('Edit Object').click();

    // Add the Sine Wave Generators to the  and save changes
    await page
      .getByLabel('Preview SWG 1 generator Object')
      .dragTo(page.getByLabel('Plot Container Style Target'));
    await page
      .getByLabel('Preview SWG 2 generator Object')
      .dragTo(page.getByLabel('Plot Container Style Target'));
    await page
      .getByLabel('Preview SWG 3 generator Object')
      .dragTo(page.getByLabel('Plot Container Style Target'));

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Hover over Collapsed Plot Legend Components with the Control Key pressed
    await page.keyboard.down('Control');
    //Hover over first object
    await page.getByText('SWG 1 Hz').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);
    //Hover over another object to clear
    await page.getByRole('button', { name: 'create' }).hover();
    //Hover over second object
    await page.getByText('SWG 2 Hz').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject2.path);
    //Hover over another object to clear
    await page.getByRole('button', { name: 'create' }).hover();
    //Hover over third object
    await page.getByText('SWG 3 Hz').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
    //Release the Control Key
    await page.keyboard.up('Control');

    //Expand the legend
    await page.locator('.gl-plot-legend__view-control.c-disclosure-triangle').click();

    //Hover over Expanded Plot Legend Components with the Control Key pressed
    await page.keyboard.down('Control');

    await page.getByLabel('Plot Legend Expanded').getByText('SWG 1').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);
    //Hover over another object to clear
    await page.getByRole('button', { name: 'create' }).hover();
    //Hover over second object
    await page.getByLabel('Plot Legend Expanded').getByText('SWG 2').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject2.path);
    //Hover over another object to clear
    await page.getByRole('button', { name: 'create' }).hover();
    //Hover over third object
    await page.getByLabel('Plot Legend Expanded').getByText('SWG 3').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering over object labels', async ({ page }) => {
    //Navigate to SWG 1 in Tree
    await page.getByLabel('Navigate to SWG 1 generator').click();

    //Expect tooltip to be the path of SWG 1
    await page.keyboard.down('Control');
    await page.getByRole('main').getByText('SWG 1', { exact: true }).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);
    await page.keyboard.up('Control');

    //Navigate to SWG 3 in Tree
    await page.getByLabel('Navigate to SWG 3 generator').click();
    //Expect tooltip to be the path of SWG 3
    await page.keyboard.down('Control');
    await page.getByRole('main').getByText('SWG 3', { exact: true }).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering over display layout pane headers', async ({ page }) => {
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Test Overlay Plot'
    });
    // Edit Overlay Plot
    await page.getByLabel('Edit Object').click();

    await page
      .getByLabel('Preview SWG 1 generator Object')
      .dragTo(page.getByLabel('Plot Container Style Target'));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create Stacked Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'Test Stacked Plot'
    });
    // Edit Stacked Plot
    await page.getByLabel('Edit Object').click();

    await page.getByLabel(`Preview ${sineWaveObject2.name}`).dragTo(page.getByLabel('Object View'));
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.getByLabel('Edit Object').click();

    await page
      .getByLabel('Preview Test Overlay Plot')
      .dragTo(page.locator('#display-layout-drop-area'), {
        targetPosition: { x: 0, y: 0 }
      });

    //Add Display Layout below Overlay Plot
    await page
      .getByLabel('Preview Test Stacked Plot')
      .dragTo(page.locator('#display-layout-drop-area'), {
        targetPosition: { x: 0, y: 250 }
      });

    //Drag the SWG3 Object to the Display off to the right
    await page
      .getByLabel('Preview SWG 3 generator Object')
      .dragTo(page.locator('#display-layout-drop-area'), {
        targetPosition: { x: 500, y: 200 }
      });

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Hover over Overlay Plot with the Control Key pressed
    await page.keyboard.down('Control');

    //Hover Overlay Plot
    await page.getByTitle('Test Overlay Plot').hover();
    await expect(page.getByRole('tooltip')).toHaveText('My Items / Test Overlay Plot');
    await page.keyboard.up('Control');

    //Expand the Overlay Plot Legend and hover over the first legend item
    await page.getByLabel('Expand Test Overlay Plot Legend').click();

    await page.keyboard.down('Control');
    await page.getByLabel('Plot Legend Item for Test').getByText('SWG').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);

    //Hover over Stacked Plot Title
    await page.getByTitle('Test Stacked Plot').hover();
    await expect(page.getByRole('tooltip')).toHaveText('My Items / Test Stacked Plot');

    //Hover over SWG3 Object
    await page.getByLabel('Alpha-numeric telemetry name for SWG').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering over flexible object labels', async ({ page }) => {
    //Create Flexible Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Test Flexible Layout'
    });

    //Add SWG1 and SWG3 to Flexible Layout
    await page.getByLabel('Navigate to SWG 1 generator').dragTo(page.getByRole('row').nth(0));
    await page
      .getByLabel('Preview SWG 3 generator Object')
      .dragTo(page.getByLabel('Container Handle 2'));

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Hover over SWG1 Object
    await page.keyboard.down('Control');
    await page.getByTitle('SWG 1').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);

    //Hover over SWG3 Object
    await page.getByTitle('SWG 3').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering over tab view labels', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Tabs View',
      name: 'Test Tabs View'
    });

    //Add SWG1 and SWG3 to Flexible Layout
    await page
      .getByLabel('Navigate to SWG 1 generator')
      .dragTo(page.getByText('Drag objects here to add them'));
    await page.getByLabel('Preview SWG 3 generator Object').dragTo(page.getByLabel('SWG 1 tab'));

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    await page.getByLabel('SWG 1 tab').getByText('SWG').hover();

    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);

    await page.getByLabel('SWG 3 tab').getByText('SWG').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering tree items', async ({ page }) => {
    await page.keyboard.down('Control');
    await page.getByText('SWG 1').first().hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);

    await page.getByText('SWG 3').first().hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display correct paths when hovering search items', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.getByRole('searchbox', { name: 'Search Input' }).fill('SWG 3');

    await page.keyboard.down('Control');
    await page.getByLabel('Object Results').getByText('SWG').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display path for source telemetry when hovering over gauge', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Test Gauge'
    });

    await page.getByLabel('Navigate to SWG 3 generator').dragTo(page.getByRole('meter'));
    await page.keyboard.down('Control');
    // FIXME: We shouldn't need a `force: true` here, but the parent
    // element blocks
    // eslint-disable-next-line playwright/no-force-option
    await page.getByRole('meter').hover({ position: { x: 0, y: 0 }, force: true });
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display tooltip path for notebook embeds', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Test Notebook'
    });

    await page
      .getByLabel('Navigate to SWG 3 generator')
      .dragTo(page.getByLabel('To start a new entry, click'));
    await page.keyboard.down('Control');
    await page.getByLabel('SWG 3 Notebook Embed').hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });

  test('display tooltip path for telemetry table names @clock', async ({ page }) => {
    await page.clock.install({ time: MISSION_TIME });
    await page.clock.resume();
    await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      name: 'Test Telemetry Table'
    });

    await page
      .getByLabel(`Navigate to ${sineWaveObject1.name}`)
      .dragTo(page.getByLabel('Object View'));
    await page.getByLabel(`Preview ${sineWaveObject3.name}`).dragTo(page.getByLabel('Object View'));

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Confirm that telemetry rows exist for SWG 1 and 3 and are in view
    await expect(page.getByLabel('name table cell SWG 1').first()).toBeInViewport();
    await expect(page.getByLabel('name table cell SWG 3').first()).toBeInViewport();

    // Pause to prevent more telemetry from streaming in
    await page.clock.pauseAt(MISSION_TIME + 30 * 1000);
    // Run for 30 seconds to allow SOME telemetry to stream in
    await page.clock.runFor(30 * 1000);

    await page.keyboard.down('Control');
    // Hover over SWG3 in Telemetry Table
    await page.getByLabel('name table cell SWG 3').first().hover();
    await expect(page.getByRole('tooltip', { name: sineWaveObject3.path })).toBeVisible();

    // Release Control Key
    await page.keyboard.up('Control');
    // Hover somewhere else so the tooltip goes away
    await page.getByLabel('Navigate to Test Telemetry Table').hover();
    await expect(page.getByRole('tooltip')).toBeHidden();

    await page.keyboard.down('Control');
    // Hover over SWG1 in Telemetry Table
    await page.getByLabel('name table cell SWG 1').first().hover();
    await expect(page.getByRole('tooltip', { name: sineWaveObject1.path })).toBeVisible();
  });

  test('display tooltip path for recently viewed items', async ({ page }) => {
    // drag up Recently Viewed pane
    await page.getByLabel('Resize Recently Viewed Pane').hover();
    await page.mouse.down();
    await page.mouse.move(0, 300);
    await page.mouse.up();

    await page.keyboard.down('Control');
    await page.getByLabel('Recent Objects').getByText(sineWaveObject3.name).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);

    await page.getByLabel('Recent Objects').getByText(sineWaveObject2.name).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject2.path);

    await page.getByLabel('Recent Objects').getByText(sineWaveObject1.name).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);
  });

  test('display tooltip path for time strips', async ({ page }) => {
    // Create Time Strip
    await createDomainObjectWithDefaults(page, {
      type: 'Time Strip',
      name: 'Test Time Strip'
    });
    // Edit Overlay Plot
    await page.getByLabel('Edit Object').click();
    await page
      .getByLabel(`Preview ${sineWaveObject1.name}`)
      .dragTo(page.getByLabel('Test Time Strip Object View'));
    await page
      .getByLabel(`Preview ${sineWaveObject2.name}`)
      .dragTo(page.getByLabel('Test Time Strip Object View'));
    await page
      .getByLabel(`Preview ${sineWaveObject3.name}`)
      .dragTo(page.getByLabel('Test Time Strip Object View'));

    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    await page.getByText(sineWaveObject1.name).nth(2).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject1.path);

    await page.getByText(sineWaveObject2.name).nth(2).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject2.path);

    await page.getByText(sineWaveObject3.name).nth(2).hover();
    await expect(page.getByRole('tooltip')).toHaveText(sineWaveObject3.path);
  });
});
