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

  test('Plot snaps to 5-minute intervals for an irregular 17-minute range', async ({ page }) => {
    // Range: 01:15:00 to 01:32:00 (17 minutes)
    const startDate = '2023-03-22';
    const startTime = '01:15:00';
    const endDate = '2023-03-22';
    const endTime = '01:32:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    const xTicks = page.locator('.gl-plot-x-tick-label');

    // 5-minute increment
    await expect(xTicks.nth(0)).toHaveText('01:15:00');
    await expect(xTicks.nth(1)).toHaveText('01:20:00');
    await expect(xTicks.nth(2)).toHaveText('01:25:00');
    await expect(xTicks.nth(3)).toHaveText('01:30:00');
  });

  test('Ticks align to round hour boundaries despite off-grid start time', async ({ page }) => {
    // Range starts at 01:13:42
    const startDate = '2023-03-22';
    const startTime = '01:13:42';
    const endDate = '2023-03-22';
    const endTime = '05:13:42';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    const xTicks = page.locator('.gl-plot-x-tick-label');

    await expect(xTicks.nth(0)).toHaveText('01:20:00');
    await expect(xTicks.nth(1)).toHaveText('02:10:00');
    await expect(xTicks.nth(2)).toHaveText('03:00:00');
    await expect(xTicks.nth(3)).toHaveText('03:50:00');
    await expect(xTicks.nth(4)).toHaveText('04:40:00');
  });

  test('Plot utilizes 12-hour snapping for a multi-day range', async ({ page }) => {
    // 48 hour range
    const startDate = '2023-03-22';
    const startTime = '00:00:00';
    const endDate = '2023-03-24';
    const endTime = '00:00:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    const xTicks = page.locator('.gl-plot-x-tick-label');

    // 12-hour increments
    await expect(xTicks.nth(0)).toHaveText('2023-03-22 08:00:00');
    await expect(xTicks.nth(1)).toHaveText('2023-03-22 18:00:00');
    await expect(xTicks.nth(2)).toHaveText('2023-03-23 04:00:00');
    await expect(xTicks.nth(3)).toHaveText('2023-03-23 14:00:00');
    await expect(xTicks.nth(4)).toHaveText('2023-03-24 00:00:00');
  });

  test('Plot reduces tick count when the container is resized to be smaller', async ({ page }) => {
    // 8-hour range
    const startDate = '2023-03-22';
    const startTime = '01:00:00';
    const endDate = '2023-03-22';
    const endTime = '09:00:00';
    await setTimeConductorBounds(page, { startDate, startTime, endDate, endTime });

    const xTicks = page.locator('.gl-plot-x-tick-label');

    const initialCount = await xTicks.count();
    expect(initialCount).toBeGreaterThan(3);

    await page.setViewportSize({ width: 600, height: 600 });

    // Verify that the tick count has decreased to avoid overlap
    await expect
      .poll(async () => {
        const newCount = await xTicks.count();
        return newCount;
      })
      .toBeLessThan(initialCount);
  });
});

/**
 * @param {import('@playwright/test').Page} page
 */
async function testYearTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(4);
  await expect(xTicks.nth(0)).toHaveText('2022-09-01');
  await expect(xTicks.nth(1)).toHaveText('2022-11-01');
  await expect(xTicks.nth(2)).toHaveText('2023-01-01');
  await expect(xTicks.nth(3)).toHaveText('2023-03-01');
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
  await expect(xTicks.nth(0)).toHaveText('01:15:00');
  await expect(xTicks.nth(1)).toHaveText('01:20:00');
  await expect(xTicks.nth(2)).toHaveText('01:25:00');
  await expect(xTicks.nth(3)).toHaveText('01:30:00');
  await expect(xTicks.nth(4)).toHaveText('01:35:00');
}

async function testSecondsTimeSeriesTicks(page) {
  const xTicks = page.locator('.gl-plot-x-tick-label');
  await expect(xTicks).toHaveCount(4);
  await expect(xTicks.nth(0)).toHaveText('01:22:00');
  await expect(xTicks.nth(1)).toHaveText('01:22:20');
  await expect(xTicks.nth(2)).toHaveText('01:22:40');
  await expect(xTicks.nth(3)).toHaveText('01:23:00');
}
