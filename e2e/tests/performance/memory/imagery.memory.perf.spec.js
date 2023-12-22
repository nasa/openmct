const fs = require('fs');
const path = require('path');
const { forceGC, getHeapSize, test, expect } = require('../../../avpFixtures.js');
const { createDomainObjectWithDefaults } = require('../../../appActions.js');
const filePath = 'e2e/test-data/PerformanceDisplayLayout.json';
const snapshotPath = 'e2e/test-data/heapsnapshots/data/cur/';

//Constants for URL handling in the Performance Tests
// We want 5 seconds in the past and 1 second in the future
const startDelta = 5 * 1000;
const endDelta = 1 * 1000;

// saturation period that all telemetry has been loaded into memory
const saturationPeriod = startDelta + endDelta;

const timeBetweenSnapshots = 2 * 1000;

// test.describe('Memory Performance tests', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto(
//       './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000',
//       { waitUntil: 'domcontentloaded' }
//     );
//     await page.waitForTimeout(3 * 1000);
//     await forceGC(page);
//     await captureHeapSnapshot(page, snapshotPath + 's1.heapsnapshot');

//     // Get and compare JSHeapUsedSize at different points in the test
//     let heapSize = await getHeapSize(page);
//     console.log(`Initial JSHeapUsedSize: ${heapSize}`);

//     await page.locator('a:has-text("My Items")').click({ button: 'right' });
//     await page.locator('text=Import from JSON').click();
//     await page.setInputFiles('#fileElem', filePath);
//     await page.locator('text=OK').click();
//     await expect(
//       page.locator('a:has-text("Performance Display Layout Display Layout")')
//     ).toBeVisible();
//   });

//   test('Embedded View Large for Imagery is performant in Fixed Time', async ({ page }) => {
//     await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
//     await page
//       .locator('[aria-label="OpenMCT Search"] input[type="search"]')
//       .fill('Performance Display Layout');
//     await Promise.all([
//       page.waitForNavigation(),
//       page.locator('a:has-text("Performance Display Layout")').first().click()
//     ]);

//     await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible' });
//     await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible' });
//     await page.waitForTimeout(3 * 1000);
//     await forceGC(page);
//     await captureHeapSnapshot(page, snapshotPath + 's2.heapsnapshot');
//     // Get and compare JSHeapUsedSize at different points in the test
//     let heapSize = await getHeapSize(page);
//     console.log(`second JSHeapUsedSize: ${heapSize}`);
//   });

//   test.afterEach(async ({ page }) => {
//     await page.goto(
//       './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000',
//       { waitUntil: 'domcontentloaded' }
//     );
//     await page.waitForTimeout(3 * 1000);
//     await forceGC(page);
//     await captureHeapSnapshot(page, snapshotPath + 's3.heapsnapshot');

//     // Get and compare JSHeapUsedSize at different points in the test
//     let heapSize = await getHeapSize(page);
//     console.log(`Final JSHeapUsedSize: ${heapSize}`);

//     const reader = BrowserInteractionResultReader.from(snapshotPath);
//     const leaks = await findLeaks(reader);
//     console.log('Leaks:', leaks);
//   });
// });

test.describe.only('Performance - Telemetry Memory Tests', () => {
  let overlayPlot;
  let alphaSineWave;
  let baseHeapSize;
  let heapSizes;

  test.beforeEach(async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    overlayPlot = await createDomainObjectWithDefaults(page, {
      type: 'Overlay Plot'
    });

    alphaSineWave = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Alpha Sine Wave',
      parent: overlayPlot.uuid
    });

    await page.goto(overlayPlot.url);

    await page.waitForTimeout(3 * 1000);
    await forceGC(page);
    // Get and compare JSHeapUsedSize at different points in the test
    const initialHeapSize = await getHeapSize(page);
    console.log(`Initial JSHeapUsedSize: ${initialHeapSize}`);
  });

  test('Plots memory does not grow unbounded', async ({ page }) => {
    await page.goto(
      `${overlayPlot.url}?tc.mode=local&tc.startDelta=${startDelta}&tc.endDelta=${endDelta}&tc.timeSystem=utc&view=grid`,
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForTimeout(saturationPeriod);

    await forceGC(page);
    baseHeapSize = await getHeapSize(page);
    console.log(`Initial JSHeapUsedSize: ${baseHeapSize}`);

    heapSizes = [];
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(timeBetweenSnapshots);
      await forceGC(page);
      const heapSize = await getHeapSize(page);
      console.log(`Heap Size at iteration ${i}: ${heapSize}`);
      heapSizes.push(heapSize);
    }
  });

  test.afterEach(async ({ page }) => {
    heapSizes.forEach(heapSize => {
      expect(heapSize).toBeLessThanOrEqual(baseHeapSize);
    });
  });
});

