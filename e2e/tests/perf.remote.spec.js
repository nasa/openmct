const pw = require('playwright');

(async () => {

    const browser = await pw.chromium.connectOverCDP({
        options: {
            logger: {
                isEnabled: (name, severity) => name === 'browser',
                log: (name, severity, message, args) => console.log(`${name} ${message}`)
            }
        },
        endpointURL: 'wss://chrome.browserless.io/token='
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://browserless.io', { waitUntil: 'networkidle' });
        await page.screenshot({ path: './browserless.png' });
        browser.close();
    } catch (error) {
        console.error({ error }, 'Something happened!');
        browser.close();
    }
})();
