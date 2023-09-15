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
 * @private
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

// eslint-disable-next-line no-undef
module.exports = {
  expect,
  setFixedTimeMode,
  setRealTimeMode,
  setStartOffset,
  setEndOffset,
  setTimeConductorBounds,
  setIndependentTimeConductorBounds
};
