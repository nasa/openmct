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
This test suite is dedicated to tests which verify notebook tag functionality.
*/

import { createDomainObjectWithDefaults } from '../../../../appActions.js';
import {
  createNotebookAndEntry,
  createNotebookEntryAndTags,
  enterTextEntry
} from '../../../../helper/notebookUtils.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('Tagging in Notebooks @addInit', () => {
  test.beforeEach(async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });
  });
  test('Can load tags', async ({ page }) => {
    await createNotebookAndEntry(page);

    await page.getByRole('tab', { name: 'Annotations' }).click();

    await page.locator('button:has-text("Add Tag")').click();

    await page.locator('[placeholder="Type to select tag"]').click();

    await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText('Science');
    await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText('Drilling');
    await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText('Driving');
  });
  test('Can add tags', async ({ page }) => {
    await createNotebookEntryAndTags(page);

    await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText('Science');
    await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText('Driving');

    await page.locator('button:has-text("Add Tag")').click();
    await page.locator('[placeholder="Type to select tag"]').click();

    await expect(page.locator('[aria-label="Autocomplete Options"]')).not.toContainText('Science');
    await expect(page.locator('[aria-label="Autocomplete Options"]')).not.toContainText('Driving');
    await expect(page.locator('[aria-label="Autocomplete Options"]')).toContainText('Drilling');
  });
  test('Can add tags with blank entry', async ({ page }) => {
    await createDomainObjectWithDefaults(page, { type: 'Notebook' });
    await page.getByRole('tab', { name: 'Annotations' }).click();

    await enterTextEntry(page, '');
    await page.hover(`button:has-text("Add Tag")`);
    await page.locator(`button:has-text("Add Tag")`).click();

    // Click inside the tag search input
    await page.locator('[placeholder="Type to select tag"]').click();
    // Select the "Driving" tag
    await page.locator('[aria-label="Autocomplete Options"] >> text=Driving').click();

    await expect(page.locator('[aria-label="Notebook Entry"]')).toContainText('Driving');
  });
  test('Can cancel adding tags', async ({ page }) => {
    await createNotebookAndEntry(page);

    await page.getByRole('tab', { name: 'Annotations' }).click();

    // Test canceling adding a tag after we click "Type to select tag"
    await page.locator('button:has-text("Add Tag")').click();

    await page.locator('[placeholder="Type to select tag"]').click();

    await page.getByRole('search').getByLabel('Search Input').click();

    await expect(page.locator('button:has-text("Add Tag")')).toBeVisible();

    // Test canceling adding a tag after we just click "Add Tag"
    await page.locator('button:has-text("Add Tag")').click();

    await page.getByRole('search').getByLabel('Search Input').click();

    await expect(page.locator('button:has-text("Add Tag")')).toBeVisible();
  });
  test('Can search for tags and preview works properly', async ({ page }) => {
    await createNotebookEntryAndTags(page);
    await page.getByRole('search').getByLabel('Search Input').click();
    await page.getByRole('search').getByLabel('Search Input').fill('sc');
    await expect(page.getByRole('listitem', { name: 'Annotation Search Result' })).toContainText(
      'Science'
    );
    await expect(
      page.getByRole('listitem', { name: 'Annotation Search Result' })
    ).not.toContainText('Driving');

    await page.getByRole('search').getByLabel('Search Input').click();
    await page.getByRole('search').getByLabel('Search Input').fill('Sc');
    await expect(page.getByRole('listitem', { name: 'Annotation Search Result' })).toContainText(
      'Science'
    );
    await expect(
      page.getByRole('listitem', { name: 'Annotation Search Result' })
    ).not.toContainText('Driving');

    await page.getByRole('search').getByLabel('Search Input').click();
    await page.getByRole('search').getByLabel('Search Input').fill('Xq');
    await expect(page.getByText('No results found')).toBeVisible();

    await createDomainObjectWithDefaults(page, {
      type: 'Display Layout'
    });

    // Go back into edit mode for the display layout
    await page.getByRole('button', { name: 'Edit Object' }).click();

    await page.getByRole('search').getByLabel('Search Input').click();
    await page.getByRole('search').getByLabel('Search Input').fill('Sc');
    await expect(page.getByRole('listitem', { name: 'Annotation Search Result' })).toContainText(
      'Science'
    );
    await page.getByText('Entry 0').click();
    await expect(page.locator('.js-preview-window')).toBeVisible();
  });

  test('Can delete tags', async ({ page }) => {
    await createNotebookEntryAndTags(page);
    // Delete Driving
    await page.hover('[aria-label="Tag"]:has-text("Driving")');
    await page.locator('[aria-label="Remove tag Driving"]').click();

    await expect(page.locator('[aria-label="Tags Inspector"]')).toContainText('Science');
    await expect(page.locator('[aria-label="Tags Inspector"]')).not.toContainText('Driving');

    await page.getByRole('search').getByLabel('Search Input').fill('sc');
    await expect(
      page.getByRole('listitem', { name: 'Annotation Search Result' })
    ).not.toContainText('Driving');
  });

  test('Can delete entries without tags', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5823'
    });
    await createNotebookEntryAndTags(page);

    await page.locator('text=To start a new entry, click here or drag and drop any object').click();
    await page.getByLabel('Notebook Entry Input').fill(`An entry without tags`);
    await page.locator('.c-ne__save-button > button').click();

    await page.hover('[aria-label="Notebook Entry Display"] >> nth=1');
    await page.locator('button[title="Delete this entry"]').last().click();
    await expect(
      page.locator('text=This action will permanently delete this entry. Do you wish to continue?')
    ).toBeVisible();
    await page.locator('button:has-text("Ok")').click();
    await expect(
      page.locator('text=This action will permanently delete this entry. Do you wish to continue?')
    ).toBeHidden();
  });

  test('Can delete objects with tags and neither return in search', async ({ page }) => {
    await createNotebookEntryAndTags(page);
    // Delete Notebook
    await page.locator('button[title="More actions"]').click();
    await page.locator('li[title="Remove this object from its containing object."]').click();
    await page.locator('button:has-text("OK")').click();
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.getByRole('search').getByLabel('Search Input').fill('Unnamed');
    await expect(page.getByText('No results found')).toBeVisible();
    await page.getByRole('search').getByLabel('Search Input').fill('sci');
    await expect(page.getByText('No results found')).toBeVisible();
    await page.getByRole('search').getByLabel('Search Input').fill('dri');
    await expect(page.getByText('No results found')).toBeVisible();
  });
  test('Tags persist across reload', async ({ page }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const ITERATIONS = 4;
    const notebook = await createNotebookEntryAndTags(page, ITERATIONS);
    await page.goto(notebook.url);

    // Verify tags are present
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const entryLocator = `[aria-label="Notebook Entry"] >> nth = ${iteration}`;
      await expect(page.locator(entryLocator)).toContainText('Science');
      await expect(page.locator(entryLocator)).toContainText('Driving');
    }

    //Reload Page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify tags persist across reload
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const entryLocator = `[aria-label="Notebook Entry"] >> nth = ${iteration}`;
      await expect(page.locator(entryLocator)).toContainText('Science');
      await expect(page.locator(entryLocator)).toContainText('Driving');
    }
  });
  test('Can cancel adding a tag', async ({ page }) => {
    await createNotebookAndEntry(page);

    await page.getByRole('tab', { name: 'Annotations' }).click();

    // Click on the "Add Tag" button
    await page.locator('button:has-text("Add Tag")').click();

    // Click inside the AutoComplete field
    await page.locator('[placeholder="Type to select tag"]').click();

    // Click on the "Tags" header (simulating a click outside the autocomplete)
    await page.locator('div.c-inspect-properties__header:has-text("Tags")').click();

    // Verify there is a button with text "Add Tag"
    await expect(page.locator('button:has-text("Add Tag")')).toBeVisible();

    // Verify the AutoComplete field is hidden
    await expect(page.locator('[placeholder="Type to select tag"]')).toBeHidden();
  });
  test('Can start to add a tag, click away, and add a tag', async ({ page }) => {
    await createNotebookEntryAndTags(page);

    await page.getByRole('tab', { name: 'Annotations' }).click();

    // Click on the body simulating a click outside the autocomplete)
    await page.locator('body').click();
    await page.locator(`[aria-label="Notebook Entry"]`).click();

    await page.hover(`button:has-text("Add Tag")`);
    await page.locator(`button:has-text("Add Tag")`).click();

    // Click inside the tag search input
    await page.locator('[placeholder="Type to select tag"]').click();
    // Select the "Driving" tag
    await page.locator('[aria-label="Autocomplete Options"] >> text=Drilling').click();
    await expect(page.getByLabel('Notebook Entries').getByText('Drilling')).toBeVisible();
  });
});
