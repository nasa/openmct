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
/*
This test suite is dedicated to tests which verify form functionality in isolation
*/

const { test, expect } = require('../../pluginFixtures');
const { createDomainObjectWithDefaults } = require('../../appActions');
const genUuid = require('uuid').v4;
const path = require('path');

const TEST_FOLDER = 'test folder';
const jsonFilePath = 'e2e/test-data/ExampleLayouts.json';
const imageFilePath = 'e2e/test-data/rick.jpg';

test.describe('Form Validation Behavior', () => {
  test('Required Field indicators appear if title is empty and can be corrected', async ({
    page
  }) => {
    //Go to baseURL
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("Create")');
    await page.getByRole('menuitem', { name: ' Folder' }).click();

    // Fill in empty string into title and trigger validation with 'Tab'
    await page.click('text=Properties Title Notes >> input[type="text"]');
    await page.fill('text=Properties Title Notes >> input[type="text"]', '');
    await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

    //Required Field Form Validation
    await expect(page.locator('button:has-text("OK")')).toBeDisabled();
    await expect(page.locator('.c-form-row__state-indicator').first()).toHaveClass(/invalid/);

    //Correct Form Validation for missing title and trigger validation with 'Tab'
    await page.click('text=Properties Title Notes >> input[type="text"]');
    await page.fill('text=Properties Title Notes >> input[type="text"]', TEST_FOLDER);
    await page.press('text=Properties Title Notes >> input[type="text"]', 'Tab');

    //Required Field Form Validation is corrected
    await expect(page.locator('button:has-text("OK")')).toBeEnabled();
    await expect(page.locator('.c-form-row__state-indicator').first()).not.toHaveClass(/invalid/);

    //Finish Creating Domain Object
    await Promise.all([page.waitForNavigation(), page.click('button:has-text("OK")')]);

    //Verify that the Domain Object has been created with the corrected title property
    await expect(page.locator('.l-browse-bar__object-name')).toContainText(TEST_FOLDER);
  });
});

test.describe('Form File Input Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: path.join(__dirname, '../../helper', 'addInitFileInputObject.js')
    });
  });

  test('Can select a JSON file type', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: ' Create ' }).click();
    await page.getByRole('menuitem', { name: 'JSON File Input Object' }).click();

    await page.setInputFiles('#fileElem', jsonFilePath);

    await page.getByRole('button', { name: 'Save' }).click();

    const type = await page.locator('#file-input-type').textContent();
    await expect(type).toBe(`"string"`);
  });

  test('Can select an image file type', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: ' Create ' }).click();
    await page.getByRole('menuitem', { name: 'Image File Input Object' }).click();

    await page.setInputFiles('#fileElem', imageFilePath);

    await page.getByRole('button', { name: 'Save' }).click();

    const type = await page.locator('#file-input-type').textContent();
    await expect(type).toBe(`"object"`);
  });
});

test.describe('Persistence operations @addInit', () => {
  // add non persistable root item
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      path: path.join(__dirname, '../../helper', 'addNoneditableObject.js')
    });
  });

  test('Persistability should be respected in the create form location field', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/4323'
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    await page.click('button:has-text("Create")');

    await page.click('text=Condition Set');

    await page.locator('form[name="mctForm"] >> text=Persistence Testing').click();

    const okButton = page.locator('button:has-text("OK")');
    await expect(okButton).toBeDisabled();
  });
});

