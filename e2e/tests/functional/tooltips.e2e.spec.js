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
const { createDomainObjectWithDefaults, expandEntireTree } = require('../../appActions');

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

  test.beforeEach(async ({ page, openmctConfig }) => {
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

  test('display correct paths for LAD tables', async ({ page, openmctConfig }) => {
    // Create LAD table
    await createDomainObjectWithDefaults(page, {
      type: 'LAD Table',
      name: 'Test LAD Table'
    });
    // Edit LAD table
    await page.locator('[title="Edit"]').click();

    // Add the Sine Wave Generator to the LAD table and save changes
    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.c-lad-table-wrapper');
    await page.dragAndDrop(`text=${sineWaveObject2.name}`, '.c-lad-table-wrapper');
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-lad-table-wrapper');
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');

    async function getToolTip(object) {
      await page.locator('.c-create-button').hover();
      await page.getByRole('cell', { name: object.name }).hover();
      let tooltipText = await page.locator('.c-tooltip').textContent();
      return tooltipText.replace('\n', '').trim();
    }

    expect(await getToolTip(sineWaveObject1)).toBe(sineWaveObject1.path);
    expect(await getToolTip(sineWaveObject2)).toBe(sineWaveObject2.path);
    expect(await getToolTip(sineWaveObject3)).toBe(sineWaveObject3.path);
  });

  test('display correct paths for expanded and collapsed plot legend items', async ({ page }) => {
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Test Overlay Plots'
    });
    // Edit Overlay Plot
    await page.locator('[title="Edit"]').click();

    // Add the Sine Wave Generator to the LAD table and save changes
    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.gl-plot');
    await page.dragAndDrop(`text=${sineWaveObject2.name}`, '.gl-plot');
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.gl-plot');
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');

    async function getCollapsedLegendToolTip(object) {
      await page.locator('.c-create-button').hover();
      await page
        .locator('.plot-series-name', { has: page.locator(`text="${object.name} Hz"`) })
        .hover();
      let tooltipText = await page.locator('.c-tooltip').textContent();
      return tooltipText.replace('\n', '').trim();
    }

    async function getExpandedLegendToolTip(object) {
      await page.locator('.c-create-button').hover();
      await page
        .locator('.plot-series-name', { has: page.locator(`text="${object.name}"`) })
        .hover();
      let tooltipText = await page.locator('.c-tooltip').textContent();
      return tooltipText.replace('\n', '').trim();
    }

    expect(await getCollapsedLegendToolTip(sineWaveObject1)).toBe(sineWaveObject1.path);
    expect(await getCollapsedLegendToolTip(sineWaveObject2)).toBe(sineWaveObject2.path);
    expect(await getCollapsedLegendToolTip(sineWaveObject3)).toBe(sineWaveObject3.path);

    await page.keyboard.up('Control');
    await page.locator('.gl-plot-legend__view-control.c-disclosure-triangle').click();
    await page.keyboard.down('Control');

    expect(await getExpandedLegendToolTip(sineWaveObject1)).toBe(sineWaveObject1.path);
    expect(await getExpandedLegendToolTip(sineWaveObject2)).toBe(sineWaveObject2.path);
    expect(await getExpandedLegendToolTip(sineWaveObject3)).toBe(sineWaveObject3.path);
  });

  test('display correct paths when hovering over object labels', async ({ page }) => {
    async function getObjectLabelTooltip(object) {
      await page
        .locator('.c-tree__item__name.c-object-label__name', {
          has: page.locator(`text="${object.name}"`)
        })
        .click();
      await page.keyboard.down('Control');
      await page
        .locator('.l-browse-bar__object-name.c-object-label__name', {
          has: page.locator(`text="${object.name}"`)
        })
        .hover();
      const tooltipText = await page.locator('.c-tooltip').textContent();
      await page.keyboard.up('Control');
      return tooltipText.replace('\n', '').trim();
    }

    expect(await getObjectLabelTooltip(sineWaveObject1)).toBe(sineWaveObject1.path);
    expect(await getObjectLabelTooltip(sineWaveObject3)).toBe(sineWaveObject3.path);
  });

  test('display correct paths when hovering over display layout pane headers', async ({ page }) => {
    // Create Overlay Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot',
      name: 'Test Overlay Plot'
    });
    // Edit Overlay Plot
    await page.locator('[title="Edit"]').click();
    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.gl-plot');
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create Stacked Plot
    await createDomainObjectWithDefaults(page, {
      type: 'Stacked Plot',
      name: 'Test Stacked Plot'
    });
    // Edit Stacked Plot
    await page.locator('[title="Edit"]').click();
    await page.dragAndDrop(`text=${sineWaveObject2.name}`, '.c-plot--stacked.holder');
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Create Display Layout
    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout',
      name: 'Test Display Layout'
    });
    // Edit Display Layout
    await page.locator('[title="Edit"]').click();

    await page.dragAndDrop("text='Test Overlay Plot'", '.l-layout__grid-holder', {
      targetPosition: { x: 0, y: 0 }
    });
    await page.dragAndDrop("text='Test Stacked Plot'", '.l-layout__grid-holder', {
      targetPosition: { x: 0, y: 250 }
    });
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.l-layout__grid-holder', {
      targetPosition: { x: 500, y: 200 }
    });
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');

    await page.getByText('Test Overlay Plot').nth(2).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe('My Items / Test Overlay Plot');

    await page.keyboard.up('Control');
    await page.locator('.c-plot-legend__view-control >> nth=0').click();
    await page.keyboard.down('Control');
    await page.locator('.plot-wrapper-expanded-legend .plot-series-name').first().hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);

    await page.getByText('Test Stacked Plot').nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe('My Items / Test Stacked Plot');

    await page.getByText('SWG 3').nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(sineWaveObject3.path).toBe(tooltipText);
  });

  test('display correct paths when hovering over flexible object labels', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Flexible Layout',
      name: 'Test Flexible Layout'
    });

    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.c-fl__container >> nth=0');
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-fl__container >> nth=1');

    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    await page.getByText('SWG 1').nth(2).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);

    await page.getByText('SWG 3').nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display correct paths when hovering over tab view labels', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Tabs View',
      name: 'Test Tabs View'
    });

    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.c-tabs-view__tabs-holder');
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-tabs-view__tabs-holder');

    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    await page.getByText('SWG 1').nth(2).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);

    await page.getByText('SWG 3').nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display correct paths when hovering tree items', async ({ page }) => {
    await page.keyboard.down('Control');
    await page.getByText('SWG 1').nth(0).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);

    await page.getByText('SWG 3').nth(0).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display correct paths when hovering search items', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search Input' }).click();
    await page.fill('.c-search__input', 'SWG 3');

    await page.keyboard.down('Control');
    await page.locator('.c-gsearch-result__title').hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display path for source telemetry when hovering over gauge', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Gauge',
      name: 'Test Gauge'
    });
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-gauge__wrapper');
    await page.keyboard.down('Control');
    // eslint-disable-next-line playwright/no-force-option
    await page.locator('.c-gauge.c-dial').hover({ position: { x: 0, y: 0 }, force: true });
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display tooltip path for notebook embeds', async ({ page }) => {
    await createDomainObjectWithDefaults(page, {
      type: 'Notebook',
      name: 'Test Notebook'
    });

    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-notebook__drag-area');
    await page.keyboard.down('Control');
    await page.locator('.c-ne__embed').hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });

  test('display tooltip path for telemetry table names', async ({ page }) => {
    // set endBound to 10 seconds after start bound
    const url = await page.url();
    const parsedUrl = new URL(url.replace('#', '!'));
    const startBound = Number(parsedUrl.searchParams.get('tc.startBound'));
    const tenSecondsInMilliseconds = 10 * 1000;
    const endBound = startBound + tenSecondsInMilliseconds;
    parsedUrl.searchParams.set('tc.endBound', endBound);
    await page.goto(parsedUrl.href.replace('!', '#'));

    await createDomainObjectWithDefaults(page, {
      type: 'Telemetry Table',
      name: 'Test Telemetry Table'
    });

    await page.dragAndDrop(`text=${sineWaveObject1.name}`, '.c-telemetry-table');
    await page.dragAndDrop(`text=${sineWaveObject3.name}`, '.c-telemetry-table');

    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.keyboard.down('Control');

    await page.locator('.noselect > [title="SWG 3"]').first().hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);

    await page.locator('.noselect > [title="SWG 1"]').first().hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);
  });

  test('display tooltip path for recently viewed items', async ({ page }) => {
    // drag up Recently Viewed pane
    await page
      .locator('.l-pane.l-pane--vertical-handle-before', {
        hasText: 'Recently Viewed'
      })
      .locator('.l-pane__handle')
      .hover();
    await page.mouse.down();
    await page.mouse.move(0, 300);
    await page.mouse.up();

    await page.keyboard.down('Control');
    await page.getByLabel('Recent Objects').getByText(sineWaveObject3.name).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);

    await page.getByLabel('Recent Objects').getByText(sineWaveObject2.name).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject2.path);

    await page.getByLabel('Recent Objects').getByText(sineWaveObject1.name).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);
  });

  test('display tooltip path for time strips', async ({ page }) => {
    // Create Time Strip
    await createDomainObjectWithDefaults(page, {
      type: 'Time Strip',
      name: 'Test Time Strip'
    });
    // Edit Overlay Plot
    await page.locator('[title="Edit"]').click();
    await page.dragAndDrop(
      `text=${sineWaveObject1.name}`,
      '.c-object-view.is-object-type-time-strip'
    );
    await page.dragAndDrop(
      `text=${sineWaveObject2.name}`,
      '.c-object-view.is-object-type-time-strip'
    );
    await page.dragAndDrop(
      `text=${sineWaveObject3.name}`,
      '.c-object-view.is-object-type-time-strip'
    );
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.keyboard.down('Control');
    await page.getByText(sineWaveObject1.name).nth(2).hover();
    let tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject1.path);

    await page.getByText(sineWaveObject2.name).nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject2.path);

    await page.getByText(sineWaveObject3.name).nth(2).hover();
    tooltipText = await page.locator('.c-tooltip').textContent();
    tooltipText = tooltipText.replace('\n', '').trim();
    expect(tooltipText).toBe(sineWaveObject3.path);
  });
});
