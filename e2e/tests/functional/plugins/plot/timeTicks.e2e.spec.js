import { expect, test } from '@playwright/test';

import { createDomainObjectWithDefaults, setTimeConductorBounds } from '../../../../appActions.js';

test.describe('Time Tick Generation', () => {
  // Test cases will go here
  let sineWaveGeneratorObject;

  test.beforeEach(async ({ page }) => {
    // Open a browser, navigate to the main page, and wait until all networkevents to resolve
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    sineWaveGeneratorObject = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator'
    });

    // Navigate to Sine Wave Generator
    await page.goto(sineWaveGeneratorObject.url);
  });

  test('Plot time-series ticks are functionally correct over a period of 6 months, between two years', async ({
    page
  }) => {
    const startDate = '2022-09-01';
    const startTime = '22:00:00';
    const endDate = '2023-03-01';
    const endTime = '22:00:30';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    await testYearTimeSeriesTicks(page);
  });

  test('Plot time-series ticks are functionally correct over a period of days', async ({
    page
  }) => {
    const startDate = '2023-03-22';
    const startTime = '00:00:00';
    const endDate = '2023-04-20';
    const endTime = '12:00:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    await testDaysTimeSeriesTicks(page);
  });

  test('Plot time-series ticks are functionally correct over a period of hours', async ({
    page
  }) => {
    const startDate = '2023-03-22';
    const startTime = '01:15:00';
    const endDate = '2023-03-22';
    const endTime = '09:15:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    await testHoursTimeSeriesTicks(page);
  });

  test('Plot time-series ticks are functionally correct over a period of minutes', async ({
    page
  }) => {
    const startDate = '2023-03-22';
    const startTime = '01:15:00';
    const endDate = '2023-03-22';
    const endTime = '01:35:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    await testMinutesTimeSeriesTicks(page);
  });

  test('Plot time-series ticks are functionally correct over a period of seconds', async ({
    page
  }) => {
    const startDate = '2023-03-22';
    const startTime = '01:22:00';
    const endDate = '2023-03-22';
    const endTime = '01:23:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    await testSecondsTimeSeriesTicks(page);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function testYearTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(7);
  await expect(xTicks.nth(0)).toHaveText('2022-09-01');
  await expect(xTicks.nth(1)).toHaveText('2022-10-01');
  await expect(xTicks.nth(2)).toHaveText('2022-11-01');
  await expect(xTicks.nth(3)).toHaveText('2022-12-01');
  await expect(xTicks.nth(4)).toHaveText('2023-01-01');
  await expect(xTicks.nth(5)).toHaveText('2023-02-01');
  await expect(xTicks.nth(6)).toHaveText('2023-03-01');
}

async function testDaysTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(5);
  await expect(xTicks.nth(0)).toHaveText('2023-03-23');
  await expect(xTicks.nth(1)).toHaveText('2023-03-30');
  await expect(xTicks.nth(2)).toHaveText('2023-04-06');
  await expect(xTicks.nth(3)).toHaveText('2023-04-13');
  await expect(xTicks.nth(4)).toHaveText('2023-04-20');
}

async function testHoursTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(4);
  await expect(xTicks.nth(0)).toHaveText('02:00:00');
  await expect(xTicks.nth(1)).toHaveText('04:00:00');
  await expect(xTicks.nth(2)).toHaveText('06:00:00');
  await expect(xTicks.nth(3)).toHaveText('08:00:00');
}

async function testMinutesTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(5);
  await expect(xTicks.nth(0)).toHaveText('01:16:00');
  await expect(xTicks.nth(1)).toHaveText('01:20:00');
  await expect(xTicks.nth(2)).toHaveText('01:24:00');
  await expect(xTicks.nth(3)).toHaveText('01:28:00');
  await expect(xTicks.nth(4)).toHaveText('01:32:00');
}

async function testSecondsTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(7);
  await expect(xTicks.nth(0)).toHaveText('01:22:00');
  await expect(xTicks.nth(1)).toHaveText('01:22:10');
  await expect(xTicks.nth(2)).toHaveText('01:22:20');
  await expect(xTicks.nth(3)).toHaveText('01:22:30');
  await expect(xTicks.nth(4)).toHaveText('01:22:40');
  await expect(xTicks.nth(5)).toHaveText('01:22:50');
  await expect(xTicks.nth(6)).toHaveText('01:23:00');
}