test.describe('Persistence operations @couchdb', () => {
  test.use({ failOnConsoleError: false });
  test('Editing object properties should generate a single persistence operation', async ({
    page
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5616'
    });

    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // Create a new 'Clock' object with default settings
    const clock = await createDomainObjectWithDefaults(page, {
      type: 'Clock'
    });

    // Count all persistence operations (PUT requests) for this specific object
    let putRequestCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().endsWith(clock.uuid)) {
        putRequestCount += 1;
      }
    });

    // Open the edit form for the clock object
    await page.click('button[title="More options"]');
    await page.click('li[title="Edit properties of this object."]');

    // Modify the display format from default 12hr -> 24hr and click 'Save'
    await page
      .locator('select[aria-label="12 or 24 hour clock"]')
      .selectOption({ value: 'clock24' });
    await page.click('button[aria-label="Save"]');

    await expect
      .poll(() => putRequestCount, {
        message: 'Verify a single PUT request was made to persist the object',
        timeout: 1000
      })
      .toEqual(1);
  });
  test('Can create an object after a conflict error @couchdb @2p', async ({
    page,
    openmctConfig
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/5982'
    });
    const { myItemsFolderName } = openmctConfig;
    // Instantiate a second page/tab
    const page2 = await page.context().newPage();

    // Both pages: Go to baseURL
    await Promise.all([
      page.goto('./', { waitUntil: 'networkidle' }),
      page2.goto('./', { waitUntil: 'networkidle' })
    ]);

    //Slow down the test a bit
    await expect(
      page.getByRole('button', { name: `Expand ${myItemsFolderName} folder` })
    ).toBeVisible();
    await expect(
      page2.getByRole('button', { name: `Expand ${myItemsFolderName} folder` })
    ).toBeVisible();

    // Both pages: Click the Create button
    await Promise.all([
      page.click('button:has-text("Create")'),
      page2.click('button:has-text("Create")')
    ]);

    // Both pages: Click "Clock" in the Create menu
    await Promise.all([
      page.click(`li[role='menuitem']:text("Clock")`),
      page2.click(`li[role='menuitem']:text("Clock")`)
    ]);

    // Generate unique names for both objects
    const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
    const nameInput2 = page2.locator('form[name="mctForm"] .first input[type="text"]');

    // Both pages: Fill in the 'Name' form field.
    await Promise.all([
      nameInput.fill(''),
      nameInput.fill(`Clock:${genUuid()}`),
      nameInput2.fill(''),
      nameInput2.fill(`Clock:${genUuid()}`)
    ]);

    // Both pages: Fill the "Notes" section with information about the
    // currently running test and its project.
    const testNotes = page.testNotes;
    const notesInput = page.locator('form[name="mctForm"] #notes-textarea');
    const notesInput2 = page2.locator('form[name="mctForm"] #notes-textarea');
    await Promise.all([notesInput.fill(testNotes), notesInput2.fill(testNotes)]);

    // Page 2: Click "OK" to create the domain object and wait for navigation.
    // This will update the composition of the parent folder, setting the
    // conditions for a conflict error from the first page.
    await Promise.all([
      page2.waitForLoadState(),
      page2.click('[aria-label="Save"]'),
      // Wait for Save Banner to appear
      page2.waitForSelector('.c-message-banner__message')
    ]);

    // Close Page 2, we're done with it.
    await page2.close();

    // Page 1: Click "OK" to create the domain object and wait for navigation.
    // This will trigger a conflict error upon attempting to update
    // the composition of the parent folder.
    await Promise.all([
      page.waitForLoadState(),
      page.click('[aria-label="Save"]'),
      // Wait for Save Banner to appear
      page.waitForSelector('.c-message-banner__message')
    ]);

    // Page 1: Verify that the conflict has occurred and an error notification is displayed.
    await expect(
      page.locator('.c-message-banner__message', {
        hasText: 'Conflict detected while saving mine'
      })
    ).toBeVisible();

    // Page 1: Start logging console errors from this point on
    let errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Page 1: Try to create a clock with the page that received the conflict.
    const clockAfterConflict = await createDomainObjectWithDefaults(page, {
      type: 'Clock'
    });

    // Page 1: Wait for save progress dialog to appear/disappear
    await page
      .locator('.c-message-banner__message', {
        hasText:
          'Do not navigate away from this page or close this browser tab while this message is displayed.',
        state: 'visible'
      })
      .waitFor({ state: 'hidden' });

    // Page 1: Navigate to 'My Items' and verify that the second clock was created
    await page.goto('./#/browse/mine');
    await expect(
      page.locator(`.c-grid-item__name[title="${clockAfterConflict.name}"]`)
    ).toBeVisible();

    // Verify no console errors occurred
    expect(errors).toHaveLength(0);
  });
});

test.describe('Form Correctness by Object Type', () => {
  test.fixme('Verify correct behavior of number object (SWG)', async ({ page }) => {});
  test.fixme('Verify correct behavior of number object Timer', async ({ page }) => {});
  test.fixme('Verify correct behavior of number object Plan View', async ({ page }) => {});
  test.fixme('Verify correct behavior of number object Clock', async ({ page }) => {});
  test.fixme('Verify correct behavior of number object Hyperlink', async ({ page }) => {});
});
