const pw = require('playwright');

(async () => {

    const browser = await pw.chromium.connectOverCDP({
        endpointURL: 'wss://**/browserless/',
        headers: {
            'Authorization': 'Basic **'
        }
    });

    const context = await browser.newContext({
        /*httpCredentials: {
            username: '**',
            password: '**'
        },*/
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    try {
        await page.goto('**');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: './browserless.png' });
        browser.close();
    } catch (error) {
        console.error({ error }, 'Something happened!');
        browser.close();
    }
})();
