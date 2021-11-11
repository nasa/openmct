const { test, expect } = require('@playwright/test');

test('Verify that a Folder Object can be created and once created in edit mode', async ({ page }) => {
    //Go to base URL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the Create Folder button
    await page.click(':nth-match(:text("Folder"), 2)');

    // Select the Folder Name field
    await page.click('input[name="mctControl"]');

    // Call the New Folder Object
    await page.fill('input[name="mctControl"]', 'New Folder');

    // Save to Root of Tree
    await page.click('mct-tree span span');

    // Click OK Button to close Dialogue
    await page.click('text=OK');

    // Verify that New Folder appears on the browser bar
    const locator = page.locator('.l-browse-bar__object-name--w');
    await expect(locator).toHaveText(/New Folder/);

});
