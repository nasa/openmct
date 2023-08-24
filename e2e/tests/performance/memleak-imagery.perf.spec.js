const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { findLeaks, BrowserInteractionResultReader } = require('@memlab/api');

const filePath = 'e2e/test-data/PerformanceDisplayLayout.json';
const snapshotPath = 'e2e/test-data/heapsnapshots/data/cur/';

test.describe.only('Memory Performance tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(3 * 1000);
    await forceGC(page);
    await captureHeapSnapshot(page, snapshotPath + 's1.heapsnapshot');

    // Get and compare JSHeapUsedSize at different points in the test
    let heapSize = await getHeapSize(page);
    console.log(`Initial JSHeapUsedSize: ${heapSize}`);

    await page.locator('a:has-text("My Items")').click({ button: 'right' });
    await page.locator('text=Import from JSON').click();
    await page.setInputFiles('#fileElem', filePath);
    await page.locator('text=OK').click();
    await expect(
      page.locator('a:has-text("Performance Display Layout Display Layout")')
    ).toBeVisible();
  });

  test('Embedded View Large for Imagery is performant in Fixed Time', async ({ page }) => {
    await page.locator('[aria-label="OpenMCT Search"] input[type="search"]').click();
    await page
      .locator('[aria-label="OpenMCT Search"] input[type="search"]')
      .fill('Performance Display Layout');
    await Promise.all([
      page.waitForNavigation(),
      page.locator('a:has-text("Performance Display Layout")').first().click()
    ]);

    await page.waitForSelector('.c-imagery__main-image__bg', { state: 'visible' });
    await page.waitForSelector('.c-imagery__main-image__background-image', { state: 'visible' });
    await page.waitForTimeout(3 * 1000);
    await forceGC(page);
    await captureHeapSnapshot(page, snapshotPath + 's2.heapsnapshot');
    // Get and compare JSHeapUsedSize at different points in the test
    let heapSize = await getHeapSize(page);
    console.log(`second JSHeapUsedSize: ${heapSize}`);
  });

  test.afterEach(async ({ page }) => {
    await page.goto(
      './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(3 * 1000);
    await forceGC(page);
    await captureHeapSnapshot(page, snapshotPath + 's3.heapsnapshot');

    // Get and compare JSHeapUsedSize at different points in the test
    let heapSize = await getHeapSize(page);
    console.log(`Final JSHeapUsedSize: ${heapSize}`);

    const reader = BrowserInteractionResultReader.from(snapshotPath);
    const leaks = await findLeaks(reader);
    console.log('Leaks:', leaks);
  });
});

// Function to get JSHeapUsedSize
function getHeapSize(page) {
  return page.evaluate(() => {
    if (window.performance && window.performance.memory) {
      return window.performance.memory.usedJSHeapSize;
    }
    return null;
  });
}

async function forceGC(page, repeat = 6) {
  const client = await page.context().newCDPSession(page);
  for (let i = 0; i < repeat; i++) {
    await client.send('HeapProfiler.collectGarbage');
    // wait for a while and let GC do the job
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1400);
}

async function captureHeapSnapshot(page, outputPath) {
  const client = await page.context().newCDPSession(page);

  const dir = path.dirname(outputPath);
  console.log(`Output Path: ${outputPath}`);
  console.log(`Directory: ${dir}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const chunks = [];

  function dataHandler(data) {
    chunks.push(data.chunk);
  }

  function progressHandler(data) {
    const percent = Math.floor((100 * data.done) / data.total);
    console.log(`heap snapshot ${percent}% complete`);
  }

  try {
    client.on('HeapProfiler.addHeapSnapshotChunk', dataHandler);
    client.on('HeapProfiler.reportHeapSnapshotProgress', progressHandler);

    await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: true });

    client.removeListener('HeapProfiler.addHeapSnapshotChunk', dataHandler);
    client.removeListener('HeapProfiler.reportHeapSnapshotProgress', progressHandler);

    const fullSnapshot = chunks.join('');
    fs.writeFileSync(outputPath, fullSnapshot, { encoding: 'UTF-8' });
  } catch (error) {
    console.error('Error while capturing heap snapshot:', error);
  } finally {
    await client.detach();
  }
}
