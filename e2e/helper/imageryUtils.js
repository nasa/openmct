import { createDomainObjectWithDefaults } from '../appActions.js';
import { expect } from '../pluginFixtures.js';

const IMAGE_LOAD_DELAY = 5 * 1000;
const FIVE_MINUTES = 1000 * 60 * 5;
const THIRTY_SECONDS = 1000 * 30;
const MOUSE_WHEEL_DELTA_Y = 120;

/**
 * @param {import('@playwright/test').Page} page
 */
async function createImageryViewWithShortDelay(page, { name, parent }) {
  await createDomainObjectWithDefaults(page, {
    name,
    type: 'Example Imagery',
    parent
  });

  await expect(page.locator('.l-browse-bar__object-name')).toContainText('Unnamed Example Imagery');
  await page.getByLabel('More actions').click();
  await page.getByLabel('Edit Properties').click();
  // Clear and set Image load delay to minimum value
  await page.locator('input[type="number"]').fill(`${IMAGE_LOAD_DELAY}`);
  await page.getByLabel('Save').click();
}

export {
  createImageryViewWithShortDelay,
  FIVE_MINUTES,
  IMAGE_LOAD_DELAY,
  MOUSE_WHEEL_DELTA_Y,
  THIRTY_SECONDS
};
