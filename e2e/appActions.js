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
 * The fixtures in this file are to be used to consolidate common actions performed by the
 * various test suites. The goal is only to avoid duplication of code across test suites and not to abstract
 * away the underlying functionality of the application. For more about the App Action pattern, see /e2e/README.md)
 *
 * For example, if two functions are nearly identical in
 * timer.e2e.spec.js and notebook.e2e.spec.js, that function should be generalized and moved into this file.
 */

/**
 * Defines parameters to be used in the creation of a domain object.
 * @typedef {Object} CreateObjectOptions
 * @property {string} type the type of domain object to create (e.g.: "Sine Wave Generator").
 * @property {string} [name] the desired name of the created domain object.
 * @property {string | import('../src/api/objects/ObjectAPI').Identifier} [parent] the Identifier or uuid of the parent object.
 * @property {Object<string, string>} [customParameters] any additional parameters to be passed to the domain object's form. E.g. '[aria-label="Data Rate (hz)"]': {'0.1'}
 */

/**
 * Contains information about the newly created domain object.
 * @typedef {Object} CreatedObjectInfo
 * @property {string} name the name of the created object
 * @property {string} uuid the uuid of the created object
 * @property {string} url the relative url to the object (for use with `page.goto()`)
 */

/**
 * Defines parameters to be used in the creation of a notification.
 * @typedef {Object} CreateNotificationOptions
 * @property {string} message the message
 * @property {'info' | 'alert' | 'error'} severity the severity
 * @property {import('../src/api/notifications/NotificationAPI').NotificationOptions} [notificationOptions] additional options
 */

const Buffer = require('buffer').Buffer;
const genUuid = require('uuid').v4;
const { expect } = require('@playwright/test');

/**
 * This common function creates a domain object with the default options. It is the preferred way of creating objects
 * in the e2e suite when uninterested in properties of the objects themselves.
 *
 * @param {import('@playwright/test').Page} page
 * @param {CreateObjectOptions} options
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the newly created domain object.
 */
