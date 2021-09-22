const pw = require('playwright');

(async () => {

    const browser = await pw.chromium.connectOverCDP({
        endpointURL: 'wss://localhost:3003/'
    });

    const context = await browser.newContext({
        httpCredentials: {
            username: '**',
            password: '**'
        }
    });

    const page = await context.newPage();

    try {
        await page.goto('https://browserless.io/');
        await page.screenshot({ path: './browserless.png' });
        browser.close();
    } catch (error) {
        console.error({ error }, 'Something happened!');
        browser.close();
    }
})();
