const { test, expect } = require('@playwright/test');

test('Smoke Tests', async ({page}) => {

    await page.goto('');

    await page.click('button:has-text("Create")');

    await page.click('text=Example Imagery');
    await page.waitForTimeout(1000);

    await page.waitForSelector('img');

});