async function createDomainObjectWithDefaults(
  page,
  { type, name, parent = 'mine', customParameters = {} }
) {
  if (!name) {
    name = `${type}:${genUuid()}`;
  }

  const parentUrl = await getHashUrlToDomainObject(page, parent);

  // Navigate to the parent object. This is necessary to create the object
  // in the correct location, such as a folder, layout, or plot.
  await page.goto(`${parentUrl}`);

  //Click the Create button
  await page.click('button:has-text("Create")');

  // Click the object specified by 'type'
  await page.click(`li[role='menuitem']:text("${type}")`);

  // Modify the name input field of the domain object to accept 'name'
  const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
  await nameInput.fill('');
  await nameInput.fill(name);

  if (page.testNotes) {
    // Fill the "Notes" section with information about the
    // currently running test and its project.
    const notesInput = page.locator('form[name="mctForm"] #notes-textarea');
    await notesInput.fill(page.testNotes);
  }

  // If there are any further parameters, fill them in
  for (const [key, value] of Object.entries(customParameters)) {
    const input = page.locator(`form[name="mctForm"] ${key}`);
    await input.fill('');
    await input.fill(value);
  }

  // Click OK button and wait for Navigate event
  await Promise.all([
    page.waitForLoadState(),
    page.click('[aria-label="Save"]'),
    // Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);

  // Wait until the URL is updated
  await page.waitForURL(`**/${parent}/*`);
  const uuid = await getFocusedObjectUuid(page);
  const objectUrl = await getHashUrlToDomainObject(page, uuid);

  if (await _isInEditMode(page, uuid)) {
    // Save (exit edit mode)
    await page.locator('button[title="Save"]').click();
    await page.locator('li[title="Save and Finish Editing"]').click();
  }

  return {
    name,
    uuid,
    url: objectUrl
  };
}

/**
 * Generate a notification with the given options.
 * @param {import('@playwright/test').Page} page
 * @param {CreateNotificationOptions} createNotificationOptions
 */
async function createNotification(page, createNotificationOptions) {
  await page.evaluate((_createNotificationOptions) => {
    const { message, severity, options } = _createNotificationOptions;
    const notificationApi = window.openmct.notifications;
    if (severity === 'info') {
      notificationApi.info(message, options);
    } else if (severity === 'alert') {
      notificationApi.alert(message, options);
    } else {
      notificationApi.error(message, options);
    }
  }, createNotificationOptions);
}

/**
 * Expand an item in the tree by a given object name.
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function expandTreePaneItemByName(page, name) {
  const treePane = page.getByRole('tree', {
    name: 'Main Tree'
  });
  const treeItem = treePane.locator(`role=treeitem[expanded=false][name=/${name}/]`);
  const expandTriangle = treeItem.locator('.c-disclosure-triangle');
  await expandTriangle.click();
}

/**
 * Create a Plan object from JSON with the provided options.
 * @param {import('@playwright/test').Page} page
 * @param {*} options
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the newly created domain object.
 */
async function createPlanFromJSON(page, { name, json, parent = 'mine' }) {
  if (!name) {
    name = `Plan:${genUuid()}`;
  }

  const parentUrl = await getHashUrlToDomainObject(page, parent);

  // Navigate to the parent object. This is necessary to create the object
  // in the correct location, such as a folder, layout, or plot.
  await page.goto(`${parentUrl}`);

  // Click the Create button
  await page.click('button:has-text("Create")');

  // Click 'Plan' menu option
  await page.click(`li:text("Plan")`);

  // Modify the name input field of the domain object to accept 'name'
  const nameInput = page.getByLabel('Title', { exact: true });
  await nameInput.fill('');
  await nameInput.fill(name);

  // Upload buffer from memory
  await page.locator('input#fileElem').setInputFiles({
    name: 'plan.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(JSON.stringify(json))
  });

  // Click OK button and wait for Navigate event
  await Promise.all([
    page.waitForLoadState(),
    page.click('[aria-label="Save"]'),
    // Wait for Save Banner to appear
    page.waitForSelector('.c-message-banner__message')
  ]);

  // Wait until the URL is updated
  await page.waitForURL(`**/${parent}/*`);
  const uuid = await getFocusedObjectUuid(page);
  const objectUrl = await getHashUrlToDomainObject(page, uuid);

  return {
    uuid,
    name,
    url: objectUrl
  };
}

/**
 * Create a standardized Telemetry Object (Sine Wave Generator) for use in visual tests
 * and tests against plotting telemetry (e.g. logPlot tests).
 * @param {import('@playwright/test').Page} page
 * @param {string | import('../src/api/objects/ObjectAPI').Identifier} [parent] the uuid or identifier of the parent object. Defaults to 'mine'
 * @returns {Promise<CreatedObjectInfo>} An object containing information about the telemetry object.
 */
async function createExampleTelemetryObject(page, parent = 'mine') {
  const parentUrl = await getHashUrlToDomainObject(page, parent);
  // TODO: Make this field even more accessible
  const name = 'VIPER Rover Heading';
  const nameInputLocator = page.getByRole('dialog').locator('input[type="text"]');

  await page.goto(`${parentUrl}`);

  await page.locator('button:has-text("Create")').click();

  await page.locator('li:has-text("Sine Wave Generator")').click();

  await nameInputLocator.fill(name);

  // Fill out the fields with default values
  await page.getByRole('spinbutton', { name: 'Period' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Amplitude' }).fill('1');
  await page.getByRole('spinbutton', { name: 'Offset' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Data Rate (hz)' }).fill('1');
  await page.getByRole('spinbutton', { name: 'Phase (radians)' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Randomness' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Loading Delay (ms)' }).fill('0');

  await page.getByRole('button', { name: 'Save' }).click();

  // Wait until the URL is updated
  await page.waitForURL(`**/${parent}/*`);

  const uuid = await getFocusedObjectUuid(page);
  const url = await getHashUrlToDomainObject(page, uuid);

  return {
    name,
    uuid,
    url
  };
}

/**
 * Navigates directly to a given object url, in fixed time mode, with the given start and end bounds.
 * @param {import('@playwright/test').Page} page
 * @param {string} url The url to the domainObject
 * @param {string | number} start The starting time bound in milliseconds since epoch
 * @param {string | number} end The ending time bound in milliseconds since epoch
 */
async function navigateToObjectWithFixedTimeBounds(page, url, start, end) {
  await page.goto(
    `${url}?tc.mode=fixed&tc.timeSystem=utc&tc.startBound=${start}&tc.endBound=${end}`
  );
}

/**
 * Open the given `domainObject`'s context menu from the object tree.
 * Expands the path to the object and scrolls to it if necessary.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url the url to the object
 */
async function openObjectTreeContextMenu(page, url) {
  await page.goto(url);
  await page.click('button[title="Show selected item in tree"]');
  await page.locator('.is-navigated-object').click({
    button: 'right'
  });
}

/**
 * Expands the entire object tree (every expandable tree item).
 * @param {import('@playwright/test').Page} page
 * @param {"Main Tree" | "Create Modal Tree"} [treeName="Main Tree"]
 */
async function expandEntireTree(page, treeName = 'Main Tree') {
  const treeLocator = page.getByRole('tree', {
    name: treeName
  });
  const collapsedTreeItems = treeLocator
    .getByRole('treeitem', {
      expanded: false
    })
    .locator('span.c-disclosure-triangle.is-enabled');

  while ((await collapsedTreeItems.count()) > 0) {
    await collapsedTreeItems.nth(0).click();

    // FIXME: Replace hard wait with something event-driven.
    // Without the wait, this fails periodically due to a race condition
    // with Vue rendering (loop exits prematurely).
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
}

/**
 * Gets the UUID of the currently focused object by parsing the current URL
 * and returning the last UUID in the path.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} the uuid of the focused object
 */
async function getFocusedObjectUuid(page) {
  const UUIDv4Regexp = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
  const focusedObjectUuid = await page.evaluate((regexp) => {
    return window.location.href.split('?')[0].match(regexp).at(-1);
  }, UUIDv4Regexp);

  return focusedObjectUuid;
}

/**
 * Returns the hashUrl to the domainObject given its uuid.
 * Useful for directly navigating to the given domainObject.
 *
 * URLs returned will be of the form `'./browse/#/mine/<uuid0>/<uuid1>/...'`
 *
 * @param {import('@playwright/test').Page} page
 * @param {string | import('../src/api/objects/ObjectAPI').Identifier} identifier the uuid or identifier of the object to get the url for
 * @returns {Promise<string>} the url of the object
 */
async function getHashUrlToDomainObject(page, identifier) {
  await page.waitForLoadState('load');
  const hashUrl = await page.evaluate(async (objectIdentifier) => {
    const path = await window.openmct.objects.getOriginalPath(objectIdentifier);
    let url =
      './#/browse/' +
      [...path]
        .reverse()
        .map((object) => window.openmct.objects.makeKeyString(object.identifier))
        .join('/');

    // Drop the vestigial '/ROOT' if it exists
    if (url.includes('/ROOT')) {
      url = url.split('/ROOT').join('');
    }

    return url;
  }, identifier);

  return hashUrl;
}

/**
 * Utilizes the OpenMCT API to detect if the UI is in Edit mode.
 * @private
 * @param {import('@playwright/test').Page} page
 * @param {string | import('../src/api/objects/ObjectAPI').Identifier} identifier
 * @return {Promise<boolean>} true if the Open MCT is in Edit Mode
 */
async function _isInEditMode(page, identifier) {
  // eslint-disable-next-line no-return-await
  return await page.evaluate(() => window.openmct.editor.isEditing());
}

/**
 * Set the time conductor mode to either fixed timespan or realtime mode.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} [isFixedTimespan=true] true for fixed timespan mode, false for realtime mode; default is true
 */
async function setTimeConductorMode(page, isFixedTimespan = true) {
  // Click 'mode' button
  await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();
  await page.getByRole('button', { name: 'Time Conductor Mode Menu' }).click();
  // Switch time conductor mode
  if (isFixedTimespan) {
    await page.getByRole('menuitem', { name: /Fixed Timespan/ }).click();
  } else {
    await page.getByRole('menuitem', { name: /Real-Time/ }).click();
  }
}

/**
 * Set the time conductor to fixed timespan mode
 * @param {import('@playwright/test').Page} page
 */
async function setFixedTimeMode(page) {
  await setTimeConductorMode(page, true);
}

/**
 * Set the time conductor to realtime mode
 * @param {import('@playwright/test').Page} page
 */
async function setRealTimeMode(page) {
  await setTimeConductorMode(page, false);
}

/**
 * @typedef {Object} OffsetValues
 * @property {string | undefined} startHours
 * @property {string | undefined} startMins
 * @property {string | undefined} startSecs
 * @property {string | undefined} endHours
 * @property {string | undefined} endMins
 * @property {string | undefined} endSecs
 */

/**
 * Set the values (hours, mins, secs) for the TimeConductor offsets when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 * @param {import('@playwright/test').Locator} offsetButton
 */
async function setTimeConductorOffset(
  page,
  { startHours, startMins, startSecs, endHours, endMins, endSecs }
) {
  if (startHours) {
    await page.getByRole('spinbutton', { name: 'Start offset hours' }).fill(startHours);
  }

  if (startMins) {
    await page.getByRole('spinbutton', { name: 'Start offset minutes' }).fill(startMins);
  }

  if (startSecs) {
    await page.getByRole('spinbutton', { name: 'Start offset seconds' }).fill(startSecs);
  }

  if (endHours) {
    await page.getByRole('spinbutton', { name: 'End offset hours' }).fill(endHours);
  }

  if (endMins) {
    await page.getByRole('spinbutton', { name: 'End offset minutes' }).fill(endMins);
  }

  if (endSecs) {
    await page.getByRole('spinbutton', { name: 'End offset seconds' }).fill(endSecs);
  }

  // Click the check button
  await page.locator('.pr-time-input--buttons .icon-check').click();
}

/**
 * Set the values (hours, mins, secs) for the start time offset when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 */
async function setStartOffset(page, offset) {
  // Click 'mode' button
  await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();
  await setTimeConductorOffset(page, offset);
}

/**
 * Set the values (hours, mins, secs) for the end time offset when in realtime mode
 * @param {import('@playwright/test').Page} page
 * @param {OffsetValues} offset
 */
async function setEndOffset(page, offset) {
  // Click 'mode' button
  await page.getByRole('button', { name: 'Time Conductor Mode', exact: true }).click();
  await setTimeConductorOffset(page, offset);
}

/**
 * Set the time conductor bounds in fixed time mode
 *
 * NOTE: Unless explicitly testing the Time Conductor itself, it is advised to instead
 * navigate directly to the object with the desired time bounds using `navigateToObjectWithFixedTimeBounds()`.
 * @param {import('@playwright/test').Page} page
 * @param {string} startDate
 * @param {string} endDate
 */
async function setTimeConductorBounds(page, startDate, endDate) {
  // Bring up the time conductor popup
  expect(await page.locator('.l-shell__time-conductor.c-compact-tc').count()).toBe(1);
  await page.click('.l-shell__time-conductor.c-compact-tc');

  await setTimeBounds(page, startDate, endDate);

  await page.keyboard.press('Enter');
}

/**
 * Set the independent time conductor bounds in fixed time mode
 * @param {import('@playwright/test').Page} page
 * @param {string} startDate
 * @param {string} endDate
 */
async function setIndependentTimeConductorBounds(page, startDate, endDate) {
  // Activate Independent Time Conductor in Fixed Time Mode
  await page.getByRole('switch').click();

  // Bring up the time conductor popup
  await page.click('.c-conductor-holder--compact .c-compact-tc');
  await expect(page.locator('.itc-popout')).toBeInViewport();

  await setTimeBounds(page, startDate, endDate);

  await page.keyboard.press('Enter');
}

/**
 * Set the bounds of the visible conductor in fixed time mode
 * @param {import('@playwright/test').Page} page
 * @param {string} startDate
 * @param {string} endDate
 */
async function setTimeBounds(page, startDate, endDate) {
  if (startDate) {
    // Fill start time
    await page
      .getByRole('textbox', { name: 'Start date' })
      .fill(startDate.toString().substring(0, 10));
    await page
      .getByRole('textbox', { name: 'Start time' })
      .fill(startDate.toString().substring(11, 19));
  }

  if (endDate) {
    // Fill end time
    await page.getByRole('textbox', { name: 'End date' }).fill(endDate.toString().substring(0, 10));
    await page
      .getByRole('textbox', { name: 'End time' })
      .fill(endDate.toString().substring(11, 19));
  }
}

/**
 * Selects an inspector tab based on the provided tab name
 *
 * @param {import('@playwright/test').Page} page
 * @param {String} name the name of the tab
 */
async function selectInspectorTab(page, name) {
  const inspectorTabs = page.getByRole('tablist');
  const inspectorTab = inspectorTabs.getByTitle(name);
  await inspectorTab.click();
}

/**
 * Waits and asserts that all plot series data on the page
 * is loaded and drawn.
 *
 * In lieu of a better way to detect when a plot is done rendering,
 * we [attach a class to the '.gl-plot' element](https://github.com/nasa/openmct/blob/5924d7ea95a0c2d4141c602a3c7d0665cb91095f/src/plugins/plot/MctPlot.vue#L27)
 * once all pending series data has been loaded. The following appAction retrieves
 * all plots on the page and waits up to the default timeout for the class to be
 * attached to each plot.
 * @param {import('@playwright/test').Page} page
 */
async function waitForPlotsToRender(page) {
  const plotLocator = page.locator('.gl-plot');
  for (const plot of await plotLocator.all()) {
    await expect(plot).toHaveClass(/js-series-data-loaded/);
  }
}

/**
 * @typedef {Object} PlotPixel
 * @property {number} r The value of the red channel (0-255)
 * @property {number} g The value of the green channel (0-255)
 * @property {number} b The value of the blue channel (0-255)
 * @property {number} a The value of the alpha channel (0-255)
 * @property {string} strValue The rgba string value of the pixel
 */

/**
 * Wait for all plots to render and then retrieve and return an array
 * of canvas plot pixel data (RGBA values).
 * @param {import('@playwright/test').Page} page
 * @param {string} canvasSelector The selector for the canvas element
 * @return {Promise<PlotPixel[]>}
 */
async function getCanvasPixels(page, canvasSelector) {
  const getTelemValuePromise = new Promise((resolve) =>
    page.exposeFunction('getCanvasValue', resolve)
  );
  const canvasHandle = await page.evaluateHandle(
    (canvas) => document.querySelector(canvas),
    canvasSelector
  );
  const canvasContextHandle = await page.evaluateHandle(
    (canvas) => canvas.getContext('2d'),
    canvasHandle
  );

  await waitForPlotsToRender(page);
  await page.evaluate(
    ([canvas, ctx]) => {
      // The document canvas is where the plot points and lines are drawn.
      // The only way to access the canvas is using document (using page.evaluate)
      /** @type {ImageData} */
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      /** @type {number[]} */
      const imageDataValues = Object.values(data);
      /** @type {PlotPixel[]} */
      const plotPixels = [];
      // Each pixel consists of four values within the ImageData.data array. The for loop iterates by multiples of four.
      // The values associated with each pixel are R (red), G (green), B (blue), and A (alpha), in that order.
      for (let i = 0; i < imageDataValues.length; ) {
        if (imageDataValues[i] > 0) {
          plotPixels.push({
            r: imageDataValues[i],
            g: imageDataValues[i + 1],
            b: imageDataValues[i + 2],
            a: imageDataValues[i + 3],
            strValue: `rgb(${imageDataValues[i]}, ${imageDataValues[i + 1]}, ${
              imageDataValues[i + 2]
            }, ${imageDataValues[i + 3]})`
          });
        }

        i = i + 4;
      }

      window.getCanvasValue(plotPixels);
    },
    [canvasHandle, canvasContextHandle]
  );

  return getTelemValuePromise;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} myItemsFolderName
 * @param {string} url
 * @param {string} newName
 */
async function renameObjectFromContextMenu(page, url, newName) {
  await openObjectTreeContextMenu(page, url);
  await page.click('li:text("Edit Properties")');
  const nameInput = page.getByLabel('Title', { exact: true });
  await nameInput.fill('');
  await nameInput.fill(newName);
  await page.click('[aria-label="Save"]');
}

// eslint-disable-next-line no-undef
module.exports = {
  createDomainObjectWithDefaults,
  createExampleTelemetryObject,
  createNotification,
  createPlanFromJSON,
  expandEntireTree,
  expandTreePaneItemByName,
  getCanvasPixels,
  getHashUrlToDomainObject,
  getFocusedObjectUuid,
  navigateToObjectWithFixedTimeBounds,
  openObjectTreeContextMenu,
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset,
  setEndOffset,
  setTimeConductorBounds,
  setIndependentTimeConductorBounds,
  selectInspectorTab,
  waitForPlotsToRender,
  renameObjectFromContextMenu
};
